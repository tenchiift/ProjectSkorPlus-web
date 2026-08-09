# Expo App → Pure React Web App Conversion Design

> **Goal**: Create a standalone React web app in `web-app/` that replicates every screen, feature, and pixel of the existing Expo React Native app — minus all game-related screens and components. Zero shared code — completely separate codebase. Same Supabase backend, same OpenAI integration.

## Architecture

- **Location**: `/web-app/` inside the ProjectSkorPlus monorepo
- **Stack**: Vite + React 19.1 + React Router 7 + Supabase JS + Lucide React + CSS Modules
- **Build output**: `npm run build` → `web-app/dist/` (deployable static SPA)
- **Dev server**: `npm run dev` → `http://localhost:5173`

## Routing (React Router)

Every route maps 1:1 to the existing Expo Stack.Navigator routes (game routes excluded per user request):

| Path | Screen | Notes |
|------|--------|-------|
| `/` | HomeScreen | Landing page |
| `/login` | LoginScreen | Email/password |
| `/register` | RegisterScreen | Email/password signup |
| `/email-login` | EmailLoginScreen | Magic link auth |
| `/setup-profile` | SetupProfileScreen | Post-registration profile setup |
| `/onboarding` | OnboardingScreen | 3-page carousel (redirects here after profile setup) |
| `/dashboard` | DashboardScreen | Main hub. `gestureEnabled: false` equivalent = replace history entry |
| `/profile` | ProfileScreen | Edit profile, avatar upload |
| `/settings` | SettingsScreen | Theme switcher modal |
| `/modules` | AllModulesScreen | Full module list |
| `/module/:id` | ModuleScreen | Module detail + subscreen list (Game button removed) |
| `/question/:moduleId` | QuestionScreen | Quiz UI |
| `/final-exam` | FinalExamScreen | Past exam papers list |
| `/pdf-viewer` | PDFViewerScreen | PDF viewer via Google Docs iframe |
| `/scan-solve` | ScanSolveScreen | Camera/gallery → AI solve |
| `/set-exam` | SetExamScreen | Set/edit exam countdown |
| `/tasks` | TaskScreen | Todo CRUD |

**Removed routes** (game):
- `/character-select` — CharacterSelectScreen (hero picker)
- `/open-world` — OpenWorldScreen (Phaser open world)
- `/game/:moduleId` — GameScreen (Phaser platformer)

**Auth guard**: A `<ProtectedRoute>` component wraps all routes except `/`, `/login`, `/register`, `/email-login`. Redirects unauthenticated users to `/login`.

**Auth redirect**: If authenticated user visits auth pages (`/login`, `/register`), redirect to `/dashboard`.

## File Structure

```
web-app/
├── index.html
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx                      # ReactDOM.createRoot, wraps App in ThemeProvider
│   ├── App.jsx                       # BrowserRouter + Routes
│   ├── config/
│   │   └── supabase.js               # Supabase client (same project, localStorage auth)
│   ├── context/
│   │   ├── ThemeContext.jsx           # Same light/dark/pink theme provider
│   │   └── AuthContext.jsx            # Auth state via onAuthStateChange
│   ├── styles/
│   │   ├── global.css                # @font-face for REM/Sen, CSS reset
│   │   ├── theme.css                 # CSS custom properties for light/dark/pink
│   │   └── variables.css             # Non-themed constants (spacing, radius, fonts)
│   ├── hooks/
│   │   ├── useAuth.js                # Consumes AuthContext
│   │   └── useTheme.js               # Consumes ThemeContext
│   ├── services/
│   │   ├── aiService.js              # OpenAI — uses fetch+FileReader (NOT expo-file-system)
│   │   ├── moduleService.js          # Same Supabase queries as Expo
│   │   └── userService.js            # Same Supabase queries as Expo
│   ├── data/
│   │   └── vectorQuestions.js        # 5 vector calculus quiz questions
│   ├── components/
│   │   ├── Sidebar.jsx               # CSS transition slide-out menu
│   │   ├── Sidebar.module.css
│   │   ├── ProtectedRoute.jsx        # Auth gate component
│   │   ├── LoadingScreen.jsx         # Full-page spinner
│   │   └── ErrorBoundary.jsx         # Catch rendering errors
│   └── screens/
│       ├── HomeScreen.jsx + .module.css
│       ├── LoginScreen.jsx + .module.css
│       ├── RegisterScreen.jsx + .module.css
│       ├── EmailLoginScreen.jsx + .module.css
│       ├── SetupProfileScreen.jsx + .module.css
│       ├── OnboardingScreen.jsx + .module.css
│       ├── DashboardScreen.jsx + .module.css
│       ├── ProfileScreen.jsx + .module.css
│       ├── SettingsScreen.jsx + .module.css
│       ├── AllModulesScreen.jsx + .module.css
│       ├── ModuleScreen.jsx + .module.css
│       ├── QuestionScreen.jsx + .module.css
│       ├── FinalExamScreen.jsx + .module.css
│       ├── PDFViewerScreen.jsx + .module.css
│       ├── ScanSolveScreen.jsx + .module.css
│       ├── SetExamScreen.jsx + .module.css
│       └── TaskScreen.jsx + .module.css
```

