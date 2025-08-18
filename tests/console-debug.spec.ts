import { test, expect } from '@playwright/test';

test('check for console errors when navigating to article', async ({
  page,
}) => {
  // Listen to console messages
  const consoleMessages: string[] = [];
  const errors: string[] = [];

  page.on('console', (msg) => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    if (msg.type() === 'error' && !msg.text().includes('CORS policy')) {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (error) => {
    errors.push(`Page error: ${error.message}`);
  });

  // Go to the app
  await page.goto('http://localhost:5174/fictional-sniffle/');

  // Clear data and add feed
  await page.evaluate(() => {
    localStorage.removeItem('fictional-sniffle-db');
  });
  await page.reload();

  await page.fill(
    'input[placeholder="Feed URL"]',
    'https://questionablecontent.net/QCRSS.xml',
  );
  await page.click('button[type="submit"]:has-text("Add Feed")');
  await expect(page.locator('input[placeholder="Feed URL"]')).toHaveValue('');

  // Sync
  await page.click('button[aria-label="Refresh feeds"]');
  await expect(
    page.locator('button[aria-label="Refresh feeds"]:has-text("🔄")'),
  ).toBeVisible();
  await page.waitForTimeout(2000);

  // Click an article
  const firstArticleLink = page
    .locator('[data-testid="article-item"] h3 a')
    .first();
  await expect(firstArticleLink).toBeVisible();
  console.log('About to click article...');

  await firstArticleLink.click();
  await page.waitForTimeout(1000);

  console.log('Console messages:', consoleMessages.slice(-20)); // Last 20 messages
  console.log('Errors:', errors);

  if (errors.length > 0) {
    throw new Error(`Found ${errors.length} errors: ${errors.join(', ')}`);
  }

  // Check if ReaderPage is actually rendered
  const readerPageElement = page.locator('article');
  const isReaderVisible = await readerPageElement.isVisible();
  console.log('Is reader article element visible:', isReaderVisible);

  // Check what's in the main content area
  const mainContent = await page.locator('main').textContent();
  console.log(
    'Main content (first 200 chars):',
    mainContent?.substring(0, 200),
  );

  await page.screenshot({
    path: 'test-results/console-debug.png',
    fullPage: true,
  });
});
