import { test, expect } from '@playwright/test';

test('should click an article and view it (not "article not found")', async ({ page }) => {
  // Go to the app
  await page.goto('http://localhost:5174/fictional-sniffle/');

  // Clear any existing data first
  await page.evaluate(() => {
    localStorage.removeItem('fictional-sniffle-db');
  });
  await page.reload();

  // Add QC feed
  await page.fill('input[placeholder="Feed URL"]', 'https://questionablecontent.net/QCRSS.xml');
  await page.click('button[type="submit"]:has-text("Add Feed")');

  // Wait for the form to clear (indicating feed was added)
  await expect(page.locator('input[placeholder="Feed URL"]')).toHaveValue('');
  
  // Sync to get articles by clicking the 🔄 button
  await page.click('button[aria-label="Refresh feeds"]');
  
  // Wait for sync to complete (when button text changes back from "Syncing...")
  await expect(page.locator('button[aria-label="Refresh feeds"]:has-text("🔄")')).toBeVisible();
  
  // Wait for articles to load
  await page.waitForTimeout(2000);
  
  // Check that articles are loaded using the test data attributes
  const articleElements = page.locator('[data-testid="article-item"]');
  await expect(articleElements.first()).toBeVisible();
  const articleCount = await articleElements.count();
  console.log(`Found ${articleCount} articles`);
  expect(articleCount).toBeGreaterThan(0);

  // Screenshot of feed list with articles
  await page.screenshot({ path: 'test-results/articles-loaded.png', fullPage: true });

  // Click on the first article link
  const firstArticleLink = page.locator('[data-testid="article-item"] h3 a').first();
  await expect(firstArticleLink).toBeVisible();
  
  // Get the URL before clicking
  const articleUrl = await firstArticleLink.getAttribute('href');
  console.log('Clicking article URL:', articleUrl);
  
  await firstArticleLink.click();
  
  // Wait for navigation to reader page
  await page.waitForURL(/\/reader\/\d+/);
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/article-page.png', fullPage: true });
  
  // Verify we're NOT seeing "Article not found"
  const notFoundText = page.locator('text=Article not found');
  await expect(notFoundText).not.toBeVisible();
  
  // Verify we see article content
  const articleTitle = page.locator('h1');
  await expect(articleTitle).toBeVisible();
  
  // Verify we see a proper article page
  const backLink = page.locator('text=← Back to feeds');
  await expect(backLink).toBeVisible();
  
  // Most importantly: verify we see an image (this is a COMIC viewer)
  const comicImage = page.locator('article img');
  await expect(comicImage).toBeVisible();
  console.log('Comic image found!');
  
  // Check if we have content HTML  
  const contentDiv = page.locator('div[style*="text-align: center"]');
  const hasContent = await contentDiv.count() > 0;
  console.log('Has content HTML:', hasContent);
  
  console.log('Article page loaded successfully!');
  console.log('Article title:', await articleTitle.textContent());
});