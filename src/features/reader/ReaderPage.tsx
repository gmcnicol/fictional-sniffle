import { useEffect, useState, type SyntheticEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button, Panel } from '../../components';
import { db } from '../../lib/db';
import { readStateRepo } from '../../lib/repositories/readState.ts';
import { registerShortcuts } from '../../lib/shortcuts.ts';
import { sanitize } from '../../lib/sanitize';
import { useDexieLiveQuery } from '../../hooks/useDexieLiveQuery';
import { usePanZoom } from '../../hooks/usePanZoom';
import { useLiveRegion } from '../../hooks/useLiveRegion.ts';
import './ReaderPage.css';
import '../../styles/caption.css';

export function ReaderPage() {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const data = useDexieLiveQuery(async () => {
    if (!articleId) return null;
    const id = Number(articleId);
    const article = await db.articles.get(id);
    if (!article) return null;
    const feed = await db.feeds.get(article.feedId);
    return { article, feed };
  }, [articleId]);

  const panZoom = usePanZoom();
  const [caption, setCaption] = useState('');
  const [expanded, setExpanded] = useState(true);
  const reduceMotion = useReducedMotion();
  const announce = useLiveRegion();

  const handleOpenOriginal = () => {
    if (!data?.article) return;
    window.open(data.article.link, '_blank');
  };

  const handleToggleRead = async () => {
    if (!data?.article) return;
    const { article } = data;
    const isRead = await readStateRepo.isRead(article.id!);
    if (isRead) {
      await readStateRepo.markUnread(article.id!);
      announce('Marked as unread');
    } else {
      await readStateRepo.markRead(article.id!);
      announce('Marked as read');
    }
  };

  useEffect(() => {
    if (!data?.article) return;
    const { article } = data;
    const unregister = registerShortcuts({
      nextArticle: async () => {
        const articles = await db.articles
          .where('feedId')
          .equals(article.feedId)
          .sortBy('publishedAt');
        const idx = articles.findIndex((a) => a.id === article.id);
        const next = articles[idx + 1];
        if (next) navigate(`/reader/${next.id}`);
      },
      prevArticle: async () => {
        const articles = await db.articles
          .where('feedId')
          .equals(article.feedId)
          .sortBy('publishedAt');
        const idx = articles.findIndex((a) => a.id === article.id);
        const prev = articles[idx - 1];
        if (prev) navigate(`/reader/${prev.id}`);
      },
      toggleRead: handleToggleRead,
      openOriginal: handleOpenOriginal,
      focusSearch: () => {
        document
          .querySelector<HTMLInputElement>('input[type="search"]')
          ?.focus();
      },
      gotoFeedList: () => navigate('/'),
    });
    return unregister;
  }, [data, handleToggleRead, handleOpenOriginal, navigate]);

  if (!data?.article || !data.feed) {
    return <Panel>Article not found</Panel>;
  }

  const { article, feed } = data;
  const {
    containerRef,
    scale,
    offset,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = panZoom;

  const handleImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const text = img.getAttribute('alt') || img.getAttribute('title') || '';
    setCaption(text);
  };

  const sanitizedHtml = article.contentHtml
    ? sanitize(article.contentHtml)
    : null;

  return (
    <Panel>
      <h1>{article.title}</h1>
      <p>
        {feed.title} – {article.publishedAt.toLocaleDateString()}
      </p>
      {article.mainImageUrl && (
        <figure
          className="reader-image-container"
          ref={containerRef}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <img
            src={article.mainImageUrl}
            alt={article.mainImageAlt ?? ''}
            onLoad={handleImageLoad}
            loading="lazy"
            decoding="async"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            }}
          />
          {caption && <figcaption className="caption">{caption}</figcaption>}
        </figure>
      )}
      <AnimatePresence initial={!reduceMotion}>
        {expanded && sanitizedHtml && (
          <motion.div
            key="article-content"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="reader-content"
              dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <Button onClick={() => setExpanded((e) => !e)}>
        {expanded ? 'Collapse' : 'Expand'} Article
      </Button>
      <Button onClick={handleOpenOriginal}>Open Original</Button>
      <Button onClick={handleToggleRead}>Toggle Read</Button>
    </Panel>
  );
}
