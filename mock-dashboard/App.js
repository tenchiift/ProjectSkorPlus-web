import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import DashboardScreen from './screens/DashboardScreen';

export default function App() {
  return (
    <ThemeProvider>
      <DashboardScreen />
    </ThemeProvider>
  );
}
