import { useState } from 'react';
import { Button } from '../../components';
import { db } from '../../lib/db';
import { discoverFeed } from '../../lib/discoverFeed';
import { useSettings } from '../settings/SettingsContext.tsx';

export function AddFeedForm() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [folder, setFolder] = useState('');
  const { proxyUrl } = useSettings();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    const feedUrl = await discoverFeed(url, proxyUrl);
    let folderId: number | null = null;
    if (folder) {
      const existing = await db.folders.where('name').equals(folder).first();
      if (existing?.id != null) {
        folderId = existing.id;
      } else {
        folderId = await db.folders.add({ name: folder });
      }
    }
    await db.feeds.add({ url: feedUrl, title: title || feedUrl, folderId });
    setUrl('');
    setTitle('');
    setFolder('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
      <input
        type="url"
        placeholder="Feed URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />
      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        type="text"
        placeholder="Folder (optional)"
        value={folder}
        onChange={(e) => setFolder(e.target.value)}
      />
      <Button type="submit">Add Feed</Button>
    </form>
  );
}
