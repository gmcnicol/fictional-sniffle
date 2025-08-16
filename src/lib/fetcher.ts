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
  { etag, lastModified, proxy, retries = 3 }: FetchFeedOptions = {},
): Promise<{
  status: number;
  etag?: string;
  lastModified?: string;
  text?: string;
}> {
  const headers = new Headers();
  if (etag) headers.set('If-None-Match', etag);
  if (lastModified) headers.set('If-Modified-Since', lastModified);

  let attempt = 0;
  let useProxy = false;
  let lastError: unknown;

  while (attempt < retries) {
    const target =
      useProxy && proxy ? `${proxy}?url=${encodeURIComponent(url)}` : url;
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
