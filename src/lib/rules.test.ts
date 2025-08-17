import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  extractContentWithRules,
  hasDomainRules,
  getSupportedDomains,
  extractImageHeuristic,
} from './rules';

describe('Domain Rules', () => {
  let dom: JSDOM;
  let document: Document;

  beforeEach(() => {
    dom = new JSDOM();
    document = dom.window.document;
  });

  describe('extractContentWithRules', () => {
    it('should extract xkcd comic image and title', () => {
      document.body.innerHTML = `
        <div id="comic">
          <img src="https://imgs.xkcd.com/comics/test.png" title="Hover text here" alt="Alt text" />
        </div>
      `;

      const result = extractContentWithRules('https://xkcd.com/123/', document);

      expect(result).toEqual({
        imageUrl: 'https://imgs.xkcd.com/comics/test.png',
        caption: 'Hover text here',
      });
    });

    it('should extract SMBC comic image', () => {
      document.body.innerHTML = `
        <div id="cc-comic">
          <img src="https://smbc-comics.com/comics/test.png" title="Comic title text" alt="Comic alt text" />
        </div>
      `;

      const result = extractContentWithRules(
        'https://www.smbc-comics.com/comic/test',
        document,
      );

      expect(result).toEqual({
        imageUrl: 'https://smbc-comics.com/comics/test.png',
        caption: 'Comic title text',
      });
    });

    it('should return null for unsupported domains', () => {
      document.body.innerHTML = `
        <img src="https://example.com/image.png" alt="Test" />
      `;

      const result = extractContentWithRules(
        'https://unsupported.com/page',
        document,
      );

      expect(result).toBeNull();
    });

    it('should handle missing elements gracefully', () => {
      document.body.innerHTML = '<p>No comic here</p>';

      const result = extractContentWithRules('https://xkcd.com/123/', document);

      expect(result).toEqual({});
    });

    it('should handle data-src attribute', () => {
      document.body.innerHTML = `
        <div id="comic">
          <img data-src="https://imgs.xkcd.com/comics/lazy.png" title="Lazy loaded" />
        </div>
      `;

      const result = extractContentWithRules('https://xkcd.com/123/', document);

      expect(result).toEqual({
        imageUrl: 'https://imgs.xkcd.com/comics/lazy.png',
        caption: 'Lazy loaded',
      });
    });
  });

  describe('hasDomainRules', () => {
    it('should return true for supported domains', () => {
      expect(hasDomainRules('https://xkcd.com/123/')).toBe(true);
      expect(hasDomainRules('https://www.smbc-comics.com/comic/test')).toBe(
        true,
      );
    });

    it('should return false for unsupported domains', () => {
      expect(hasDomainRules('https://example.com/page')).toBe(false);
    });

    it('should handle invalid URLs gracefully', () => {
      expect(hasDomainRules('not-a-url')).toBe(false);
    });
  });

  describe('getSupportedDomains', () => {
    it('should return list of supported domains', () => {
      const domains = getSupportedDomains();
      expect(domains).toContain('xkcd.com');
      expect(domains).toContain('www.smbc-comics.com');
      expect(domains.length).toBeGreaterThan(0);
    });
  });

  describe('extractImageHeuristic', () => {
    it('should extract from og:image meta tag', () => {
      document.head.innerHTML = `
        <meta property="og:image" content="https://example.com/og-image.png" />
      `;

      const result = extractImageHeuristic(document);

      expect(result.imageUrl).toBe('https://example.com/og-image.png');
    });

    it('should extract from twitter:image meta tag', () => {
      document.head.innerHTML = `
        <meta name="twitter:image" content="https://example.com/twitter-image.png" />
      `;

      const result = extractImageHeuristic(document);

      expect(result.imageUrl).toBe('https://example.com/twitter-image.png');
    });

    it('should extract from common content selectors', () => {
      document.body.innerHTML = `
        <article>
          <img src="https://example.com/article-image.png" alt="Article image" />
        </article>
      `;

      const result = extractImageHeuristic(document);

      expect(result).toEqual({
        imageUrl: 'https://example.com/article-image.png',
        caption: 'Article image',
      });
    });

    it('should prefer earlier selectors', () => {
      document.head.innerHTML = `
        <meta property="og:image" content="https://example.com/og-image.png" />
      `;
      document.body.innerHTML = `
        <article>
          <img src="https://example.com/article-image.png" alt="Article image" />
        </article>
      `;

      const result = extractImageHeuristic(document);

      expect(result.imageUrl).toBe('https://example.com/og-image.png');
    });

    it('should handle data-src attributes', () => {
      document.body.innerHTML = `
        <article>
          <img data-src="https://example.com/lazy-image.png" alt="Lazy image" />
        </article>
      `;

      const result = extractImageHeuristic(document);

      expect(result).toEqual({
        imageUrl: 'https://example.com/lazy-image.png',
        caption: 'Lazy image',
      });
    });
  });
});