### Files NOT copied from Expo

- `src/game/` (characterAssets, mobAssets, levelAssets, uiAssets, OpenWorld.js)
- `src/game-phaser/` (PhaserGame, phaserAssets, events, scenes, sprites)
- `src/screens/CharacterSelectScreen.js`
- `src/screens/OpenWorldScreen.js`
- `src/screens/GameScreen.js`
- `src/hooks/useForceLandscape.js`
- `assets/game assets/` (sprite frames, mobs, buttons, level art)
- `scripts/generate-spritesheets.mjs`

## Theme System (CSS Custom Properties)

All theme tokens from `src/styles/theme.js` become CSS variables:

**`variables.css`** — non-themed constants:
```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-xxl: 48px;
  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 24px;
  --radius-full: 999px;
  --font-heading-bold: 'REM-Bold', sans-serif;
  --font-heading: 'REM-Regular', sans-serif;
  --font-body-bold: 'Sen-Bold', sans-serif;
  --font-body: 'Sen-Regular', sans-serif;
}
```

**`theme.css`** — themed colors:
```css
[data-theme="light"] {
  --color-background: #F2F2F0;
  --color-surface: #FFFFFF;
  --color-card: #FFFFFF;
  --color-primary: #7C7BF0;
  --color-secondary: #F5A623;
  --color-success: #4CAF50;
  --color-error: #FF5252;
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #6B7280;
  --color-border: #E5E7EB;
  --color-input-bg: #FAFAFA;
  --color-gradient-vector-start: #7C7BF0;
  --color-gradient-vector-end: #5A4FE0;
  --color-gradient-diff-start: #F5A623;
  --color-gradient-diff-end: #E8951A;
  --color-exp-blue: #5B8DEF;
  --color-streak-orange: #F5A623;
  --color-completed-red: #FF6B6B;
  --color-sidebar-header-start: #7C7BF0;
  --color-sidebar-header-end: #5A4FE0;
}
/* dark and pink themes follow same pattern — all 3 themes from theme.js */
```

In CSS Modules, use: `background: var(--color-background);`

## Platform API Replacements

Every Expo-specific API must have a web-native equivalent:

