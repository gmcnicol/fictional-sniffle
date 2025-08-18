import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Panel } from '../../components';
import { articlesRepo, feedsRepo } from '../../lib/repositories.ts';
import type { Article, Feed } from '../../lib/db.ts';

export function ReaderPage() {
  const { articleId } = useParams<{ articleId: string }>();
  const [article, setArticle] = useState<Article | null>(null);
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArticle = async () => {
      if (!articleId) return;

      try {
        console.log('ReaderPage: Loading article with ID:', articleId);

        // Get article by ID
        const foundArticle = await articlesRepo.get(parseInt(articleId));
        console.log('ReaderPage: Found article:', foundArticle);

        if (foundArticle) {
          setArticle(foundArticle);

          // Load the feed
          const articleFeed = await feedsRepo.get(foundArticle.feedId);
          console.log('ReaderPage: Found feed:', articleFeed);
          setFeed(articleFeed || null);
        } else {
          console.log('ReaderPage: Article not found with ID:', articleId);
        }
      } catch (error) {
        console.error('Failed to load article:', error);
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [articleId]);

  if (loading) {
    return (
      <Panel>
        <p>Loading article...</p>
      </Panel>
    );
  }

  if (!article) {
    return (
      <Panel>
        <p>Article not found</p>
        <Link to="/">← Back to feeds</Link>
      </Panel>
    );
  }

  return (
    <Panel>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/">← Back to feeds</Link>
        {feed && <span> | {feed.title}</span>}
      </div>

      <article>
        <h1>{article.title}</h1>

        {article.mainImageUrl &&
          !article.contentHtml?.includes(article.mainImageUrl) && (
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <img
                src={article.mainImageUrl}
                alt={article.mainImageAlt || 'Article image'}
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </div>
          )}

        <div style={{ fontSize: '0.9em', color: '#666', marginBottom: '1rem' }}>
          Published: {new Date(article.publishedAt).toLocaleDateString()} |{' '}
          <a href={article.link} target="_blank" rel="noopener noreferrer">
            View Original
          </a>
        </div>

        {article.contentHtml ? (
          <div
            style={{
              textAlign: 'center',
              marginTop: '1rem',
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
          </div>
        ) : (
          <p>
            <a href={article.link} target="_blank" rel="noopener noreferrer">
              Read full article on original site
            </a>
          </p>
        )}
      </article>
    </Panel>
  );
}
