import { normalizeUrl } from './normalizeUrl';
import { buildProxyUrl } from './fetcher.ts';

export interface DiscoveredFeed {
  url: string;
  title?: string;
  type: 'rss' | 'atom' | 'direct';
}

export interface FeedDiscoveryResult {
  feeds: DiscoveredFeed[];
  originalUrl: string;
  usedProxy: boolean;
}

export async function discoverFeeds(
  url: string,
  proxy?: string,
): Promise<FeedDiscoveryResult> {
  const originalUrl = url;
  let usedProxy = false;
  
  // First, try direct discovery
  try {
    const result = await discoverFeedsFromUrl(url);
    if (result.feeds.length > 0) {
      return { ...result, originalUrl, usedProxy };
    }
  } catch (error) {
    // If direct fails and we have a proxy, try with proxy
    if (proxy) {
      try {
        usedProxy = true;
        const result = await discoverFeedsFromUrl(buildProxyUrl(proxy, url));
        return { ...result, originalUrl, usedProxy };
      } catch {
        // Proxy also failed
      }
    }
  }

  // If no feeds discovered, return the original URL as a direct feed
  return {
    feeds: [{ url: normalizeUrl(url), type: 'direct' }],
    originalUrl,
    usedProxy,
  };
}

async function discoverFeedsFromUrl(url: string): Promise<{ feeds: DiscoveredFeed[] }> {
  // Check if URL looks like a direct feed
  if (url.match(/\.(xml|rss|atom)(\?|$)/i)) {
    return {
      feeds: [{ url: normalizeUrl(url), type: 'direct' }]
    };
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
  
  // Check if the response is actually a feed
  if (text.includes('<rss') || text.includes('<feed')) {
    const type = text.includes('<rss') ? 'rss' : 'atom';
    return {
      feeds: [{ url: normalizeUrl(url), type }]
    };
  }

  // Parse as HTML and look for feed links
  const doc = new DOMParser().parseFromString(text, 'text/html');
  const feedLinks = doc.querySelectorAll(
    'link[rel="alternate"][type="application/rss+xml"], link[rel="alternate"][type="application/atom+xml"]'
  );

  const feeds: DiscoveredFeed[] = [];
  
  feedLinks.forEach((link) => {
    const href = link.getAttribute('href');
    const title = link.getAttribute('title');
    const type = link.getAttribute('type');
    
    if (href) {
      try {
        const feedUrl = new URL(href, url).toString();
        feeds.push({
          url: normalizeUrl(feedUrl),
          title: title || undefined,
          type: type?.includes('atom') ? 'atom' : 'rss',
        });
      } catch {
        // Invalid URL, skip
      }
    }
  });

  return { feeds };
}

// Legacy function for backwards compatibility
export async function discoverFeed(
  url: string,
  proxy?: string,
): Promise<string> {
  const result = await discoverFeeds(url, proxy);
  return result.feeds[0]?.url || normalizeUrl(url);
}
