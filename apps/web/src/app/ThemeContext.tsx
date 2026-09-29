import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const MODE_KEY = 'theme';
const COLOR_KEY = 'theme-color';

export type ThemeMode = 'light' | 'dark';
export type ThemeColor = 'shadcn' | 'fsa' | 'violet';

export const THEME_COLORS: { id: ThemeColor; label: string; swatch: string }[] = [
  { id: 'shadcn', label: 'Shadcn', swatch: '#18181b' },
  { id: 'fsa', label: 'FSA', swatch: '#2563eb' },
  { id: 'violet', label: 'Violet', swatch: '#7c3aed' },
];

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  color: ThemeColor;
  setColor: (color: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

// Single provider for both light/dark and the accent color theme —
// mounted once at the app root (main.tsx) so the <html> classList/dataset
// it drives is set on first paint of ANY route, not only while Profile
// (where the picker lives) happens to be mounted. Two independent
// useState copies of this (one per consumer) previously meant a fresh
// load of any page other than Profile never applied the saved theme —
// fixed by lifting the state here instead.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(
    () => (localStorage.getItem(MODE_KEY) as ThemeMode) ?? 'light',
  );
  const [color, setColor] = useState<ThemeColor>(
    () => (localStorage.getItem(COLOR_KEY) as ThemeColor) ?? 'shadcn',
  );

  useEffect(() => {
    // Explicit in-app toggle, not tied to prefers-color-scheme — a
    // deliberate carry-over from the FSA version: OS dark mode on a
    // shared machine shouldn't silently flip this app too.
    document.documentElement.classList.toggle('dark', mode === 'dark');
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    document.documentElement.dataset.themeColor = color;
    localStorage.setItem(COLOR_KEY, color);
  }, [color]);

  return (
    <ThemeContext.Provider
      value={{ mode, setMode, toggleMode: () => setMode((m) => (m === 'light' ? 'dark' : 'light')), color, setColor }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
