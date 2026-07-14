# ProjectSkor+

**Learn Smarter, Score Better** — A mobile learning platform for students to master calculus through interactive modules, access final exam papers, and get AI-powered answer checking.

---

## Features

### 📚 Interactive Modules
Horizontal card carousel with calculus topics — Vector Calculus, Differentiation, Integration, Limits & Continuity. Each module tracks progress with visual progress bars.

### 📄 Final Exam Papers
Browse past-year exam papers stored in Supabase Storage. View PDFs inline with the built-in viewer and download to your device for offline study.

### 🧮 Scan & Solve (AI-Powered)
Snap a photo of any math problem and get step-by-step solutions instantly. Select an exam paper for context-aware grading — the AI checks your handwritten answers against the expected solutions.

### ⏳ Exam Countdown
Set your final exam date and time with a native date/time picker. The dashboard displays a live countdown so you always know how many days are left.

### ✅ Task Manager
Create daily study tasks, check them off as you complete them, and stay organized. Pending and completed tasks are grouped separately.

### 🎨 Theme System
Three beautiful themes to match your mood:
- ☀️ **Light** — Bright & clean
- 🌙 **Dark** — Easy on the eyes
- 🌸 **Soft Pink** — Warm & cozy

### 📊 Dashboard
At-a-glance stats — total experience, day streak, and completed modules. Pull-to-refresh keeps everything in sync.

---

## Tech Stack

| Layer          | Technology                                      |
|----------------|--------------------------------------------------|
| **Framework**  | React Native (Expo SDK 54)                       |
| **Backend**    | Supabase (Auth, Database, Storage)               |
| **AI**         | OpenAI GPT-4o-mini / Gemini Flash (vision API)   |
| **Navigation** | React Navigation (Stack)                         |
| **Fonts**      | REM + Sen (Google Fonts)                         |
| **Icons**      | Lucide React Native                              |

---

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npx expo`)
- A [Supabase](https://supabase.com) project (free tier)

### Installation

```bash
git clone https://github.com/tenchiift/ProjectSkorPlus.git
cd ProjectSkorPlus
npm install
```

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your **Project URL** and **anon key**
3. Edit `src/config/supabase.js`:

```js
const supabaseUrl = 'https://your-project.supabase.co';
const supabaseAnonKey = 'your-anon-key';
```

4. Open **SQL Editor** and run the migrations in order:
   - `migrations/001_initial_schema.sql` — profiles, modules, module_progress, exams
   - `migrations/002_exam_countdown.sql` — tasks, exam_countdowns

5. Create storage buckets in Supabase:
   - `avatars` (public) — for profile photos
   - `exams` (public) — for exam PDFs

6. Go to **Authentication → Settings** and disable **Confirm email** (for development)

### AI Setup (Scan & Solve)

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys) or [Google AI Studio](https://aistudio.google.com/apikey)
2. Paste it in `src/services/aiService.js`

### Run

```bash
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `w` for web.

---

## Project Structure

```
src/
├── assets/           # Images, fonts, logo
├── components/       # Reusable components
│   └── Sidebar.js    # Animated sidebar drawer
├── config/
│   └── supabase.js   # Supabase client
├── context/
│   └── ThemeContext.js # Theme provider (light/dark/pink)
├── navigation/
│   └── AppNavigator.js # Stack navigator (all routes)
├── screens/
│   ├── HomeScreen.js         # Landing page
│   ├── LoginScreen.js        # Email/password login
│   ├── RegisterScreen.js     # Account creation
│   ├── EmailLoginScreen.js   # Magic link login
│   ├── SetupProfileScreen.js # Initial profile setup
│   ├── OnboardingScreen.js   # Feature tour
│   ├── DashboardScreen.js    # Main dashboard
│   ├── ModuleScreen.js       # Module detail (intro + exercise)
│   ├── AllModulesScreen.js   # All modules with progress
│   ├── FinalExamScreen.js    # Exam papers list
│   ├── PDFViewerScreen.js    # PDF viewer + download
│   ├── ScanSolveScreen.js    # AI-powered scan & solve
│   ├── SetExamScreen.js      # Set exam countdown
│   ├── ProfileScreen.js      # Edit profile
│   ├── SettingsScreen.js     # Settings menu
│   └── TaskScreen.js         # Task manager (CRUD)
├── services/
│   ├── moduleService.js       # Module CRUD (Supabase)
│   ├── userService.js         # User profile CRUD
│   └── aiService.js           # AI vision API call
└── styles/
    └── theme.js               # Light, dark, pink themes
```

---

## Database Schema

| Table              | Purpose                          |
|--------------------|----------------------------------|
| `profiles`         | User profile data                |
| `modules`          | Learning modules (calculus topics)|
| `module_progress`  | Per-user module progress         |
| `exams`            | Final exam papers metadata       |
| `exam_countdowns`  | User-set exam dates & times      |
| `tasks`            | Daily study tasks                |

---

## License

MIT
