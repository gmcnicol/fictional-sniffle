import { normalizeUrl } from './normalizeUrl';

export async function discoverFeed(url: string): Promise<string> {
  try {
    if (url.endsWith('.xml') || url.endsWith('.rss') || url.endsWith('.atom')) {
      return normalizeUrl(url);
    }
    const res = await fetch(url);
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, 'text/html');
    const link = doc.querySelector(
      'link[rel="alternate"][type="application/rss+xml"], link[rel="alternate"][type="application/atom+xml"]',
    );
    const href = link?.getAttribute('href');
    if (href) {
      const resolved = new URL(href, url).toString();
      return normalizeUrl(resolved);
    }
  } catch {
    // ignore
  }
  return normalizeUrl(url);
}
