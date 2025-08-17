/** @vitest-environment jsdom */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { extractMainImage } from './fetcher.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadFixture(name: string) {
  return readFileSync(path.join(__dirname, 'fixtures', `${name}.html`), 'utf8');
}

const base = 'https://example.com/page';

describe('extractMainImage', () => {
  it('chooses the largest image in the content', () => {
    const html = `
      <html><body>
        <img src="small.jpg" width="100" height="100" />
        <img src="large.jpg" width="600" height="400" />
      </body></html>`;
    const { src, alt } = extractMainImage(html, base);
    expect(src).toBe('https://example.com/large.jpg');
    expect(alt).toBeNull();
  });

  it('falls back to og:image when no imgs found', () => {
    const html = `
      <html><head>
        <meta property="og:image" content="/meta.jpg" />
      </head><body>No images</body></html>`;
    const { src, alt } = extractMainImage(html, base);
    expect(src).toBe('https://example.com/meta.jpg');
    expect(alt).toBeNull();
  });

  it('extracts XKCD image and alt text via domain rule', () => {
    const html = loadFixture('xkcd');
    const { src, alt } = extractMainImage(html, 'https://xkcd.com/1/');
    expect(src).toBe('https://imgs.xkcd.com/comics/example.png');
    expect(alt).toBe('Hover text');
  });

  it('extracts SMBC image via domain rule', () => {
    const html = loadFixture('smbc');
    const { src, alt } = extractMainImage(
      html,
      'https://www.smbc-comics.com/comic/test',
    );
    expect(src).toBe('https://www.smbc-comics.com/comics/example.png');
    expect(alt).toBeNull();
  });

  it('extracts Dilbert image via domain rule', () => {
    const html = loadFixture('dilbert');
    const { src, alt } = extractMainImage(
      html,
      'https://dilbert.com/strip/2000-01-01',
    );
    expect(src).toBe('https://assets.amuniversal.com/example.jpg');
    expect(alt).toBeNull();
  });

  it('extracts Penny Arcade image via domain rule', () => {
    const html = loadFixture('penny-arcade');
    const { src, alt } = extractMainImage(
      html,
      'https://www.penny-arcade.com/comic/2020/01/01/example',
    );
    expect(src).toBe('https://www.penny-arcade.com/images/example.png');
    expect(alt).toBeNull();
  });
});
