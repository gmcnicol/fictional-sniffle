/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { parseOpml } from './opml';

describe('parseOpml', () => {
  it('deduplicates feeds by normalized URL', () => {
    const xml = `<?xml version="1.0"?><opml version="1.0"><body>
      <outline text="A" type="rss" xmlUrl="http://example.com/feed" />
      <outline text="A dup" type="rss" xmlUrl="http://example.com/feed/" />
    </body></opml>`;
    const feeds = parseOpml(xml);
    expect(feeds.length).toBe(1);
    expect(feeds[0].url).toBe('http://example.com/feed');
  });
});
