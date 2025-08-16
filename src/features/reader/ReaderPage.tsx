import { useParams } from 'react-router-dom';
import { Button, Panel } from '../../components';
import { db } from '../../lib/db';
import { useDexieLiveQuery } from '../../hooks/useDexieLiveQuery';

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

  if (!data?.article || !data.feed) {
    return <Panel>Article not found</Panel>;
  }

  const { article, feed } = data;

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
      <Button onClick={handleOpenOriginal}>Open Original</Button>
      <Button onClick={handleMarkUnread}>Mark Unread</Button>
    </Panel>
  );
}
