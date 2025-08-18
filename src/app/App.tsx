import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from 'react-router-dom';
import { HelpModal } from '../features/help/HelpModal.tsx';
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
import { FeedSidebar } from '../features/feeds/FeedSidebar.tsx';
import { Button } from '../components';
import { scheduleSync } from '../lib/sync';

function App() {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // Start automatic feed syncing when the app initializes
    console.log('Starting scheduled sync...');
    scheduleSync().catch(error => {
      console.error('Failed to start sync:', error);
    });
  }, []);

  return (
    <BrowserRouter basename="/fictional-sniffle">
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
  const [showHelp, setShowHelp] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

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
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <FeedSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />
        <main
          id="main-content"
          aria-label="Main content"
          tabIndex={-1}
          ref={mainRef}
          style={{ flex: 1, padding: '1rem' }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Link to="/">Manage feeds</Link>
            <Button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              Switch to {theme === 'light' ? 'dark' : 'light'} mode
            </Button>
          </div>
          <Button onClick={() => setShowHelp(true)}>Help</Button>
          <Suspense fallback={<p>Loading...</p>}>
            <Routes>
              <Route path="/" element={<FeedListPage />} />
              <Route path="/reader/:articleId" element={<ReaderPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/feed/:feedId" element={<FeedListPage />} />
            </Routes>
          </Suspense>
        </main>
      </div>
      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </LiveRegionContext.Provider>
  );
}

export default App;
