# Friends Feature — Design

Date: 2026-08-13

## Goal

Let each user (each has their own account/profile) add other users as friends, view their
friends list, view a friend's profile/stats, and see a leaderboard of friends ranked by
experience points.

## Decisions

- **Identity:** users are found via a self-chosen `username` (the "friend code").
- **Add model:** friend request + approval. Adding creates a `pending` request; the other
  user accepts to become friends.
- **Scope (in):** friends list, view friend profile + stats, friend leaderboard.
- **Scope (out):** remove/unfriend, blocking, real-time presence, in-app chat.

## Data Model (Supabase)

### `profiles` — add column

```
username text (unique, case-insensitive)
```

Lowercase alphanumeric + underscore, 3–20 chars.

### `friendships` — new table

```
id            uuid pk default gen_random_uuid()
requester_id  uuid references profiles(id)
addressee_id  uuid references profiles(id)
status        text  ('pending' | 'accepted')
created_at    timestamptz default now()
unique(requester_id, addressee_id)
```

- Add friend = insert row `status='pending'`.
- Approve = update row `status='accepted'`.
- Friends = rows `status='accepted'` where requester_id = me OR addressee_id = me.
- Leaderboard = friends' profiles sorted by `total_exp` desc.

## Username Handling (resolving existing overlap)

Current state: `profiles` has no `username`. Register collects "username" into auth
metadata; SetupProfile saves "username" into `name`; ProfileScreen edits "Display Name"
into `name`.

Resolution:
1. Add `username` column to `profiles` (unique).
2. `RegisterScreen`: pass `username` via `location.state` to setup-profile.
3. `SetupProfileScreen`: rename existing "Username" field to "Display Name" (`name`), add a
   new "Username" field (`username`, the friend code), pre-filled from register state.
4. `ProfileScreen`: add editable "Username" field with uniqueness validation.

## Frontend Structure

- `src/services/friendService.js`:
  - `searchByUsername(username)`
  - `sendFriendRequest(requesterId, addresseeId)`
  - `acceptFriendRequest(id)`, `declineFriendRequest(id)`
  - `getFriends(userId)`
  - `getPendingRequests(userId)` (incoming + outgoing)
  - `getLeaderboard(userId)`
- `src/screens/FriendsScreen.jsx` + `.module.css`: tabs — My Friends / Requests /
  Leaderboard, plus search/add-friend box.
- `src/screens/FriendProfileScreen.jsx` + `.module.css`: read-only friend profile + stats.
- `Sidebar.jsx`: add "Friends" (`Users` icon) → `/friends`.
- `App.jsx`: add routes `/friends` and `/friend/:id` under `ProtectedLayout`.

## Error Handling

- Username not found → "User not found".
- Already friends → "Already friends".
- Request already sent → "Request pending".
- Searching self → blocked with message.

## Verification

- `npm run build` passes.
- Manual: search by username → add → approve → appears in list + leaderboard.
