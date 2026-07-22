# ProjectSkorPlus — Expo v54 + Supabase

Package manager: npm.
Run: `npx expo start` (native), `npx expo start --web` (browser).
TypeScript: yes (tsconfig extends expo/tsconfig.base). Lint: none configured — run `npx tsc --noEmit` to typecheck.

## Stack
- Expo SDK 54, React Native 0.81, React 19.1
- Navigation: @react-navigation/stack (`src/navigation/AppNavigator.js`)
- Backend: Supabase (`src/config/supabase.js`)
- DB migrations: `migrations/` (apply via Supabase dashboard)
- Auth: email/password (LoginScreen, RegisterScreen)
- UI icons: lucide-react-native
- Storage: @react-native-async-storage/async-storage

## File conventions
- Screens in `src/screens/`, services in `src/services/`, shared components in `src/components/`, theme in `src/context/ThemeContext.js`
- All `.js` files still; TypeScript allowed for new code
- Before writing any code, read the latest Expo v54 docs: https://docs.expo.dev/versions/v54.0.0/

## DO NOT
- Touch `/ios` or `/android` native folders
- Commit secrets or `.env*` files
- Modify `src/config/firebase.js` (gitignored)
- Edit `migrations/` unless explicitly asked

## Key notes
- Final exams feature: `src/screens/FinalExamScreen.js`, `src/screens/SetExamScreen.js`
- AI service: `src/services/aiService.js`
- Module system: `src/services/moduleService.js`, `src/screens/ModuleScreen.js`, `src/screens/AllModulesScreen.js`
