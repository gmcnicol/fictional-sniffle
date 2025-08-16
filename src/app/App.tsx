import { useEffect, useRef } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from 'react-router-dom';
import { Button } from '../components';
import { FeedListPage } from '../features/feeds/FeedListPage';
import { ReaderPage } from '../features/reader/ReaderPage';
import { useTheme } from '../theme/theme';

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
  theme: string;
  setTheme: (t: string) => void;
}) {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.focus();
  }, [location]);

  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    mainRef.current?.focus();
  };

  return (
    <>
      <a href="#main-content" className="skip-link" onClick={handleSkip}>
        Skip to main content
      </a>
      <header aria-label="Site header">
        <nav aria-label="Primary navigation">
          <Link to="/">Feeds</Link>
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
        <Routes>
          <Route path="/" element={<FeedListPage />} />
          <Route path="/reader/:articleId" element={<ReaderPage />} />
        </Routes>
      </main>
      <footer aria-label="Site footer">
        <p>RSS Web Comics Reader</p>
      </footer>
    </>
  );
}

export default App;
