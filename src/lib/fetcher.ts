import domainRulesData from './domainRules.json' assert { type: 'json' };

export const DEFAULT_PROXY = 'https://cors.isomorphic-git.org';

export function buildProxyUrl(proxy: string, url: string) {
  return proxy.includes('?')
    ? `${proxy}${encodeURIComponent(url)}`
    : `${proxy}${url}`;
}

export interface FetchFeedOptions {
  etag?: string | null;
  lastModified?: string | null;
  proxy?: string | null;
  retries?: number;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch a URL with optional retry/backoff and proxy support. If `etag` or
 * `lastModified` are provided, conditional requests will be made. When a
 * request fails due to network/CORS, the optional `proxy` URL is used on the
 * next attempt.
 */
export async function fetchFeed(
  url: string,
  {
    etag,
    lastModified,
    proxy = DEFAULT_PROXY,
    retries = 3,
  }: FetchFeedOptions = {},
): Promise<{
  status: number;
  etag?: string;
  lastModified?: string;
  text?: string;
}> {
  const headers = new Headers();
  if (etag) headers.set('If-None-Match', etag);
  if (lastModified) headers.set('If-Modified-Since', lastModified);
  headers.set(
    'Accept',
    'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
  );
  try {
    headers.set(
      'User-Agent',
      'fictional-sniffle/1.0 (+https://github.com/this-repo)',
    );
  } catch {
    // Browsers forbid setting the User-Agent; ignore in that case.
  }

  let attempt = 0;
  let useProxy = false;
  let lastError: unknown;

  while (attempt < retries) {
    const target = useProxy && proxy ? buildProxyUrl(proxy, url) : url;
    try {
      const res = await fetch(target, { headers });
      // Retry on server errors
      if (res.status >= 500 && attempt < retries - 1) {
        attempt++;
        await delay(2 ** attempt * 500);
        continue;
      }
      if (res.status === 304) {
        return { status: 304 };
      }
      const text = await res.text();
      if (res.status >= 400) {
        console.error(`fetchFeed ${target} responded ${res.status}:`, text);
      }
      return {
        status: res.status,
        etag: res.headers.get('etag') ?? undefined,
        lastModified: res.headers.get('last-modified') ?? undefined,
        text,
      };
    } catch (err) {
      lastError = err;
      if (!useProxy && proxy) {
        // try again using proxy
        useProxy = true;
      } else {
        attempt++;
        if (attempt >= retries) break;
        await delay(2 ** attempt * 500);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Failed to fetch');
}

/**
 * Extract the largest image from an HTML document. Falls back to the
 * page's `og:image` meta tag when no <img> elements are found.
 */
export interface MainImage {
  src: string | null;
  alt: string | null;
}

export function extractMainImage(html: string, baseUrl: string): MainImage {
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const hostname = new URL(baseUrl).hostname;
  const domainRules = domainRulesData as Record<
    string,
    { image: string; alt?: string }
  >;
  const rule = domainRules[hostname];
  if (rule?.image) {
    const img = doc.querySelector<HTMLImageElement>(rule.image);
    const src = img?.getAttribute('src') || img?.getAttribute('data-src');
    const alt = rule.alt ? (img?.getAttribute(rule.alt) ?? null) : null;
    if (src) {
      try {
        return { src: new URL(src, baseUrl).href, alt };
      } catch {
        return { src, alt };
      }
    }
  }

  let bestSrc: string | null = null;
  let bestArea = 0;

  for (const img of Array.from(doc.querySelectorAll('img'))) {
    let src = img.getAttribute('src') || img.getAttribute('data-src');
    if (!src) continue;
    try {
      src = new URL(src, baseUrl).href;
    } catch {
      continue;
    }

    const width = parseInt(img.getAttribute('width') ?? '0', 10);
    const height = parseInt(img.getAttribute('height') ?? '0', 10);
    const area = width && height ? width * height : 0;

    if (area > bestArea || (!bestSrc && area === bestArea)) {
      bestSrc = src;
      bestArea = area;
    }
  }

  if (bestSrc) return { src: bestSrc, alt: null };

  const ogImage = doc
    .querySelector('meta[property="og:image"]')
    ?.getAttribute('content');
  if (ogImage) {
    try {
      return { src: new URL(ogImage, baseUrl).href, alt: null };
    } catch {
      return { src: ogImage, alt: null };
    }
  }

  return { src: null, alt: null };
}
