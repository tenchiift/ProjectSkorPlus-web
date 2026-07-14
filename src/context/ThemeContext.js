import React, { createContext, useContext, useState, useCallback } from 'react';
import { light, dark, pink } from '../styles/theme';

const themes = { light, dark, pink };

const ThemeContext = createContext({
  theme: light,
  themeMode: 'light',
  setThemeMode: () => {},
});

export function ThemeProvider({ children }) {
  const [mode, setMode] = useState('light');

  const setThemeMode = useCallback((newMode) => {
    if (themes[newMode]) {
      setMode(newMode);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: themes[mode], themeMode: mode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
