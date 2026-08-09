import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const THEME_MODES = { light: true, dark: true, pink: true };

const ThemeContext = createContext({
  themeMode: 'light',
  setThemeMode: () => {},
});

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState(() => {
    try { return localStorage.getItem('skorplus-theme') || 'light'; }
    catch { return 'light'; }
  });

  const setThemeMode = useCallback((newMode) => {
    if (THEME_MODES[newMode]) {
      setMode(newMode);
      try { localStorage.setItem('skorplus-theme', newMode); } catch {}
    }
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return (
    <ThemeContext.Provider value={{ themeMode: mode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
