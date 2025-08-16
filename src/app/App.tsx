import { Button, Panel, EmptyState, Spinner } from '../components';
import { useTheme } from '../theme/ThemeProvider';

function App() {
  const { theme, setTheme } = useTheme();

  return (
    <Panel>
      <h1>RSS Reader</h1>
      <Button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Switch to {theme === 'light' ? 'dark' : 'light'} mode
      </Button>
      <EmptyState message="No items yet" />
      <Spinner />
    </Panel>
  );
}

export default App;
