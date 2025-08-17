import { Link } from 'react-router-dom';
import { useDexieLiveQuery } from '../../hooks/useDexieLiveQuery';
import { db } from '../../lib/db';
import { Button } from '../../components';

export function FeedSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const feeds = useDexieLiveQuery(() => db.feeds.toArray(), []);
  return (
    <aside
      style={{
        width: collapsed ? '0' : '200px',
        overflow: 'hidden',
        borderRight: '1px solid #ccc',
        padding: collapsed ? 0 : '0.5rem',
      }}
    >
      <Button onClick={onToggle} aria-label="Toggle feed list">
        {collapsed ? '☰' : '×'}
      </Button>
      {!collapsed && (
        <nav aria-label="Feed navigation">
          <ul>
            {feeds?.map((f) => (
              <li key={f.id}>
                <Link to={`/feed/${f.id}`}>{f.title}</Link>
              </li>
            ))}
          </ul>
          <Link to="/">Manage feeds</Link>
        </nav>
      )}
    </aside>
  );
}
