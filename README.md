# ProjectSkorPlus Web

SkorPlus is a student study companion web app — track your semester progress, practice with past papers, scan & solve questions, chat with an AI study buddy, submit work, and stay connected with friends.

## ✨ Features

### Dashboard
- **Semester Pulse card** — set your semester start date once and it tracks the current week (Week 1 → Week 14 → Study Week → Exam Week), auto-incrementing every 7 days, with an animated progress bar
- **Quick actions** — one-tap cards for **Scan Solve**, **AI Study Buddy**, and **Send Work**
- **Draggable AI FAB** — move the AI button anywhere on screen like iOS Assistive Touch (tap still opens the AI chat)
- **Zep Quiz** — quick practice card linking to quiz.zep.us
- **Module carousel** — view your enrolled modules with per-module progress

### Study Tools
- **Past Papers / Final Exam** — browse past-year papers and take final exams
- **Scan & Solve** — upload or capture a question image and get an AI solution
- **Modules** — module pages with questions and progress tracking
- **Tasks** — study task checklist

### AI Study Buddy
- Chat with an AI assistant tailored for studying (AI-powered explanations and help)

### Social & Collaboration
- **Friends** — add friends and view their profiles/progress
- **Send Work / Submissions** — submit your work to lecturers and track submissions (with **reviewed status** badges)
- **Lecturer Inbox** — review student submissions, mark them reviewed
- **Notifications** — read/receive app notifications

### Lecturer & Admin
- **Verified lecturer signup** — lecturers register with a single-use code (admin-issued)
- **Lecturer dashboard** — students count, submissions stats, pending review, recent submissions
- **Past Papers manager** (`/manage-exams`) — CRUD + PDF upload, students see changes instantly
- **Modules manager** (`/manage-modules`) — CRUD modules (title, description, color, order)
- **Admin screen** (`/admin`) — create/deactivate lecturer codes (requires `role='admin'` on your profile)

## 🛠 Tech Stack

- **React 19** + **Vite 6**
- **React Router 7**
- **Supabase** (auth, database)
- **lucide-react** (icons)
- **CSS Modules** with theme-aware CSS variables

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm
- A Supabase project (with the migrations in [`supabase/`](supabase/) applied)

### Install

```bash
npm install
```

### Configure Supabase

Set up your Supabase URL and anon key in `src/config/supabase.js`:

```js
const supabaseUrl = 'https://YOUR-PROJECT.supabase.co';
const supabaseAnonKey = 'YOUR-ANON-KEY';
```

### Configure AI (OpenRouter)

The AI features (**AI Study Buddy** chat and **Scan & Solve**) run through Vercel serverless functions in [`api/`](api/) that proxy [OpenRouter](https://openrouter.ai). The API key lives only on the server — it is never shipped in the client bundle, and every request must carry a valid Supabase session.

1. Create a key at [openrouter.ai/keys](https://openrouter.ai/keys)
2. Add it to your Vercel project: **Settings → Environment Variables → `OPENROUTER_API_KEY`**
3. Optional — override the AI models with `OPENROUTER_CHAT_MODEL` / `OPENROUTER_VISION_MODEL` (any [OpenRouter model id](https://openrouter.ai/models); default is `z-ai/glm-5.2:free` for both)

See [`.env.example`](.env.example) for the full list of variables.

### Database

Run the SQL migrations inside the **Supabase SQL editor**, one at a time (found in [`supabase/`](supabase/)):

| Migration | Purpose |
|-----------|---------|
| `semester_migration.sql` | semester start date on profiles |
| `friends_migration.sql` | friend relationships |
| `send_work_migration.sql` | work submissions |
| `notifications_migration.sql` | notifications |
| `ai_chat_migration.sql` | AI chat history |
| `lecturer_codes_migration.sql` | lecturer verification codes + verify RPC |
| `content_policies_migration.sql` | lecturer/admin write access for modules & exams + exams PDF bucket |
| `streak_migration.sql` | daily streak column on profiles |
| `tasks_priority_migration.sql` | task priorities |
| `ai_chat_delete_policy.sql` | allow users to clear their AI history |
| `submission_fixes.sql` | submissions storage bucket + status update policy (Mark as Reviewed) |

After running `lecturer_codes_migration.sql`, promote your own account to admin:

```sql
update public.profiles set role = 'admin' where email = 'your-email@example.com';
```

### Run locally

```bash
npm run dev
```

> AI features work locally too — put your `OPENROUTER_API_KEY` in a `.env` file (see [`.env.example`](.env.example)) and the dev server runs the `api/` functions for you.

### Production build

```bash
npm run build
npm run preview
```

The app is also configured for Vercel deployment (`vercel.json` with SPA rewrites).

## 🎨 Theming

SkorPlus ships with three themes — **Light**, **Dark**, and **Soft Pink** — switchable from Settings. All screens use theme-aware CSS variables (see `src/styles/theme.css`), so the entire UI adapts instantly.

## 🧭 Screens & Routing

| Route | Screen |
|-------|--------|
| `/` | Home |
| `/login`, `/email-login`, `/register` | Auth |
| `/onboarding`, `/setup-profile` | Onboarding & profile setup |
| `/dashboard` | Dashboard |
| `/modules`, `/module/:id` | Modules |
| `/question/:moduleId` | Practice questions |
| `/final-exam` | Past papers / final exam |
| `/scan-solve` | Scan & Solve |
| `/ai-chat` | AI Study Buddy |
| `/tasks` | Tasks |
| `/friends`, `/friend/:id` | Friends & profiles |
| `/submit-work`, `/my-submissions`, `/submission/:id` | Submissions |
| `/inbox` | Lecturer inbox |
| `/notifications` | Notifications |
| `/settings`, `/profile` | Settings & profile |
| `/pdf-viewer` | PDF viewer |
| `/set-exam` | Set exam countdown |

## 📁 Project Structure

```
src/
├── components/     # Shared components (Sidebar, Layout, ProtectedRoute…)
├── screens/        # One folder per screen (+ CSS Modules)
├── services/       # Supabase API wrappers (auth, modules, friends…)
├── styles/         # theme.css (tokens), variables.css, global.css
├── config/         # Supabase client config
└── context/        # React context (auth, theme)
api/                # Vercel serverless functions (AI proxies)
supabase/           # SQL migrations
```
