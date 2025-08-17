import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from 'react-router-dom';
import { Button } from '../components';
const FeedListPage = lazy(() =>
  import('../features/feeds/FeedListPage').then((m) => ({
    default: m.FeedListPage,
  })),
);
const ReaderPage = lazy(() =>
  import('../features/reader/ReaderPage').then((m) => ({
    default: m.ReaderPage,
  })),
);
const SettingsPage = lazy(() =>
  import('../features/settings/SettingsPage').then((m) => ({
    default: m.SettingsPage,
  })),
);
import { useTheme, type Theme } from '../theme/theme';
import { LiveRegionContext } from '../hooks/useLiveRegion.ts';

function App() {
  const { theme, setTheme } = useTheme();

  return (
    <BrowserRouter>
      <Layout theme={theme} setTheme={setTheme} />
    </BrowserRouter>
  );
}

function Layout({
  theme,
  setTheme,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
}) {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    mainRef.current?.focus();
  }, [location]);

  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    mainRef.current?.focus();
  };

  return (
    <LiveRegionContext.Provider value={setLiveMessage}>
      <a href="#main-content" className="skip-link" onClick={handleSkip}>
        Skip to main content
      </a>
      <div aria-live="polite" className="sr-only">
        {liveMessage}
      </div>
      <header aria-label="Site header">
        <nav aria-label="Primary navigation">
          <Link to="/">Feeds</Link> <Link to="/settings">Settings</Link>
        </nav>
        <Button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          Switch to {theme === 'light' ? 'dark' : 'light'} mode
        </Button>
      </header>
      <main
        id="main-content"
        aria-label="Main content"
        tabIndex={-1}
        ref={mainRef}
      >
        <Suspense fallback={<p>Loading...</p>}>
          <Routes>
            <Route path="/" element={<FeedListPage />} />
            <Route path="/reader/:articleId" element={<ReaderPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Suspense>
      </main>
      <footer aria-label="Site footer">
        <p>RSS Web Comics Reader</p>
      </footer>
    </LiveRegionContext.Provider>
  );
}

export default App;
