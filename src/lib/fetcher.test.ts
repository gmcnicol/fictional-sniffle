/** @vitest-environment jsdom */
import { describe, it, expect } from 'vitest';
import { extractMainImage } from './fetcher.ts';

const base = 'https://example.com/page';

describe('extractMainImage', () => {
  it('chooses the largest image in the content', () => {
    const html = `
      <html><body>
        <img src="small.jpg" width="100" height="100" />
        <img src="large.jpg" width="600" height="400" />
      </body></html>`;
    expect(extractMainImage(html, base)).toBe('https://example.com/large.jpg');
  });

  it('falls back to og:image when no imgs found', () => {
    const html = `
      <html><head>
        <meta property="og:image" content="/meta.jpg" />
      </head><body>No images</body></html>`;
    expect(extractMainImage(html, base)).toBe('https://example.com/meta.jpg');
  });

  it('uses domain-specific selectors before heuristics', () => {
    const html = `
      <html><body>
        <img src="large.jpg" width="800" height="600" />
        <div id="comic"><img src="/comic.png" /></div>
      </body></html>`;
    expect(extractMainImage(html, 'https://xkcd.com/1/')).toBe(
      'https://xkcd.com/comic.png',
    );
  });
});
