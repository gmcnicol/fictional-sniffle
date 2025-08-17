import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Strict profile configuration for DOMPurify
const STRICT_CONFIG = {
  // Remove all event handlers
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
  // Only allow safe tags
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
  // Only allow safe attributes - strict whitelist approach
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
  // Forbid dangerous protocols
  FORBID_CONTENTS: ['script', 'style', 'iframe', 'object', 'embed'],
  WHOLE_DOCUMENT: false,
  // Use strict whitelist mode - only allow explicitly listed attributes
  ALLOW_DATA_ATTR: false,
};

// Create DOMPurify instance that works in both browser and Node environments
function createSanitizer() {
  if (typeof window !== 'undefined') {
    // Browser environment
    return createDOMPurify(window);
  } else {
    // Node/test environment - use JSDOM
    const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
    return createDOMPurify(dom.window as unknown as Window);
  }
}

export function sanitize(html: string): string {
  const DOMPurify = createSanitizer();
  const cleanHtml = DOMPurify.sanitize(html, STRICT_CONFIG);

  // Create a temporary DOM to manipulate the cleaned HTML
  let tempDoc: Document;
  if (typeof window !== 'undefined') {
    tempDoc = new DOMParser().parseFromString(cleanHtml, 'text/html');
  } else {
    const dom = new JSDOM(cleanHtml);
    tempDoc = dom.window.document;
  }

  // Add loading optimizations to images
  tempDoc.querySelectorAll('img').forEach((img) => {
    img.setAttribute('loading', 'lazy');
    img.setAttribute('decoding', 'async');

    // Ensure images have alt attributes for accessibility
    if (!img.hasAttribute('alt')) {
      img.setAttribute('alt', '');
    }
  });

  // Make all links open in new tabs for security
  tempDoc.querySelectorAll('a[href]').forEach((link) => {
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
  });

  return tempDoc.body.innerHTML;
}

/**
 * Check if HTML content is safe after sanitization
 */
export function isSafeHtml(html: string): boolean {
  const sanitized = sanitize(html);
  // If the sanitized version is significantly smaller, it contained dangerous content
  return Math.abs(sanitized.length - html.length) < html.length * 0.1;
}
