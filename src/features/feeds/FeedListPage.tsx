import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button, IconButton, ListItem, Panel } from '../../components';
import { db } from '../../lib/db';
import type { Feed } from '../../lib/db';
import { discoverFeed } from '../../lib/discoverFeed';
import { importOpml, exportOpml } from '../../lib/opml';
import { useDexieLiveQuery } from '../../hooks/useDexieLiveQuery';
import { syncFeedsOnce } from '../../lib/sync';

export function FeedListPage() {
  const feedsWithUnread = useDexieLiveQuery(async () => {
    const feeds = await db.feeds.toArray();
    const result: (Feed & { unread: number; latestArticleId?: number })[] = [];
    for (const f of feeds) {
      const articleIds = await db.articles
        .where('feedId')
        .equals(f.id!)
        .primaryKeys();
      const readCount = await db.readState
        .where('articleId')
        .anyOf(articleIds)
        .and((r) => r.read)
        .count();
      const unread = articleIds.length - readCount;
      const articles = await db.articles
        .where('feedId')
        .equals(f.id!)
        .sortBy('publishedAt');
      const latest = articles.at(-1);
      result.push({ ...f, unread, latestArticleId: latest?.id });
    }
    return result;
  }, []);

  const folders = useDexieLiveQuery(() => db.folders.toArray(), []);
  const feeds = feedsWithUnread ?? [];
  const folderList = folders ?? [];

  const grouped = new Map<
    number | null,
    (Feed & { unread: number; latestArticleId?: number })[]
  >();
  feeds.forEach((f) => {
    const key = f.folderId ?? null;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(f);
  });

  const handleAdd = async () => {
    const url = window.prompt('Feed URL');
    if (!url) return;
    const feedUrl = await discoverFeed(url);
    const title = window.prompt('Title', feedUrl) || feedUrl;
    const folderName = window.prompt('Folder (optional)') || undefined;
    let folderId: number | null = null;
    if (folderName) {
      const folder = await db.folders.where('name').equals(folderName).first();
      if (!folder) {
        folderId = await db.folders.add({ name: folderName });
      } else if (folder.id != null) {
        folderId = folder.id;
      }
    }
    await db.feeds.add({ url: feedUrl, title, folderId });
  };

  const handleEdit = async (feed: Feed) => {
    const title = window.prompt('New title', feed.title);
    if (title === null) return;
    const folderName = window.prompt(
      'Folder (blank for none)',
      folderList.find((f) => f.id === feed.folderId)?.name || '',
    );
    let folderId: number | null = null;
    if (folderName) {
      const folder = await db.folders.where('name').equals(folderName).first();
      if (!folder) {
        folderId = await db.folders.add({ name: folderName });
      } else if (folder.id != null) {
        folderId = folder.id;
      }
    }
    await db.feeds.update(feed.id!, { title, folderId });
  };

  const handleDelete = async (feed: Feed) => {
    if (!window.confirm(`Delete ${feed.title}?`)) return;
    await db.feeds.delete(feed.id!);
  };

  const [fileKey, setFileKey] = useState(0);
  const [refreshPulse, setRefreshPulse] = useState(0);
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await importOpml(text);
    setFileKey((k) => k + 1);
  };

  const handleExport = async () => {
    const opml = await exportOpml();
    const blob = new Blob([opml], { type: 'text/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feeds.opml';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefreshAll = async () => {
    await syncFeedsOnce();
    setRefreshPulse((p) => p + 1);
  };

  const MotionListItem = motion(ListItem);
  const reduceMotion = useReducedMotion();
  const itemVariants = reduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : { hidden: { opacity: 0, y: -8 }, visible: { opacity: 1, y: 0 } };

  return (
    <Panel>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1>Feeds</h1>
        <IconButton
          aria-label="Refresh feeds"
          onClick={handleRefreshAll}
          pulse={refreshPulse}
        >
          🔄
        </IconButton>
      </div>
      {Array.from(grouped.entries()).map(([folderId, fs]) => (
        <div key={folderId ?? 'root'}>
          {folderId && (
            <h2>{folderList.find((f) => f.id === folderId)?.name}</h2>
          )}
          <ul>
            <AnimatePresence initial={!reduceMotion}>
              {fs.map((f) => (
                <MotionListItem
                  key={f.id}
                  variants={itemVariants}
                  initial={reduceMotion ? false : 'hidden'}
                  animate="visible"
                  exit={reduceMotion ? undefined : 'hidden'}
                  transition={{ duration: reduceMotion ? 0 : 0.15 }}
                >
                  {f.latestArticleId ? (
                    <Link to={`/reader/${f.latestArticleId}`}>{f.title}</Link>
                  ) : (
                    f.title
                  )}{' '}
                  <span>({f.unread})</span>
                  <Button onClick={() => handleEdit(f)}>Edit</Button>
                  <Button onClick={() => handleDelete(f)}>Delete</Button>
                </MotionListItem>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      ))}
      <div style={{ marginTop: '1rem' }}>
        <Button onClick={handleAdd}>Add Feed</Button>
        <Button onClick={handleExport}>Export OPML</Button>
        <input
          key={fileKey}
          type="file"
          accept=".opml,.xml"
          onChange={handleImport}
          style={{ display: 'block', marginTop: '0.5rem' }}
        />
      </div>
    </Panel>
  );
}
