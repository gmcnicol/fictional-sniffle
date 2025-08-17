import { fetchReadableHtml } from './queries';
import { extractContentWithRules, hasDomainRules } from './rules';

export interface ExtractedArticleContent {
  mainImageUrl?: string;
  mainImageAlt?: string;
  contentHtml?: string;
}

/**
 * Extract enhanced content for an article using domain rules and readability
 */
export async function extractArticleContent(
  url: string,
): Promise<ExtractedArticleContent> {
  const result: ExtractedArticleContent = {};

  try {
    // Check if we have domain-specific rules
    if (hasDomainRules(url)) {
      try {
        // Fetch the original page to apply domain rules
        // For now, we'll use fetch directly. In production, this would need CORS handling
        const response = await fetch(url);
        if (response.ok) {
          const text = await response.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');

          const extracted = extractContentWithRules(url, doc);
          if (extracted?.imageUrl) {
            result.mainImageUrl = extracted.imageUrl;
            result.mainImageAlt = extracted.caption;
          }
        }
      } catch (error) {
        console.warn('Failed to apply domain rules for:', url, error);
      }
    }

    // If we don't have an image yet, try readability + heuristics
    if (!result.mainImageUrl) {
      try {
        const readableResult = await fetchReadableHtml(url);
        if (readableResult.html) {
          result.contentHtml = readableResult.html;
        }

        if (readableResult.mainImage) {
          result.mainImageUrl = readableResult.mainImage;
        }

        // If CORS blocked, we'll indicate this for user feedback
        if (readableResult.corsBlocked) {
          // Don't set contentHtml to signal that content extraction failed due to CORS
        }
      } catch (error) {
        console.warn('Failed to extract readable content for:', url, error);
      }
    } else {
      // We have an image from domain rules, but still try to get readable content
      try {
        const readableResult = await fetchReadableHtml(url);
        if (readableResult.html) {
          result.contentHtml = readableResult.html;
        }
      } catch (error) {
        console.warn('Failed to extract readable content for:', url, error);
      }
    }
  } catch (error) {
    console.error('Failed to extract content for:', url, error);
  }

  return result;
}

/**
 * Enhance an existing article with extracted content
 */
export async function enhanceArticleContent(
  articleId: number,
  url: string,
): Promise<void> {
  try {
    const extracted = await extractArticleContent(url);

    // Import dynamically to avoid circular dependency
    const { db } = await import('./db');

    // Update the article with extracted content
    const updates: Partial<{
      mainImageUrl: string | null;
      mainImageAlt: string | null;
      contentHtml: string | null;
    }> = {};

    if (extracted.mainImageUrl) {
      updates.mainImageUrl = extracted.mainImageUrl;
    }

    if (extracted.mainImageAlt) {
      updates.mainImageAlt = extracted.mainImageAlt;
    }

    if (extracted.contentHtml) {
      updates.contentHtml = extracted.contentHtml;
    }

    if (Object.keys(updates).length > 0) {
      await db.articles.update(articleId, updates);
    }
  } catch (error) {
    console.error('Failed to enhance article content:', error);
  }
}
