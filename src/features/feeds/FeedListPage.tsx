import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Panel } from '../../components';
import { AddFeedForm } from './AddFeedForm';
import { feedsRepo, articlesRepo } from '../../lib/repositories.ts';
import { syncFeedsOnce } from '../../lib/sync';
import type { Feed, Article } from '../../lib/db.ts';

export function FeedListPage() {
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeeds = async () => {
    try {
      const allFeeds = await feedsRepo.all();
      setFeeds(allFeeds);

      // Load articles for all feeds
      const allArticles: Article[] = [];
      for (const feed of allFeeds) {
        const feedArticles = await articlesRepo.getByFeed(feed.id);
        allArticles.push(...feedArticles);
      }
      console.log('FeedListPage: Loaded', allArticles.length, 'total articles');
      setArticles(allArticles);
    } catch (error) {
      console.error('Failed to load feeds:', error);
      setFeeds([]);
      setArticles([]);
    }
  };

  useEffect(() => {
    loadFeeds();
  }, []);

  const handleRefreshAll = async () => {
    setRefreshing(true);
    try {
      await syncFeedsOnce();
      await loadFeeds(); // Reload feeds after sync
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDelete = async (feed: Feed) => {
    if (!window.confirm(`Delete ${feed.title}?`)) return;
    try {
      await feedsRepo.remove(feed.id);
      await loadFeeds(); // Reload feeds after deletion
    } catch (error) {
      console.error('Failed to delete feed:', error);
    }
  };

  const handleEdit = async (feed: Feed) => {
    const title = window.prompt('New title', feed.title);
    if (title === null || !title.trim()) return;

    try {
      await feedsRepo.update(feed.id, { title: title.trim() });
      await loadFeeds(); // Reload feeds after update
    } catch (error) {
      console.error('Failed to update feed:', error);
    }
  };

  return (
    <Panel>
      <AddFeedForm onFeedAdded={loadFeeds} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          margin: '1rem 0',
        }}
      >
        <h1>Feeds</h1>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            onClick={handleRefreshAll}
            disabled={refreshing}
            aria-label="Refresh feeds"
          >
            {refreshing ? 'Syncing...' : '🔄'}
          </Button>
          <Button
            onClick={() => {
              if (
                window.confirm(
                  'Are you sure you want to clear all data? This cannot be undone.',
                )
              ) {
                localStorage.removeItem('fictional-sniffle-db');
                window.location.reload();
              }
            }}
            style={{ backgroundColor: '#dc3545', color: 'white' }}
          >
            🗑️ Clear All Data
          </Button>
        </div>
      </div>

      {feeds.length === 0 ? (
        <p>No feeds added yet. Add your first feed above!</p>
      ) : (
        <>
          <ul>
            {feeds.map((feed) => (
              <li
                key={feed.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #eee',
                }}
              >
                <div>
                  <Link to={`/feed/${feed.id}`} style={{ fontWeight: 'bold' }}>
                    {feed.title}
                  </Link>
                  <div style={{ fontSize: '0.8em', color: '#666' }}>
                    {feed.url}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Button onClick={() => handleEdit(feed)}>Edit</Button>
                  <Button onClick={() => handleDelete(feed)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>

          <h2>Articles ({articles.length})</h2>
          {articles.length === 0 ? (
            <p>No articles yet. Try syncing the feeds above.</p>
          ) : (
            <ul data-testid="articles-list">
              {articles
                .sort(
                  (a, b) =>
                    new Date(b.publishedAt).getTime() -
                    new Date(a.publishedAt).getTime(),
                )
                .map((article) => (
                  <li
                    key={article.id}
                    data-testid="article-item"
                    style={{
                      padding: '1rem',
                      borderBottom: '1px solid #eee',
                      marginBottom: '0.5rem',
                    }}
                  >
                    <h3>
                      <Link
                        to={`/reader/${article.id}`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        {article.title}
                      </Link>
                    </h3>
                    {article.mainImageUrl && (
                      <img
                        src={article.mainImageUrl}
                        alt={article.mainImageAlt || 'Article image'}
                        style={{
                          maxWidth: '200px',
                          height: 'auto',
                          margin: '0.5rem 0',
                        }}
                      />
                    )}
                    <div style={{ fontSize: '0.8em', color: '#666' }}>
                      {new Date(article.publishedAt).toLocaleDateString()} -
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View Original
                      </a>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </>
      )}
    </Panel>
  );
}
