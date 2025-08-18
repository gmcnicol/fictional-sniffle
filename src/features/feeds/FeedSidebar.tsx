import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { feedsRepo } from '../../lib/repositories.ts';
import { Button } from '../../components';
import type { Feed } from '../../lib/db.ts';

export function FeedSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [feeds, setFeeds] = useState<Feed[]>([]);

  useEffect(() => {
    const loadFeeds = async () => {
      try {
        const allFeeds = await feedsRepo.all();
        setFeeds(allFeeds);
      } catch (error) {
        console.error('Failed to load feeds:', error);
        setFeeds([]);
      }
    };

    loadFeeds();
  }, []);

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
            {feeds.map((f) => (
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