| Expo API | Web Replacement | Where Used |
|----------|----------------|------------|
| `expo-file-system/legacy` → `readAsStringAsync(base64)` | `fetch(imageUri)` → `.blob()` → `FileReader.readAsDataURL()` | `aiService.js` |
| `expo-file-system` → `downloadAsync` | `<a href={pdfUrl} download>` or `fetch` → blob → objectURL → `<a click>` | `PDFViewerScreen` |
| `expo-file-system` → `documentDirectory` | Not needed — download via blob URL | `PDFViewerScreen` |
| `expo-image-picker` → `launchCameraAsync` | `<input type="file" accept="image/*" capture="environment">` with onChange handler | `ScanSolveScreen` |
| `expo-image-picker` → `launchImageLibraryAsync` | `<input type="file" accept="image/*">` with onChange handler | `ScanSolveScreen`, `ProfileScreen` |
| `expo-image-picker` → `requestCameraPermissionsAsync` | `navigator.mediaDevices.getUserMedia({video: true})` — if fails, show error | `ScanSolveScreen` |
| `expo-image-picker` → `requestMediaLibraryPermissionsAsync` | `navigator.permissions.query({name: 'camera'})` — or try/fallback | `ProfileScreen` |
| `expo-image-manipulator` → `manipulateAsync(resize)` | Canvas API: `ctx.drawImage(img, 0, 0, 1024, auto)` → `canvas.toBlob()` → `URL.createObjectURL()` | `ScanSolveScreen`, `ProfileScreen` |
| `@react-native-community/datetimepicker` | `<input type="date">` and `<input type="time">` styled to match | `SetExamScreen` |
| `react-native-webview` → `<WebView>` | `<iframe src={googleDocsUrl}>` | `PDFViewerScreen` |
| `expo-sharing` → `shareAsync` | `navigator.share({files: [...]})` or fallback to `<a download>` | `PDFViewerScreen` |
| `expo-linking` → `addEventListener('url')` | `window.addEventListener('hashchange')` + React Router `useLocation` | `EmailLoginScreen` |
| `expo-screen-orientation` | Not needed — no game screens use it | `App.js` |
| `@react-navigation/native` → `useFocusEffect` | `useEffect` with React Router's `useLocation` to detect route changes | `DashboardScreen` |
| `@react-navigation/stack` → `navigation.navigate(route, params)` | `useNavigate()` → `navigate(path, { state: params })` | All screens |
| `@react-navigation/stack` → `navigation.replace(route)` | `navigate(path, { replace: true })` | Auth screens |
| `@react-navigation/stack` → `navigation.goBack()` | `useNavigate()` → `navigate(-1)` | All screens |
| `@react-navigation/stack` → `navigation.reset()` | `navigate('/', { replace: true })` | Logout |
| `react-native-safe-area-context` → `<SafeAreaView>` | CSS `padding-top: env(safe-area-inset-top)` | All screens |
| `expo-linear-gradient` → `<LinearGradient>` | CSS `background: linear-gradient(...)` via a `<div>` wrapper | Dashboard, Module, AllModules, CharacterSelect, Settings |
| `StatusBar` from expo-status-bar | CSS `theme-color` meta tag + no component needed | `index.html` |
| `StyleSheet.create({...})` | `.module.css` with same property names | All screens |
| `Animated.Value` + `Animated.timing` | CSS `transition: transform 250ms ease-out` | `Sidebar` |
| `RefreshControl` on ScrollView | Manual refresh button with loading state | `DashboardScreen` |
| `ActivityIndicator` | CSS `@keyframes spin` + `<div className={styles.spinner}>` | All screens |
| `KeyboardAvoidingView` | Not needed on web — browser handles keyboard natively | 5 auth/profile screens |
| Image `require('./path.png')` | Vite `import logo from './logo.png'` then `<img src={logo}>` | All screens with static images |
| `FlatList` | Native `<div>` + `.map()` | `ScanSolveScreen` dropdown |
| `Modal` component | CSS `<div className={styles.overlay}>` + `onClick` backdrop dismiss | `ScanSolveScreen`, `SettingsScreen` |

## Screen-by-Screen Implementation Notes

### HomeScreen
- Static landing page. Logo image, two buttons.
- "Get Started" → `/register`
- "I already have an account" → `/login`
- No auth logic on this page.

### LoginScreen
- Email + password form. `supabase.auth.signInWithPassword()`
- On success: check `profiles.profile_setup` flag → navigate to Dashboard or SetupProfile
- Remove `KeyboardAvoidingView` wrapper
- Error handling: display inline error text for "Invalid login credentials", "Email not confirmed"
- Back button → `/`

