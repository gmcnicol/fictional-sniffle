// Stub for backward compatibility
export interface ExtractedArticleContent {
  mainImageUrl?: string;
  mainImageAlt?: string;
  contentHtml?: string;
}

export async function extractArticleContent(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _url: string,
): Promise<ExtractedArticleContent> {
  // Stub implementation
  return {};
}
