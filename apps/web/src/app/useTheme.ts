import { useEffect, useState } from 'react';

const THEME_KEY = 'theme';

// Explicit in-app toggle, not tied to prefers-color-scheme — a deliberate
// carry-over decision from the FSA version (direct user feedback): OS dark
// mode on a shared machine shouldn't silently flip this app too.
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem(THEME_KEY) as 'light' | 'dark') ?? 'light',
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return { theme, toggleTheme: () => setTheme((t) => (t === 'light' ? 'dark' : 'light')) };
}
