import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const STORAGE_KEY = 'pms-theme';
const DARK_MEDIA_QUERY = '(prefers-color-scheme: dark)';

function getSystemDark() {
  return window.matchMedia(DARK_MEDIA_QUERY).matches;
}

function resolveIsDark(theme) {
  if (theme === 'system') return getSystemDark();
  return theme === 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system'
      ? stored
      : 'system';
  });

  const [isDark, setIsDark] = useState(() => resolveIsDark(theme));

  const setTheme = (mode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    setThemeState(mode);
  };

  // Resolve isDark whenever theme changes, and listen for system preference changes
  useEffect(() => {
    setIsDark(resolveIsDark(theme));

    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia(DARK_MEDIA_QUERY);
    const handler = (e) => setIsDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  // Apply or remove the 'dark' class on <html>
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
