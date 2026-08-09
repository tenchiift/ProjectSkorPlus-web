# Mock Dashboard (UI playground)

This is a standalone copy of `DashboardScreen` with **no Supabase, no
react-navigation, no ThemeContext from the real app** — everything is
dummy/local so you can safely experiment with the UI.

## Setup

```bash
cd "/Users/tenchii/ProjectSkorPlus/dasboard ui test"
npx create-expo-app@latest . --template blank
```

When it finishes, **replace** the generated `App.js` and copy in the
`screens/`, `context/`, `components/`, `styles/` folders from this
package (overwrite/merge into your project root).

Then install the packages this screen needs:

```bash
npx expo install expo-status-bar expo-linear-gradient react-native-safe-area-context lucide-react-native
```

Run it:

```bash
npx expo start
```

Scan the QR with **Expo Go** on your phone, or press `i` / `a` for a
simulator, or `w` for a quick web preview.

## What's mocked vs real

| Thing | Status |
|---|---|
| `userData`, `modules`, `moduleProgress`, `countdown` | Dummy data at the top of `DashboardScreen.js` — edit freely |
| `navigation` prop | Fake object that just `console.log`s — swap back to the real `navigation` prop when you copy this back into the main app |
| `theme` / `useTheme()` | Standalone copy in `styles/theme.js` + `context/ThemeContext.js` — edit colors/spacing here to experiment |
| `Sidebar` | Simplified mock version — same props (`visible`, `onClose`, `onNavigate`, `userData`) |
| Logo image | Replaced with a text label since `assets/images/logo.png` wasn't included — swap back to your real `<Image>` when ready |
| Supabase / `moduleService` | Removed entirely |

## Playing with data

Open `screens/DashboardScreen.js` and edit the `MOCK_USER`,
`MOCK_MODULES`, `MOCK_PROGRESS`, and `MOCK_COUNTDOWN` constants near the
top to test different states (empty modules, no countdown set, high
streak numbers, etc).

## When you're happy with a design

Copy the edited JSX/styles back into your real `DashboardScreen.js`,
swapping the mock `navigation` prop and dummy data back for the real
`navigation` prop and `fetchData()` Supabase logic.
