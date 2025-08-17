import domainRulesData from './domainRules.json';

export interface DomainRule {
  image: string; // CSS selector for the main image
  alt?: string; // Attribute name to extract alt text from (e.g. 'title', 'alt')
  caption?: string; // CSS selector for caption element
}

export interface ExtractedContent {
  imageUrl?: string;
  caption?: string;
}

const domainRules: Record<string, DomainRule> = domainRulesData;

/**
 * Extracts main image and caption using domain-specific rules
 */
export function extractContentWithRules(
  url: string,
  document: Document,
): ExtractedContent | null {
  try {
    const hostname = new URL(url).hostname;
    const rule = domainRules[hostname];

    if (!rule) {
      return null;
    }

    const result: ExtractedContent = {};

    // Extract main image
    const imageElement = document.querySelector(rule.image) as HTMLImageElement;
    if (imageElement) {
      result.imageUrl =
        imageElement.src || imageElement.getAttribute('data-src') || undefined;

      // Extract caption from image attributes
      if (rule.alt) {
        const altText = imageElement.getAttribute(rule.alt);
        if (altText) {
          result.caption = altText;
        }
      } else if (imageElement.alt) {
        result.caption = imageElement.alt;
      }
    }

    // Extract caption from separate element if specified
    if (rule.caption && !result.caption) {
      const captionElement = document.querySelector(rule.caption);
      if (captionElement) {
        result.caption = captionElement.textContent?.trim();
      }
    }

    return result;
  } catch (error) {
    console.warn('Failed to apply domain rules:', error);
    return null;
  }
}

/**
 * Check if a domain has specific rules
 */
export function hasDomainRules(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return hostname in domainRules;
  } catch {
    return false;
  }
}

/**
 * Get all supported domains
 */
export function getSupportedDomains(): string[] {
  return Object.keys(domainRules);
}

/**
 * Apply heuristic image selection when domain rules don't apply
 */
export function extractImageHeuristic(document: Document): ExtractedContent {
  const result: ExtractedContent = {};

  // Look for images in common selectors
  const selectors = [
    'meta[property="og:image"]',
    'meta[name="twitter:image"]',
    '.comic img',
    '.content img',
    '.post-content img',
    '.entry-content img',
    'article img',
    'main img',
  ];

  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      if (element.tagName === 'META') {
        result.imageUrl = (element as HTMLMetaElement).content;
      } else if (element.tagName === 'IMG') {
        const img = element as HTMLImageElement;
        result.imageUrl = img.src || img.getAttribute('data-src') || undefined;
        if (img.alt) {
          result.caption = img.alt;
        }
      }

      if (result.imageUrl) {
        break;
      }
    }
  }

  return result;
}
