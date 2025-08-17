import { useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Panel, UndoToast } from '../../components';
import { db } from '../../lib/db';
import { registerShortcuts } from '../../lib/shortcuts.ts';
import { useDexieLiveQuery } from '../../hooks/useDexieLiveQuery';
import { usePanZoom } from '../../hooks/usePanZoom';
import { useReadState } from '../../hooks/useReadState';
import { useAutoMarkAsRead } from '../../hooks/useAutoMarkAsRead';
import { useScrollPosition } from '../../hooks/useScrollPosition';
import { Reader } from './Reader';
import './ReaderPage.css';

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
  const {
    containerRef,
    scale,
    offset,
    handleWheel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  } = panZoom;

  // Read state management with undo functionality
  const readState = useReadState({
    articleId: Number(articleId) || 0,
    initialReadState: false,
  });

  // Auto mark-as-read functionality
  const autoMarkAsRead = useAutoMarkAsRead({
    articleId: Number(articleId) || 0,
    isRead: readState.isRead,
    threshold: 0.6,
    delay: 1500,
    enabled: true,
  });

  // Scroll position management
  useScrollPosition({
    articleId: Number(articleId) || 0,
    enabled: true,
  });

  const handleOpenOriginal = useCallback(() => {
    if (!data?.article) return;
    window.open(data.article.link, '_blank');
  }, [data]);

  const handleToggleRead = useCallback(async () => {
    await readState.toggleReadState();
  }, [readState]);

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
      toggleRead: () => {
        // If there's a pending undo, execute it; otherwise toggle read state
        if (readState.pendingUndo) {
          readState.handleUndo();
        } else {
          handleToggleRead();
        }
      },
      openOriginal: handleOpenOriginal,
      focusSearch: () => {
        document
          .querySelector<HTMLInputElement>('input[type="search"]')
          ?.focus();
      },
      gotoFeedList: () => navigate('/'),
    });
    return unregister;
  }, [data, handleToggleRead, handleOpenOriginal, navigate, readState]);

  useEffect(() => {
    if (!data?.article) return;
    (async () => {
      const articles = await db.articles
        .where('feedId')
        .equals(data.article.feedId)
        .sortBy('publishedAt');
      const idx = articles.findIndex((a) => a.id === data.article.id);
      const next = articles[idx + 1];
      if (next?.mainImageUrl) {
        const img = new Image();
        img.src = next.mainImageUrl;
      }
    })();
  }, [data]);

  if (!data?.article || !data.feed) {
    return <Panel>Article not found</Panel>;
  }

  const { article, feed } = data;

  return (
    <>
      <div ref={autoMarkAsRead.setElement}>
        <Reader
          article={article}
          feed={feed}
          onOpenOriginal={handleOpenOriginal}
          onToggleRead={handleToggleRead}
          containerRef={containerRef}
          panZoomHandlers={{
            onWheel: handleWheel,
            onPointerDown: handlePointerDown,
            onPointerMove: handlePointerMove,
            onPointerUp: handlePointerUp,
          }}
          scale={scale}
          offset={offset}
        />
      </div>

      {/* Undo toast */}
      {readState.pendingUndo && (
        <UndoToast
          message={readState.pendingUndo.description}
          onUndo={readState.handleUndo}
          onDismiss={readState.clearPendingUndo}
          visible={!!readState.pendingUndo}
        />
      )}
    </>
  );
}
