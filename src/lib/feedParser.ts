import { XMLParser } from 'fast-xml-parser';

export interface ParsedItem {
  title: string;
  link: string;
  publishedAt: Date;
  image?: string;
  contentHtml?: string;
}

export interface ParsedFeed {
  title?: string;
  description?: string;
  items: ParsedItem[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
});

// Extract main image from HTML content
function extractMainImage(html: string): string | undefined {
  if (!html) return undefined;

  // Look for img tags in the HTML
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  return imgMatch ? imgMatch[1] : undefined;
}

export function parseFeed(xml: string): ParsedItem[] {
  const parsed = parseFeedWithMetadata(xml);
  return parsed.items;
}

export function parseFeedWithMetadata(xml: string): ParsedFeed {
  const json = parser.parse(xml);
  const items: ParsedItem[] = [];
  let title: string | undefined;
  let description: string | undefined;

  if (json.rss && json.rss.channel) {
    title = json.rss.channel.title;
    description = json.rss.channel.description;

    const rssItems = Array.isArray(json.rss.channel.item)
      ? json.rss.channel.item
      : json.rss.channel.item
        ? [json.rss.channel.item]
        : [];
    for (const item of rssItems) {
      const contentHtml = item.description || item['content:encoded'] || '';

      // Try multiple ways to get the image
      let image = item.enclosure?.type?.startsWith('image')
        ? item.enclosure.url
        : item['media:content']?.url;

      // If no direct image, extract from content HTML
      if (!image && contentHtml) {
        image = extractMainImage(contentHtml);
      }

      items.push({
        title: item.title ?? '',
        link: item.link ?? '',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        image,
        contentHtml,
      });
    }
    return { title, description, items };
  }

  if (json.feed) {
    title = json.feed.title;
    description = json.feed.subtitle || json.feed.description;

    const entries = Array.isArray(json.feed.entry)
      ? json.feed.entry
      : json.feed.entry
        ? [json.feed.entry]
        : [];
    for (const entry of entries) {
      const link =
        typeof entry.link === 'string' ? entry.link : entry.link?.href;
      const contentHtml = entry.content || entry.summary || '';

      // Try multiple ways to get the image
      let image = entry.enclosure?.type?.startsWith('image')
        ? entry.enclosure.url
        : entry['media:content']?.url;

      // If no direct image, extract from content HTML
      if (!image && contentHtml) {
        image = extractMainImage(contentHtml);
      }

      items.push({
        title: entry.title ?? '',
        link: link ?? '',
        publishedAt: entry.updated
          ? new Date(entry.updated)
          : entry.published
            ? new Date(entry.published)
            : new Date(),
        image,
        contentHtml,
      });
    }
    return { title, description, items };
  }

  if (json['rdf:RDF']) {
    const channel = json['rdf:RDF'].channel;
    title = channel?.title;
    description = channel?.description;

    const rdfItems = Array.isArray(json['rdf:RDF'].item)
      ? json['rdf:RDF'].item
      : json['rdf:RDF'].item
        ? [json['rdf:RDF'].item]
        : [];
    for (const item of rdfItems) {
      const contentHtml = item.description || '';

      // Try multiple ways to get the image
      let image = item.enclosure?.type?.startsWith('image')
        ? item.enclosure.url
        : item['media:content']?.url;

      // If no direct image, extract from content HTML
      if (!image && contentHtml) {
        image = extractMainImage(contentHtml);
      }

      items.push({
        title: item.title ?? '',
        link: item.link ?? '',
        publishedAt: item['dc:date'] ? new Date(item['dc:date']) : new Date(),
        image,
        contentHtml,
      });
    }
    return { title, description, items };
  }

  return { title, description, items };
}
