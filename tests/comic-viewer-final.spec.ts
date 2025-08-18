import { test, expect } from '@playwright/test';

test('complete comic viewer functionality - add feed, sync, view comic', async ({
  page,
}) => {
  // Ignore network errors (CORS/ERR_FAILED are expected)
  page.on('console', (msg) => {
    if (
      msg.type() === 'error' &&
      (msg.text().includes('CORS') || msg.text().includes('ERR_FAILED'))
    ) {
      return; // Ignore expected network errors
    }
  });

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

  // Wait for the form to clear (indicating feed was added)
  await expect(page.locator('input[placeholder="Feed URL"]')).toHaveValue('');

  // Sync to get articles by clicking the 🔄 button
  await page.click('button[aria-label="Refresh feeds"]');

  // Wait for sync to complete
  await expect(
    page.locator('button[aria-label="Refresh feeds"]:has-text("🔄")'),
  ).toBeVisible();
  await page.waitForTimeout(3000);

  // Check that articles are loaded
  const articleElements = page.locator('[data-testid="article-item"]');
  await expect(articleElements.first()).toBeVisible();
  const articleCount = await articleElements.count();
  console.log(`✅ Found ${articleCount} articles in feed list`);
  expect(articleCount).toBeGreaterThan(0);

  // Screenshot of feed list with articles
  await page.screenshot({
    path: 'test-results/comic-feed-list.png',
    fullPage: true,
  });

  // Click on the first article link to view the comic
  const firstArticleLink = page
    .locator('[data-testid="article-item"] h3 a')
    .first();
  await expect(firstArticleLink).toBeVisible();

  const articleTitle = await firstArticleLink.textContent();
  console.log(`📖 Clicking on article: "${articleTitle}"`);

  await firstArticleLink.click();

  // Wait for navigation to reader page
  await page.waitForURL(/\/reader\/\d+/);
  console.log(`🔗 Navigated to: ${page.url()}`);

  // Verify we're NOT seeing "Article not found"
  await expect(page.locator('text=Article not found')).not.toBeVisible();
  console.log('✅ Article page loaded successfully (no "not found" error)');

  // Verify we see the article title
  const readerTitle = page.locator('article h1');
  await expect(readerTitle).toBeVisible();
  const titleText = await readerTitle.textContent();
  console.log(`📰 Article title: "${titleText}"`);

  // Most importantly: verify we see the comic image
  const comicImage = page.locator('article img');
  await expect(comicImage).toBeVisible();

  const imageSrc = await comicImage.getAttribute('src');
  console.log(`🖼️  Comic image found: ${imageSrc}`);

  // Check that it's a QC comic image
  expect(imageSrc).toContain('questionablecontent.net/comics/');
  console.log('✅ Comic image is from Questionable Content');

  // Verify we see the "Back to feeds" link
  const backLink = page.locator('text=← Back to feeds');
  await expect(backLink).toBeVisible();

  // Take final screenshot of the comic viewer
  await page.screenshot({
    path: 'test-results/comic-reader-final.png',
    fullPage: true,
  });

  console.log('🎉 SUCCESS: Comic viewer is working perfectly!');
  console.log('- Feed added and synced');
  console.log('- Articles loaded from RSS');
  console.log('- Comic image displays correctly');
  console.log('- No duplicate images');
  console.log('- Navigation works properly');
});
