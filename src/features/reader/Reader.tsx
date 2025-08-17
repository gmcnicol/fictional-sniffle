import { type SyntheticEvent, useState } from 'react';
import { Stack, ReaderViewport } from '../../components';
import type { Article, Feed } from '../../lib/db';
import './Reader.css';

export interface ReaderProps {
  article: Article;
  feed: Feed;
  onOpenOriginal: () => void;
  onToggleRead: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  panZoomHandlers?: {
    onWheel: (e: React.WheelEvent) => void;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
  };
  scale?: number;
  offset?: { x: number; y: number };
  showCorsMessage?: boolean;
}

export function Reader({
  article,
  feed,
  onOpenOriginal,
  onToggleRead,
  containerRef,
  panZoomHandlers,
  scale = 1,
  offset = { x: 0, y: 0 },
  showCorsMessage = false,
}: ReaderProps) {
  const [caption, setCaption] = useState('');

  const handleImageLoad = (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const text = img.getAttribute('alt') || img.getAttribute('title') || '';
    setCaption(text);
  };

  const domain = new URL(article.link).hostname.replace('www.', '');

  return (
    <div className="reader">
      {/* Header with title, source, date, and actions */}
      <header className="reader__header">
        <Stack gap="sm">
          <h1 className="reader__title">{article.title}</h1>
          <div className="reader__meta">
            <span className="reader__source">{feed.title}</span>
            <span className="reader__separator">•</span>
            <span className="reader__domain">{domain}</span>
            <span className="reader__separator">•</span>
            <time className="reader__date">
              {article.publishedAt.toLocaleDateString()}
            </time>
          </div>
          <div className="reader__actions">
            <button
              type="button"
              onClick={onOpenOriginal}
              className="reader__action"
              title="Open original article (O)"
            >
              Open Original
            </button>
            <button
              type="button"
              onClick={onToggleRead}
              className="reader__action"
              title="Toggle read status (U)"
            >
              Mark Unread
            </button>
          </div>
        </Stack>
      </header>

      {/* Comic image with perfect centering */}
      {article.mainImageUrl && (
        <ReaderViewport center>
          <figure
            className="reader__figure"
            ref={containerRef}
            {...panZoomHandlers}
          >
            <img
              src={article.mainImageUrl}
              alt={article.mainImageAlt ?? ''}
              onLoad={handleImageLoad}
              loading="lazy"
              decoding="async"
              className="reader__image"
              style={{
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              }}
            />
            {caption && (
              <figcaption className="reader__caption">{caption}</figcaption>
            )}
          </figure>
        </ReaderViewport>
      )}

      {/* CORS message when content extraction is blocked */}
      {showCorsMessage && (
        <div className="reader__cors-message">
          <h3>Content Blocked by CORS Policy</h3>
          <p>
            This website blocks cross-origin requests, so we can't extract the
            full article content.
          </p>
          <button
            type="button"
            onClick={onOpenOriginal}
            className="reader__cors-cta"
          >
            Read Full Article on Original Site
          </button>
        </div>
      )}
    </div>
  );
}
