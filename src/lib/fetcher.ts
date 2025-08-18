import domainRulesData from './domainRules.json' assert { type: 'json' };

export const DEFAULT_PROXY = 'https://corsproxy.io/?';

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
  timeout?: number;
}

export interface NetworkError {
  type: 'cors' | 'timeout' | 'network' | 'server' | 'client' | 'rate-limit';
  message: string;
  status?: number;
  usedProxy: boolean;
  canRetry: boolean;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createTimeoutController(timeout: number) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  return { controller, timeoutId };
}

function categorizeError(
  error: unknown,
  status?: number,
  usedProxy: boolean = false,
): NetworkError {
  if (error instanceof Error) {
    // CORS errors typically contain these keywords
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return {
        type: 'cors',
        message: usedProxy 
          ? 'CORS error persists even with proxy - the feed may block all cross-origin requests'
          : 'Cross-origin request blocked - will try with proxy if available',
        usedProxy,
        canRetry: !usedProxy,
      };
    }
    
    // Timeout errors
    if (error.name === 'AbortError') {
      return {
        type: 'timeout',
        message: 'Request timed out - the server may be slow or unresponsive',
        usedProxy,
        canRetry: true,
      };
    }
    
    // Network errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return {
        type: 'network',
        message: usedProxy
          ? 'Network error persists - check your internet connection'
          : 'Network error - will try with proxy if available',
        usedProxy,
        canRetry: !usedProxy,
      };
    }
  }
  
  // HTTP status errors
  if (status) {
    if (status === 429) {
      return {
        type: 'rate-limit',
        message: 'Rate limited by server - too many requests',
        status,
        usedProxy,
        canRetry: true,
      };
    }
    
    if (status >= 500) {
      return {
        type: 'server',
        message: `Server error (${status}) - the feed server is having issues`,
        status,
        usedProxy,
        canRetry: true,
      };
    }
    
    if (status >= 400) {
      return {
        type: 'client',
        message: `Client error (${status}) - the feed URL may be invalid or access denied`,
        status,
        usedProxy,
        canRetry: false,
      };
    }
  }
  
  // Fallback
  return {
    type: 'network',
    message: error instanceof Error ? error.message : 'Unknown network error',
    usedProxy,
    canRetry: true,
  };
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
    timeout = 30000, // 30 second default timeout
  }: FetchFeedOptions = {},
): Promise<{
  status: number;
  etag?: string;
  lastModified?: string;
  text?: string;
  networkError?: NetworkError;
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
  let lastError: NetworkError | null = null;

  while (attempt < retries) {
    const target = useProxy && proxy ? buildProxyUrl(proxy, url) : url;
    const { controller, timeoutId } = createTimeoutController(timeout);
    
    try {
      const res = await fetch(target, { 
        headers, 
        signal: controller.signal 
      });
      
      clearTimeout(timeoutId);
      
      // Handle rate limiting with longer delay
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        const delayMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60000; // Default 1 minute
        
        if (attempt < retries - 1) {
          attempt++;
          await delay(Math.min(delayMs, 300000)); // Cap at 5 minutes
          continue;
        }
      }
      
      // Retry on server errors with exponential backoff
      if (res.status >= 500 && attempt < retries - 1) {
        attempt++;
        await delay(2 ** attempt * 1000); // More aggressive backoff for server errors
        continue;
      }
      
      if (res.status === 304) {
        return { status: 304 };
      }
      
      const text = await res.text();
      
      // Return error information for 4xx/5xx responses
      if (res.status >= 400) {
        const networkError = categorizeError(null, res.status, useProxy);
        console.warn(`fetchFeed ${target} responded ${res.status}:`, networkError.message);
        
        return {
          status: res.status,
          etag: res.headers.get('etag') ?? undefined,
          lastModified: res.headers.get('last-modified') ?? undefined,
          text,
          networkError,
        };
      }
      
      return {
        status: res.status,
        etag: res.headers.get('etag') ?? undefined,
        lastModified: res.headers.get('last-modified') ?? undefined,
        text,
      };
      
    } catch (err) {
      clearTimeout(timeoutId);
      const networkError = categorizeError(err, undefined, useProxy);
      lastError = networkError;
      
      console.warn(`fetchFeed attempt ${attempt + 1} failed:`, networkError.message);
      
      // Try proxy if we haven't yet and error suggests it might help
      if (!useProxy && proxy && networkError.canRetry && 
          (networkError.type === 'cors' || networkError.type === 'network')) {
        useProxy = true;
        continue; // Don't increment attempt counter for proxy retry
      }
      
      // Only retry if the error type suggests it might help
      if (networkError.canRetry && attempt < retries - 1) {
        attempt++;
        // Exponential backoff with jitter
        const baseDelay = 2 ** attempt * 1000;
        const jitter = Math.random() * 500;
        await delay(baseDelay + jitter);
        continue;
      }
      
      break;
    }
  }
  
  // Throw enriched error with context
  const error = new Error(
    lastError?.message || 'Failed to fetch after all retries'
  );
  (error as any).networkError = lastError;
  throw error;
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
