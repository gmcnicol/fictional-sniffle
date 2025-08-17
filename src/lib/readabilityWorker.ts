import { Readability } from '@mozilla/readability';
import { parseHTML } from 'linkedom';
import createDOMPurify from 'dompurify';

// Strict DOMPurify configuration matching the main sanitize module
const STRICT_CONFIG = {
  FORBID_ATTR: [
    'onclick',
    'onload',
    'onunload',
    'onabort',
    'onerror',
    'onblur',
    'onchange',
    'onfocus',
    'onreset',
    'onselect',
    'onsubmit',
    'onkeydown',
    'onkeypress',
    'onkeyup',
    'onmouseover',
    'onmouseout',
    'onmousedown',
    'onmousemove',
    'onmouseup',
    'oncontextmenu',
    'ondrag',
    'ondragend',
    'ondragenter',
    'ondragleave',
    'ondragover',
    'ondragstart',
    'ondrop',
    'onscroll',
    'onresize',
    'onbeforeunload',
  ],
  ALLOWED_TAGS: [
    'p',
    'div',
    'span',
    'br',
    'img',
    'a',
    'strong',
    'b',
    'em',
    'i',
    'u',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'table',
    'thead',
    'tbody',
    'tr',
    'td',
    'th',
    'figure',
    'figcaption',
    'small',
    'sub',
    'sup',
    'del',
    'ins',
    'mark',
  ],
  ALLOWED_ATTR: [
    'href',
    'src',
    'alt',
    'title',
    'class',
    'id',
    'role',
    'aria-label',
    'aria-describedby',
    'loading',
    'decoding',
    'width',
    'height',
  ],
  FORBID_CONTENTS: ['script', 'style', 'iframe', 'object', 'embed'],
  WHOLE_DOCUMENT: false,
  // Use strict whitelist mode - only allow explicitly listed attributes
  ALLOW_DATA_ATTR: false,
};

interface WorkerRequest {
  url: string;
  fetchContent?: boolean;
}

interface WorkerResponse {
  html: string | null;
  mainImage?: string | null;
  error?: string;
  corsBlocked?: boolean;
}

/**
 * Extract main image using heuristics:
 * 1. og:image meta tag
 * 2. twitter:image meta tag
 * 3. First image in content
 * 4. Largest image by dimensions
 */
function extractMainImage(document: Document, baseUrl: string): string | null {
  try {
    // Try og:image first
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage) {
      const content = ogImage.getAttribute('content');
      if (content) {
        return new URL(content, baseUrl).href;
      }
    }

    // Try twitter:image
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage) {
      const content = twitterImage.getAttribute('content');
      if (content) {
        return new URL(content, baseUrl).href;
      }
    }

    // Find images in content area
    const contentImages = document.querySelectorAll(
      'article img, .content img, .post img, main img',
    );
    if (contentImages.length > 0) {
      // Return the first content image
      const img = contentImages[0] as HTMLImageElement;
      const src = img.src || img.getAttribute('data-src');
      if (src) {
        return new URL(src, baseUrl).href;
      }
    }

    // Fallback to any image
    const anyImage = document.querySelector('img');
    if (anyImage) {
      const src = anyImage.src || anyImage.getAttribute('data-src');
      if (src) {
        return new URL(src, baseUrl).href;
      }
    }

    return null;
  } catch (error) {
    console.warn('Failed to extract main image:', error);
    return null;
  }
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  try {
    const { url, fetchContent = true } = event.data;

    if (!fetchContent) {
      // Just return that content fetching is disabled
      self.postMessage({
        html: null,
        corsBlocked: true,
      } as WorkerResponse);
      return;
    }

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const html = await res.text();
    const { document, window } = parseHTML(html);

    // Extract main image before processing with Readability
    const mainImage = extractMainImage(document, url);

    const reader = new Readability(document);
    const article = reader.parse();

    if (article?.content) {
      // linkedom's window lacks some globals expected by DOMPurify's WindowLike type,
      // so cast to include the global constructors DomPurify checks for
      const DOMPurify = createDOMPurify(
        window as unknown as Window & typeof globalThis,
      );

      const clean = DOMPurify.sanitize(article.content, STRICT_CONFIG);

      // Add loading optimizations to images in the worker
      const tempDoc = parseHTML(clean).document;
      tempDoc.querySelectorAll('img').forEach((img) => {
        img.setAttribute('loading', 'lazy');
        img.setAttribute('decoding', 'async');
        if (!img.hasAttribute('alt')) {
          img.setAttribute('alt', '');
        }
      });

      // Make links safe
      tempDoc.querySelectorAll('a[href]').forEach((link) => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      });

      self.postMessage({
        html: tempDoc.body.innerHTML,
        mainImage,
      } as WorkerResponse);
    } else {
      self.postMessage({
        html: null,
        mainImage,
      } as WorkerResponse);
    }
  } catch (err) {
    const error = err as Error;
    let corsBlocked = false;

    // Detect CORS errors
    if (
      error.message.includes('CORS') ||
      error.message.includes('fetch') ||
      error.name === 'TypeError'
    ) {
      corsBlocked = true;
    }

    self.postMessage({
      html: null,
      mainImage: null,
      error: error.message,
      corsBlocked,
    } as WorkerResponse);
  }
};

export {};
