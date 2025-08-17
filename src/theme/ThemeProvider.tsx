import { useEffect, useState, type ReactNode } from 'react';
import { db } from '../lib/db';
import { ThemeContext } from './theme';
import type { Theme } from './theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const updateResolvedTheme = () => {
      if (theme === 'system') {
        setResolvedTheme(media.matches ? 'dark' : 'light');
      } else {
        setResolvedTheme(theme);
      }
    };

    const load = async () => {
      const stored = await db.preferences.get('theme');
      if (stored) {
        setThemeState(stored.value as Theme);
      }
      updateResolvedTheme();
    };

    load();
    updateResolvedTheme();
    media.addEventListener('change', updateResolvedTheme);

    return () => media.removeEventListener('change', updateResolvedTheme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    db.preferences.put({ key: 'theme', value: theme });
  }, [theme, resolvedTheme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
