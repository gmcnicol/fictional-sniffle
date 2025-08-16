import { describe, it, expect } from 'vitest';
import { parseFeed } from './feedParser.ts';

const rssSample = `<?xml version="1.0"?><rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/"><channel><title>Sample RSS</title><item><title>Item 1</title><link>http://example.com/1</link><pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate><enclosure url="http://example.com/1.jpg" type="image/jpeg"/></item></channel></rss>`;

const atomSample = `<?xml version="1.0"?><feed xmlns="http://www.w3.org/2005/Atom"><title>Sample Atom</title><entry><title>Entry 1</title><link href="http://example.com/a1"/><updated>2024-01-01T00:00:00Z</updated><media:content xmlns:media="http://search.yahoo.com/mrss/" url="http://example.com/a1.png" type="image/png"/></entry></feed>`;

describe('parseFeed', () => {
  it('parses RSS items', () => {
    const items = parseFeed(rssSample);
    expect(items[0].title).toBe('Item 1');
    expect(items[0].link).toBe('http://example.com/1');
    expect(items[0].image).toBe('http://example.com/1.jpg');
  });

  it('parses Atom items', () => {
    const items = parseFeed(atomSample);
    expect(items[0].title).toBe('Entry 1');
    expect(items[0].link).toBe('http://example.com/a1');
    expect(items[0].image).toBe('http://example.com/a1.png');
  });
});
