# Friends Chat + Presence — Design

Date: 2026-08-18

## Goal

Let accepted friends chat with each other in real time — text and photos —
with online/offline presence, a dedicated Messages screen listing all
conversations, and unread badges.

## Decisions

- **Approach A:** dedicated `friend_conversations` + `friend_messages` tables,
  fully separate from the existing submission messaging (`messages` table).
  Zero risk to the working Send Work feature.
- **Real-time:** Supabase Realtime — subscribe to `friend_messages` changes and
  use a Realtime presence channel for online status.
- **Photos:** stored in a new public storage bucket `chat`, uploaded at send
  time; the message row stores the public URL.
- **Unread:** tracked per participant via `last_read_at` columns on the
  conversation row; opening a chat sets the reader's own column.
- **Entry point:** Messages screen (conversation list) + chat icon on each
  friend card in the Friends tab. Chat is only reachable from your friends
  list, so no extra "must be friends" gate is needed in v1.

## Data Model (Supabase)

### `friend_conversations`

```
id                 uuid pk default gen_random_uuid()
user1_id           uuid not null references profiles(id) on delete cascade
user2_id           uuid not null references profiles(id) on delete cascade
last_read_at_user1 timestamptz
last_read_at_user2 timestamptz
last_message_at    timestamptz not null default now()
created_at         timestamptz not null default now()
constraint conversation_canonical_pair check (user1_id < user2_id)
unique (user1_id, user2_id)
```

The pair is canonicalised (`user1_id < user2_id`) so there is exactly one
conversation per pair and the unique constraint can be used with
`on conflict` to create-or-fetch atomically.

### `friend_messages`

```
id              uuid pk default gen_random_uuid()
conversation_id uuid not null references friend_conversations(id) on delete cascade
sender_id       uuid not null references profiles(id) on delete cascade
body            text
image_url       text
created_at      timestamptz not null default now()
```

`body` or `image_url` must be present; a message may have both (a photo with
a caption) or just one. Validate this in the app layer.

### Storage

New public bucket `chat`. Objects stored at `{userId}/{filename}`. Same policy
pattern as `avatars`: authenticated users can upload/update/delete their own
objects; objects are publicly readable.

## RLS

### `friend_conversations`

- `select` — `auth.uid() = user1_id or auth.uid() = user2_id`
- `insert` — `with check (auth.uid() = user1_id or auth.uid() = user2_id)`
- `update` — participants can update the row (used for `last_read_at` and
  `last_message_at`). The app only writes the caller's own `last_read_at`
  column; `last_message_at` is bumped by `sendMessage`.

### `friend_messages`

- `select` — conversation is one of the caller's:
  ```
  exists (
    select 1 from friend_conversations c
    where c.id = conversation_id
      and (c.user1_id = auth.uid() or c.user2_id = auth.uid())
  )
  ```
- `insert` — `sender_id = auth.uid()` AND the conversation belongs to the
  sender (same `exists` check as select).
- `update` / `delete` — none (messages are immutable in v1).

## Realtime

- **Messages:** subscribe to Postgres changes on `friend_messages` filtered by
  `conversation_id` for the open conversation. Realtime respects RLS, so a user
  only receives changes for conversations they belong to.
- **Presence:** a Realtime presence channel (`online-users`) keyed by user id.
  On app open, join with the current `user.id`; on tab close / sign-out, leave.
  Presence is ephemeral — it only reflects users with the app open right now,
  which is the intended meaning of "online".
- **Enablement note (dashboard, not SQL):** the `friend_messages` table must be
  added to Supabase Realtime (Database → Realtime → toggle the table). Presence
  channels work out of the box.

## Frontend

### Services — `src/services/friendChatService.js`

- `getOrCreateConversation(userIdA, userIdB)` — canonicalises the pair and
  inserts with `on conflict ... do nothing`, then returns the row.
- `getConversations(userId)` — list the user's conversations joined with the
  other participant's profile (name, username, photo_url), ordered by
  `last_message_at desc`. Also returns an `unread` count per conversation.
- `getMessages(conversationId)` — messages ascending, joined with sender.
- `sendMessage(conversationId, senderId, body, imageUrl)` — inserts the message
  and bumps `last_message_at`.
- `markRead(conversationId, userId)` — sets the caller's own `last_read_at`.
- `subscribeToMessages(conversationId, callback)` — Realtime
  `postgres_changes` subscription on `friend_messages`.
- `subscribeToPresence(callback)` — Realtime presence channel for online users.

Unread count for a conversation =
`count(friend_messages where sender_id != me and created_at > my last_read_at)`.

### Screens

**`MessagesScreen` (`/messages`)**
- Header with back button; list of conversations (avatar, name, last-message
  preview, relative time, unread badge, online dot).
- Empty state ("No chats yet — open a chat from your Friends list").
- Live: new messages / presence updates refresh the list in place.
- Tap a conversation → `FriendChatScreen`.

**`FriendChatScreen` (`/chat/:friendId`)**
- Bubble UI mirroring `SubmissionThreadScreen` (mine / theirs).
- Text input + Enter to send; camera & gallery buttons to attach a photo
  (upload to `chat` bucket, then `sendMessage` with `image_url`).
- Photo messages render the image (tap to open full size); a small spinner
  while uploading; upload errors surfaced in-chat.
- Real-time subscription appends incoming messages and scrolls to bottom.
- Header shows the friend's name + online dot / "offline".
- On open: `markRead`; on new message while open: `markRead` again.

**Friends tab (`FriendsScreen`)**
- Add a chat icon to each friend card in "My Friends" → `getOrCreateConversation`
  then navigate to `/chat/:friendId`.

**Sidebar (`Sidebar.jsx`)**
- Add a "Messages" menu item → `/messages`.

### Routes

`/messages`, `/chat/:friendId` (both inside the protected layout).

## Edge Cases

- **Race on first open:** `getOrCreateConversation` relies on the unique pair +
  `on conflict do nothing` so two people opening the same first chat cannot
  create duplicate conversations.
- **Photo upload failure:** show the error in-chat, keep the typed text, allow
  retry.
- **Presence limitation:** only reflects currently-open apps (inherent to
  presence). No "last seen" history in v1.
- **Only friends chat:** entry points are the Friends tab and the Messages
  screen, which is populated from conversations — no extra friendship check
  needed in v1.

## Out of Scope (v1)

- Voice notes, reactions, read receipts ("seen"), typing indicators, group
  chats, message editing/deletion, offline history beyond the live page.

## Verification

- `npm run build` passes.
- Manual two-account flow:
  1. User A and B become friends.
  2. A opens B's chat (auto-creates conversation) and sends a text.
  3. B sees it arrive live on `/messages` (unread badge) and in the chat.
  4. B replies with a photo; A sees it live.
  5. Presence: with both apps open, online dots show; closing one clears it.