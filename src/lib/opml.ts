import { db, Feed, Folder } from './db';
import { normalizeUrl } from './normalizeUrl';

export interface ParsedFeed {
  title: string;
  url: string;
  folder?: string;
}

export function parseOpml(opml: string): ParsedFeed[] {
  const doc = new DOMParser().parseFromString(opml, 'text/xml');
  const feeds: ParsedFeed[] = [];

  function walk(node: Element, folder?: string) {
    node.querySelectorAll(':scope > outline').forEach((child) => {
      const xmlUrl = child.getAttribute('xmlUrl');
      if (xmlUrl) {
        feeds.push({
          title:
            child.getAttribute('text') || child.getAttribute('title') || xmlUrl,
          url: xmlUrl,
          folder,
        });
      } else {
        const name =
          child.getAttribute('text') ||
          child.getAttribute('title') ||
          undefined;
        walk(child, name);
      }
    });
  }

  const body = doc.querySelector('opml > body');
  if (body) {
    walk(body);
  }

  const seen = new Set<string>();
  return feeds.filter((f) => {
    const n = normalizeUrl(f.url);
    if (seen.has(n)) return false;
    seen.add(n);
    f.url = n;
    return true;
  });
}

export async function importOpml(opml: string) {
  const parsed = parseOpml(opml);
  const existing = await db.feeds.toArray();
  const existingSet = new Set(existing.map((f) => normalizeUrl(f.url)));

  const folderMap = new Map<string, number>();
  for (const item of parsed) {
    if (item.folder && !folderMap.has(item.folder)) {
      const folder = await db.folders.where('name').equals(item.folder).first();
      if (!folder) {
        const id = await db.folders.add({ name: item.folder });
        folderMap.set(item.folder, id);
      } else if (folder.id != null) {
        folderMap.set(item.folder, folder.id);
      }
    }
  }

  for (const item of parsed) {
    if (existingSet.has(item.url)) continue;
    const folderId = item.folder ? (folderMap.get(item.folder) ?? null) : null;
    await db.feeds.add({ url: item.url, title: item.title, folderId });
    existingSet.add(item.url);
  }
}

export function generateOpml(feeds: Feed[], folders: Folder[]): string {
  const folderMap = new Map<number, string>();
  folders.forEach((f) => {
    if (f.id != null) folderMap.set(f.id, f.name);
  });
  const byFolder = new Map<string, Feed[]>();
  const rootFeeds: Feed[] = [];
  for (const feed of feeds) {
    if (feed.folderId && folderMap.has(feed.folderId)) {
      const name = folderMap.get(feed.folderId)!;
      if (!byFolder.has(name)) byFolder.set(name, []);
      byFolder.get(name)!.push(feed);
    } else {
      rootFeeds.push(feed);
    }
  }
  let xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n<opml version="1.0"><body>';
  byFolder.forEach((feeds, name) => {
    xml += `<outline text="${escapeXml(name)}">`;
    feeds.forEach((f) => {
      xml += `<outline text="${escapeXml(f.title)}" type="rss" xmlUrl="${escapeXml(f.url)}" />`;
    });
    xml += '</outline>';
  });
  rootFeeds.forEach((f) => {
    xml += `<outline text="${escapeXml(f.title)}" type="rss" xmlUrl="${escapeXml(f.url)}" />`;
  });
  xml += '</body></opml>';
  return xml;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function exportOpml(): Promise<string> {
  const feeds = await db.feeds.toArray();
  const folders = await db.folders.toArray();
  return generateOpml(feeds, folders);
}
