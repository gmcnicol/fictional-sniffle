import { useState } from 'react';
import { Button } from '../../components';
import { db } from '../../lib/db';
import { discoverFeed } from '../../lib/discoverFeed';
import { feedsRepo } from '../../lib/repositories.ts';
import { fetchFeed } from '../../lib/fetcher';
import { parseFeedWithMetadata } from '../../lib/feedParser';
import { syncFeedsOnce } from '../../lib/sync';
import { useSettings } from '../settings/SettingsContext.tsx';

export function AddFeedForm({ onFeedAdded }: { onFeedAdded?: () => void }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { proxyUrl } = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setError(null);
    setIsLoading(true);

    try {
      console.log('AddFeedForm: Starting to add feed:', url);
      const feedUrl = await discoverFeed(url, proxyUrl);
      console.log('AddFeedForm: Discovered feed URL:', feedUrl);
      let feedTitle = title;

      // If no title provided, try to fetch and parse the feed to get the title
      if (!feedTitle) {
        try {
          const feedResponse = await fetchFeed(feedUrl, {
            proxy: proxyUrl || undefined,
          });
          if (feedResponse.status === 200 && feedResponse.text) {
            const parsedFeed = parseFeedWithMetadata(feedResponse.text);
            feedTitle = parsedFeed.title || feedUrl;
          } else {
            feedTitle = feedUrl;
          }
        } catch {
          // Fallback to URL if feed parsing fails
          feedTitle = feedUrl;
        }
      }

      let folderId: number | null = null;
      if (folder) {
        const existing = await db.getFolderByName(folder);
        if (existing?.id != null) {
          folderId = existing.id;
        } else {
          folderId = await db.addFolder({ name: folder });
        }
      }

      console.log('AddFeedForm: Adding feed to repository:', {
        url: feedUrl,
        title: feedTitle,
        folderId,
      });
      await feedsRepo.add({ url: feedUrl, title: feedTitle, folderId });
      console.log('AddFeedForm: Feed added successfully');

      setUrl('');
      setTitle('');
      setFolder('');

      // Notify parent component
      if (onFeedAdded) {
        onFeedAdded();
      }

      // Trigger an immediate sync to fetch articles for the new feed
      console.log('AddFeedForm: Triggering sync...');
      syncFeedsOnce().catch((error) => {
        console.error('AddFeedForm: Sync failed:', error);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add feed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
      {error && (
        <div
          style={{ color: 'red', marginBottom: '0.5rem', fontSize: '0.9em' }}
        >
          {error}
        </div>
      )}
      <input
        type="url"
        placeholder="Feed URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
        disabled={isLoading}
      />
      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        disabled={isLoading}
      />
      <input
        type="text"
        placeholder="Folder (optional)"
        value={folder}
        onChange={(e) => setFolder(e.target.value)}
        disabled={isLoading}
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Adding...' : 'Add Feed'}
      </Button>
    </form>
  );
}
