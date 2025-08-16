import { useParams } from 'react-router-dom';
import { Button, Panel } from '../../components';
import { db } from '../../lib/db';
import { useDexieLiveQuery } from '../../hooks/useDexieLiveQuery';
import { usePanZoom } from '../../hooks/usePanZoom';
import './ReaderPage.css';

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

  return (
    <Panel>
      <h1>{article.title}</h1>
      <p>
        {feed.title} – {article.publishedAt.toLocaleDateString()}
      </p>
      {article.mainImageUrl && (
        <div
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
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            }}
          />
        </div>
      )}
      {article.mainImageAlt && (
        <p className="reader-image-alt">{article.mainImageAlt}</p>
      )}
      <Button onClick={handleOpenOriginal}>Open Original</Button>
      <Button onClick={handleMarkUnread}>Mark Unread</Button>
    </Panel>
  );
}
