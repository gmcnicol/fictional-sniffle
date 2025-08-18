import { describe, it, expect, beforeEach, vi } from 'vitest';
import { discoverFeeds, discoverFeed } from './discoverFeed';

// Mock fetch
global.fetch = vi.fn();

describe('discoverFeeds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should recognize direct feed URLs', async () => {
    const result = await discoverFeeds('https://example.com/feed.xml');

    expect(result.feeds).toEqual([
      { url: 'https://example.com/feed.xml', type: 'direct' },
    ]);
    expect(result.usedProxy).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should recognize RSS feed content', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () =>
        '<?xml version="1.0"?><rss version="2.0"><channel></channel></rss>',
    } as Response);

    const result = await discoverFeeds('https://example.com/unknown');

    expect(result.feeds).toEqual([
      { url: 'https://example.com/unknown', type: 'rss' },
    ]);
    expect(result.usedProxy).toBe(false);
  });

  it('should recognize Atom feed content', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () =>
        '<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"></feed>',
    } as Response);

    const result = await discoverFeeds('https://example.com/unknown');

    expect(result.feeds).toEqual([
      { url: 'https://example.com/unknown', type: 'atom' },
    ]);
  });

  it('should discover RSS feeds from HTML', async () => {
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <link rel="alternate" type="application/rss+xml" title="Main Feed" href="/feed.xml" />
      <link rel="alternate" type="application/atom+xml" title="Comments" href="/comments.atom" />
    </head>
    <body></body>
    </html>`;

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => html,
    } as Response);

    const result = await discoverFeeds('https://example.com');

    expect(result.feeds).toHaveLength(2);
    expect(result.feeds[0]).toEqual({
      url: 'https://example.com/feed.xml',
      title: 'Main Feed',
      type: 'rss',
    });
    expect(result.feeds[1]).toEqual({
      url: 'https://example.com/comments.atom',
      title: 'Comments',
      type: 'atom',
    });
  });

  it('should handle relative URLs in feed discovery', async () => {
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <link rel="alternate" type="application/rss+xml" href="../feed.xml" />
      <link rel="alternate" type="application/atom+xml" href="atom.xml" />
    </head>
    </html>`;

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => html,
    } as Response);

    const result = await discoverFeeds('https://example.com/blog/');

    expect(result.feeds).toEqual([
      { url: 'https://example.com/feed.xml', type: 'rss' },
      { url: 'https://example.com/blog/atom.xml', type: 'atom' },
    ]);
  });

  it('should handle HTTP errors gracefully', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    const result = await discoverFeeds('https://example.com/notfound');

    expect(result.feeds).toEqual([
      { url: 'https://example.com/notfound', type: 'direct' },
    ]);
    expect(result.usedProxy).toBe(false);
  });

  it('should try proxy on network error', async () => {
    vi.mocked(fetch)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        ok: true,
        text: async () => '<?xml version="1.0"?><rss></rss>',
      } as Response);

    const result = await discoverFeeds(
      'https://example.com',
      'https://proxy.example.com/',
    );

    expect(result.feeds[0].type).toBe('rss');
    expect(result.usedProxy).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should handle invalid URLs in HTML gracefully', async () => {
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <link rel="alternate" type="application/rss+xml" href="invalid-url" />
      <link rel="alternate" type="application/rss+xml" href="http://valid.example.com/feed.xml" />
    </head>
    </html>`;

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => html,
    } as Response);

    const result = await discoverFeeds('https://example.com');

    // Should find the valid URL and also attempt to resolve the invalid one
    expect(result.feeds.length).toBeGreaterThan(0);
    expect(
      result.feeds.some(
        (feed) => feed.url === 'http://valid.example.com/feed.xml',
      ),
    ).toBe(true);
  });

  it('should return original URL if no feeds found', async () => {
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <title>No feeds here</title>
    </head>
    </html>`;

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => html,
    } as Response);

    const result = await discoverFeeds('https://example.com/');

    expect(result.feeds).toEqual([
      { url: 'https://example.com/', type: 'direct' },
    ]);
  });

  it('should handle fetch exceptions', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const result = await discoverFeeds('https://example.com/');

    expect(result.feeds).toEqual([
      { url: 'https://example.com/', type: 'direct' },
    ]);
    expect(result.usedProxy).toBe(false);
  });

  it('should detect feed URLs by extension', async () => {
    const testCases = [
      'https://example.com/feed.rss',
      'https://example.com/atom.atom',
      'https://example.com/feeds.xml',
      'https://example.com/feed.xml?format=rss',
    ];

    for (const url of testCases) {
      const result = await discoverFeeds(url);
      expect(result.feeds[0].type).toBe('direct');
      expect(result.feeds[0].url).toBe(url);
    }
  });

  it('should preserve title from feed link', async () => {
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <link rel="alternate" type="application/rss+xml" title="My Awesome Blog" href="/feed.xml" />
    </head>
    </html>`;

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => html,
    } as Response);

    const result = await discoverFeeds('https://example.com');

    expect(result.feeds[0].title).toBe('My Awesome Blog');
  });
});

describe('discoverFeed (legacy)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return first discovered feed URL', async () => {
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
    </head>
    </html>`;

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      text: async () => html,
    } as Response);

    const result = await discoverFeed('https://example.com');

    expect(result).toBe('https://example.com/feed.xml');
  });

  it('should return normalized original URL if no feeds found', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const result = await discoverFeed('https://example.com/path/');

    expect(result).toBe('https://example.com/path');
  });
});
