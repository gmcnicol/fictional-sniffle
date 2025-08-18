import { test, expect } from '@playwright/test';

test('debug what happens when clicking an article', async ({ page }) => {
  // Go to the app
  await page.goto('http://localhost:5174/fictional-sniffle/');

  // Clear any existing data first
  await page.evaluate(() => {
    localStorage.removeItem('fictional-sniffle-db');
  });
  await page.reload();

  // Add QC feed
  await page.fill(
    'input[placeholder="Feed URL"]',
    'https://questionablecontent.net/QCRSS.xml',
  );
  await page.click('button[type="submit"]:has-text("Add Feed")');

  // Wait for the form to clear
  await expect(page.locator('input[placeholder="Feed URL"]')).toHaveValue('');

  // Sync to get articles
  await page.click('button[aria-label="Refresh feeds"]');

  // Wait for sync to complete
  await expect(
    page.locator('button[aria-label="Refresh feeds"]:has-text("🔄")'),
  ).toBeVisible();
  await page.waitForTimeout(2000);

  // Check that articles are loaded
  const articleElements = page.locator('[data-testid="article-item"]');
  await expect(articleElements.first()).toBeVisible();
  const articleCount = await articleElements.count();
  console.log(`Found ${articleCount} articles`);

  // Get the first article link
  const firstArticleLink = page
    .locator('[data-testid="article-item"] h3 a')
    .first();
  const articleUrl = await firstArticleLink.getAttribute('href');
  console.log('Article URL:', articleUrl);

  // Click the article
  await firstArticleLink.click();

  // Wait for navigation
  await page.waitForURL(/\/reader\/\d+/);
  console.log('Current URL after click:', page.url());

  // Take screenshot to see what's on the page
  await page.screenshot({
    path: 'test-results/debug-article-page.png',
    fullPage: true,
  });

  // Log what elements we can see
  const pageTitle = await page.title();
  console.log('Page title:', pageTitle);

  const allH1s = page.locator('h1');
  const h1Count = await allH1s.count();
  console.log('Number of h1 elements:', h1Count);

  for (let i = 0; i < h1Count; i++) {
    const h1Text = await allH1s.nth(i).textContent();
    const isVisible = await allH1s.nth(i).isVisible();
    console.log(`H1 ${i}: "${h1Text}" (visible: ${isVisible})`);
  }

  // Look for any content on the page
  const bodyContent = await page.locator('body').textContent();
  console.log('First 500 chars of body:', bodyContent?.substring(0, 500));
});