### RegisterScreen
- Username + email + password + confirm password form
- `supabase.auth.signUp()` with email redirect
- On success: navigate to `SetupProfile`
- Validation: email format, password match, min 6 chars, username required

### EmailLoginScreen
- Email input → `supabase.auth.signInWithOtp()`
- After sending: show "Check your email" confirmation screen
- Auth listener: `supabase.auth.onAuthStateChange` or URL hash parsing
- `detectSessionInUrl: true` in supabase config for web
- Back button → `/login`

### SetupProfileScreen
- Username + semester form fields
- `supabase.from('profiles').upsert()` with `profile_setup: true`
- On success: navigate to `/onboarding`

### OnboardingScreen
- 3 static pages with images from `public/assets/images/reference pages/`
- **Web approach**: CSS `scroll-snap-type: x mandatory` on container, `scroll-snap-align: center` on each page
- Or: horizontal scroll with `scrollTo` on button click
- Skip button always visible → `/dashboard`
- Dot indicators below, "Next" / "Get Started" button
- Gradient background image

### DashboardScreen (heaviest screen)
- **Stats row**: 3 cards (Total Exp, Days Streak, Completed) from `profiles` table
- **Exam countdown card**: From `exam_countdowns` table, shows days left + date + edit button
- **Module carousel**: Horizontal scroll with snap, progress bars, "Continue Learning" header
- **Sidebar**: Hamburger menu → slide-out Sidebar component
- **Refresh**: Replace `RefreshControl` with a refresh button
- **Loading state**: Full-screen spinner
- **Navigation**: Settings gear icon → `/settings`, hamburger → Sidebar

**Removed from Dashboard** (game):
- The "Open World" gradient card with "Coming Soon" badge is removed entirely
- The hidden tasks section (already `{false && ...}`) stays hidden

### Sidebar Component
- CSS `transform: translateX()` + `transition` for slide animation
- Backdrop overlay with `opacity` transition
- `pointer-events: none` when hidden
- 4 menu items: Dashboard, Past Papers, Scan & Solve, Tasks
- User info header with gradient background
- Logout button
- Width: `min(65vw, 320px)` for desktop

### ProfileScreen
- Avatar: `<input type="file" accept="image/*">` hidden, triggered by button click
- Upload: `fetch(blob)` → `supabase.storage.from('avatars').upload()`
- Form fields: Display Name, Email (read-only), Gender (toggle buttons), Semester, Bio (textarea)
- Save via `supabase.from('profiles').upsert()`
- No `KeyboardAvoidingView` wrapper

### SettingsScreen
- Modal overlay with 3 theme option cards (Light, Dark, Pink)
- Each card shows a preview swatch
- Selected theme has a checkmark
- Changes theme via `ThemeContext.setThemeMode()`
- Close button or backdrop dismiss

### AllModulesScreen
- Full list of modules from `modules` table (ordered by `order`)
- Each module: gradient card with title, description, progress bar, percentage
- Tap → navigate to `/module/:id` with module data in router state

### ModuleScreen
- Gradient banner header with module title
- Progress stats
- **Only "Soalan" (Questions) button** → `/question/:moduleId`
- The disabled "Game" item from the Expo version is removed entirely

### QuestionScreen
- Quiz UI with question image/text + 4 option grid
- User taps an option → shows correct/incorrect (green/red)
- Auto-advance after 750ms
- Progress bar at top
- On finish: persist score via `updateModuleProgress`, show results screen
- Uses `vectorQuestions` data from `web-app/src/data/vectorQuestions.js`

### FinalExamScreen
- List of past exam papers from `exams` table
- Each item: title, subject, semester, year
- Tap → navigate to `/pdf-viewer` with exam data in state
- Empty state when no exams available

### PDFViewerScreen
- Uses `<iframe>` with Google Docs viewer: `https://docs.google.com/viewer?url={pdfUrl}&embedded=true`
- Download button: `<a href={pdfUrl} download>` for direct PDF download
- Loading state while iframe loads
- Error state when no pdf_url provided

