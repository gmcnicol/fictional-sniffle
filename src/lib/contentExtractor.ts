// Stub for backward compatibility
export interface ExtractedArticleContent {
  mainImageUrl?: string;
  mainImageAlt?: string;
  contentHtml?: string;
}

export async function extractArticleContent(
  _url: string,
): Promise<ExtractedArticleContent> {
  return {}; // Stub
}