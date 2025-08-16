/* eslint react-refresh/only-export-components: warn */
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { db } from '../lib/db';

export type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const userPref = useRef(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      if (!userPref.current) {
        setThemeState(media.matches ? 'dark' : 'light');
      }
    };
    const load = async () => {
      const stored = await db.settings.get('theme');
      if (stored) {
        userPref.current = true;
        setThemeState(stored.value as Theme);
      } else {
        apply();
        media.addEventListener('change', apply);
      }
    };
    load();
    return () => media.removeEventListener('change', apply);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (userPref.current) {
      db.settings.put({ key: 'theme', value: theme });
    }
  }, [theme]);

  const setTheme = (t: Theme) => {
    userPref.current = true;
    setThemeState(t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
