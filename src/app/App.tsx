import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Button } from '../components';
import { FeedListPage } from '../features/feeds/FeedListPage';
import { ReaderPage } from '../features/reader/ReaderPage';
import { useTheme } from '../theme/theme';

function App() {
  const { theme, setTheme } = useTheme();

  return (
    <BrowserRouter>
      <div>
        <Button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          Switch to {theme === 'light' ? 'dark' : 'light'} mode
        </Button>
        <Routes>
          <Route path="/" element={<FeedListPage />} />
          <Route path="/reader/:articleId" element={<ReaderPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
