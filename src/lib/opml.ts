// Simplified OPML handling
import { db } from './db';

export interface ParsedFeed {
  title: string;
  url: string;
  folder?: string;
}

export interface OpmlValidationError {
  message: string;
  line?: number;
  feed?: ParsedFeed;
}

export interface OpmlImportResult {
  imported: number;
  skipped: number;
  errors: OpmlValidationError[];
}

export function parseOpml(_opml: string): { feeds: ParsedFeed[]; errors: OpmlValidationError[] } {
  return { feeds: [], errors: [] }; // Stub
}

export async function importOpml(_opml: string): Promise<OpmlImportResult> {
  return { imported: 0, skipped: 0, errors: [] }; // Stub
}

export async function exportOpml(): Promise<string> {
  const feeds = await db.getAllFeeds();
  
  let opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head>
    <title>RSS Feeds</title>
  </head>
  <body>
`;

  for (const feed of feeds) {
    opml += `    <outline type="rss" text="${escapeXml(feed.title)}" xmlUrl="${escapeXml(feed.url)}" />\n`;
  }

  opml += `  </body>
</opml>`;

  return opml;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}