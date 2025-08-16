import { Button } from '../components';
import { FeedListPage } from '../features/feeds/FeedListPage';
import { useTheme } from '../theme/theme';

function App() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <Button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Switch to {theme === 'light' ? 'dark' : 'light'} mode
      </Button>
      <FeedListPage />
    </div>
  );
}

export default App;