### ScanSolveScreen
- Dropdown to select exam paper context (from `exams` table)
- Image preview area with dashed border
- Two buttons: "Camera" (`<input capture="environment">`) + "Gallery" (`<input type="file">`)
- Solve button → sends image to OpenAI via `aiService.solveWithDeepSeek()`
- Result card with AI text response
- Clear image button

### SetExamScreen
- Exam title input
- Date picker: `<input type="date">` styled to match the picker button
- Time picker: `<input type="time">` styled to match the picker button
- Save button → upsert to `exam_countdowns` table
- Delete button (when editing existing) → delete from `exam_countdowns`

### TaskScreen
- Todo list with add input + button
- Two sections: Pending + Completed
- Checkbox toggle → updates Supabase `tasks.completed`
- Delete button per task
- Empty state

## Supabase Config

```js
// web-app/src/config/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ujcgwezmroashxemfyqc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIs...';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,      // Web-native (replaces AsyncStorage)
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,   // IMPORTANT: true for web magic link auth
  },
});
```

## Auth Context

```jsx
// AuthContext: provides { user, session, loading, signOut }
// Listens to supabase.auth.onAuthStateChange
// Wraps children with loading state until initial session check completes
```

## Responsive Strategy

Since the app was designed for mobile (375-430px wide), for desktop:

- Every screen gets a max-width wrapper: `max-width: 480px; margin: 0 auto;`
- This gives a phone-like container centered on wide screens
- The background color fills the full viewport outside the container
- Sidebar width capped at `min(65vw, 320px)`

## Fonts

Google Fonts loaded via `<link>` in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=REM:wght@600;700&family=Sen:wght@400;700&display=swap" rel="stylesheet">
```

## Static Assets

All non-game images from the Expo app are copied to `web-app/public/assets/`. In code:

```jsx
// Vite handles this
import logo from '../assets/images/logo.png';
<img src={logo} alt="Logo" />
```

Assets to copy:
- `src/assets/images/logo.png`
- `src/assets/images/reference pages/gradient.png`
- `src/assets/images/reference pages/png/page 1 image.png`
- `src/assets/images/reference pages/png/page 2 image.png`
- `src/assets/images/reference pages/png/page 3 image.png`
- `assets/icon.png`, `assets/splash-icon.png`, `assets/favicon.png`

## Error Handling

- All Supabase calls wrapped in try/catch — show error via `alert()` or inline error text
- Same error messages as the Expo app
- Loading spinners on every async operation
- Empty states for lists (modules, exams, tasks)
- API key placeholder in `aiService.js` (`YOUR_OPENAI_API_KEY`)

## Dependencies (package.json)

```json
{
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router-dom": "^7.0.0",
    "@supabase/supabase-js": "^2.110.4",
    "lucide-react": "^0.400.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "vite": "^6.0.0",
    "vitest": "^2.0.0",
    "@testing-library/react": "^16.0.0",
    "jsdom": "^25.0.0"
  }
}
```

## What Is NOT Changing

- Supabase backend (same project, same tables, same RLS)
- OpenAI API endpoint and prompt structure
- All 17 non-game screen layouts, colors, fonts, spacing, border radii
- All user-facing text and labels (minus game-related)
- All navigation flows and auth logic
- Database schema and migrations
- Non-game asset files (logo, onboarding images, favicon)

## What IS Changing

- Build tool: Expo → Vite
- Navigation: @react-navigation/stack → React Router
- Styling: StyleSheet.create → CSS Modules + CSS variables
- Icons: lucide-react-native → lucide-react
- Platform APIs: All Expo-specific APIs → web-native equivalents (table above)
- Entry point: App.js (RN) → main.jsx (React DOM)
- Auth storage: AsyncStorage → localStorage
- Magic link: Linking API → detectSessionInUrl + hashchange

## What Is REMOVED

- 3 game screens: CharacterSelectScreen, OpenWorldScreen, GameScreen
- Phaser game engine and all game assets
- Open World card in DashboardScreen
- Game button in ModuleScreen
- `useForceLandscape` hook (game-only)
- All files under `src/game/` and `src/game-phaser/`
