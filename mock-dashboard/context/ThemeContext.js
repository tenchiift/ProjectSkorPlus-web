import React, { createContext, useContext } from 'react';
import theme from '../styles/theme';

const ThemeContext = createContext({ theme });

// Simple mock — always returns the light theme from styles/theme.js.
// If your real app supports light/dark switching, you can extend this
// with useState + a toggle function later.
export function ThemeProvider({ children }) {
  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
