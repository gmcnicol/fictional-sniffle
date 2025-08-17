import { XMLParser } from 'fast-xml-parser';

export interface ParsedItem {
  title: string;
  link: string;
  publishedAt: Date;
  image?: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
});

export function parseFeed(xml: string): ParsedItem[] {
  const json = parser.parse(xml);
  const items: ParsedItem[] = [];

  if (json.rss && json.rss.channel) {
    const rssItems = Array.isArray(json.rss.channel.item)
      ? json.rss.channel.item
      : json.rss.channel.item
        ? [json.rss.channel.item]
        : [];
    for (const item of rssItems) {
      const image = item.enclosure?.type?.startsWith('image')
        ? item.enclosure.url
        : item['media:content']?.url;
      items.push({
        title: item.title ?? '',
        link: item.link ?? '',
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
        image,
      });
    }
    return items;
  }

  if (json.feed) {
    const entries = Array.isArray(json.feed.entry)
      ? json.feed.entry
      : json.feed.entry
        ? [json.feed.entry]
        : [];
    for (const entry of entries) {
      const link =
        typeof entry.link === 'string' ? entry.link : entry.link?.href;
      const image = entry.enclosure?.type?.startsWith('image')
        ? entry.enclosure.url
        : entry['media:content']?.url;
      items.push({
        title: entry.title ?? '',
        link: link ?? '',
        publishedAt: entry.updated
          ? new Date(entry.updated)
          : entry.published
            ? new Date(entry.published)
            : new Date(),
        image,
      });
    }
  }

  if (json['rdf:RDF']) {
    const rdfItems = Array.isArray(json['rdf:RDF'].item)
      ? json['rdf:RDF'].item
      : json['rdf:RDF'].item
        ? [json['rdf:RDF'].item]
        : [];
    for (const item of rdfItems) {
      const image = item.enclosure?.type?.startsWith('image')
        ? item.enclosure.url
        : item['media:content']?.url;
      items.push({
        title: item.title ?? '',
        link: item.link ?? '',
        publishedAt: item['dc:date'] ? new Date(item['dc:date']) : new Date(),
        image,
      });
    }
  }

  return items;
}
