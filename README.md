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
- **Send Work / Submissions** — submit your work to lecturers and track submissions
- **Lecturer Inbox** — review student submissions (lecturer role)
- **Notifications** — read/receive app notifications

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

### Database

Run the SQL migrations inside the **Supabase SQL editor**, one at a time (found in [`supabase/`](supabase/)):

| Migration | Purpose |
|-----------|---------|
| `semester_migration.sql` | semester start date on profiles |
| `friends_migration.sql` | friend relationships |
| `send_work_migration.sql` | work submissions |
| `notifications_migration.sql` | notifications |
| `ai_chat_migration.sql` | AI chat history |

### Run locally

```bash
npm run dev
```

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
supabase/           # SQL migrations
```
