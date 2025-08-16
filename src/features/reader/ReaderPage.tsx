import { useState, type SyntheticEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Button, Panel } from '../../components';
import { db } from '../../lib/db';
import { sanitize } from '../../lib/sanitize';
import { useDexieLiveQuery } from '../../hooks/useDexieLiveQuery';
import { usePanZoom } from '../../hooks/usePanZoom';
import './ReaderPage.css';
import '../../styles/caption.css';

export function ReaderPage() {
  const { articleId } = useParams();
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

  const handleOpenOriginal = () => {
    window.open(article.link, '_blank');
  };

  const handleMarkUnread = async () => {
    await db.readState.put({ articleId: article.id!, read: false });
  };

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
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            }}
          />
          {caption && <figcaption className="caption">{caption}</figcaption>}
        </figure>
      )}
      {sanitizedHtml && (
        <div
          className="reader-content"
          dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
        />
      )}
      <Button onClick={handleOpenOriginal}>Open Original</Button>
      <Button onClick={handleMarkUnread}>Mark Unread</Button>
    </Panel>
  );
}
