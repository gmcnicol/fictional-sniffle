import { test, expect } from '@playwright/test';

test.describe('QC Feed Integration', () => {
  test('should add QC feed and display articles', async ({ page }) => {
    // Capture console logs and errors
    const consoleLogs: string[] = [];
    const errors: string[] = [];

    page.on('console', (msg) => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Go to the app
    console.log('Navigating to:', 'http://localhost:5174/fictional-sniffle/');
    await page.goto('http://localhost:5174/fictional-sniffle/');

    // Wait for any loading to complete
    await page.waitForLoadState('networkidle');

    // Take screenshot to see what's displayed
    await page.screenshot({ path: 'debug-page-load.png' });

    // Get page title and content
    const title = await page.title();
    const content = await page.textContent('body');
    console.log('Page title:', title);
    console.log('Page content:', content?.substring(0, 500));

    // Print any console logs or errors
    console.log('Console logs:', consoleLogs);
    console.log('Page errors:', errors);

    // Wait a bit more for React components to render
    await page.waitForTimeout(2000);

    // Check what h1 elements exist
    const h1Elements = await page.locator('h1').allTextContents();
    console.log('H1 elements found:', h1Elements);

    // Check what form elements exist
    const feedUrlInput = page.locator('input[placeholder*="Feed"]');
    const inputExists = await feedUrlInput.count();
    console.log('Feed URL input count:', inputExists);

    if (inputExists > 0) {
      const placeholder = await feedUrlInput.getAttribute('placeholder');
      console.log('Input placeholder:', placeholder);
    }

    // Now try to add the QC feed
    console.log('Trying to add QC feed...');

    await page.fill(
      'input[placeholder="Feed URL"]',
      'https://questionablecontent.net/QCRSS.xml',
    );
    await page.click('button[type="submit"]:has-text("Add Feed")');

    // Wait for the form to reset (indicates success or error)
    await page.waitForTimeout(3000);

    // Check if feed was added to the list
    const feedElements = await page
      .locator('text=QC RSS, text=Questionable Content')
      .count();
    console.log('Feed elements found:', feedElements);

    // Check if there's an error message (but don't wait forever)
    try {
      const errorMessage = await page
        .locator('div[style*="color: red"]')
        .textContent({ timeout: 2000 });
      if (errorMessage) {
        console.log('Error message:', errorMessage);
      }
    } catch {
      console.log('No error message found within timeout - likely success');
    }

    // Try manual sync
    console.log('Clicking refresh button...');
    await page.click('button[aria-label="Refresh feeds"]');
    await page.waitForTimeout(5000);

    // Check for articles
    const articleElements = await page
      .locator('ul li a[href*="/reader/"]')
      .count();
    console.log('Article elements found:', articleElements);

    // Print final state
    const finalContent = await page.textContent('body');
    console.log('Final page content:', finalContent?.substring(0, 1000));
  });

  test('should show detailed sync information', async ({ page }) => {
    await page.goto('http://localhost:5174/fictional-sniffle/');

    // Open browser dev tools to check for errors
    const consoleLogs: string[] = [];
    const errors: string[] = [];

    page.on('console', (msg) => {
      consoleLogs.push(`${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Add the feed
    await page.fill(
      'input[placeholder="Feed URL"]',
      'https://questionablecontent.net/QCRSS.xml',
    );
    await page.click('button[type="submit"]:has-text("Add Feed")');
    await page.waitForTimeout(3000);

    // Manual sync
    await page.click('button[aria-label="Refresh feeds"]');
    await page.waitForTimeout(5000);

    // Check console for any errors
    console.log('Console logs:', consoleLogs);
    console.log('Page errors:', errors);

    // Verify database state by checking if articles exist
    const articleCount = await page.evaluate(async () => {
      // @ts-expect-error - Access IndexedDB in browser
      return new Promise((resolve) => {
        const request = indexedDB.open('FictionalSniffleDB');
        request.onsuccess = () => {
          const db = request.result;
          const tx = db.transaction(['articles'], 'readonly');
          const store = tx.objectStore('articles');
          const countReq = store.count();
          countReq.onsuccess = () => resolve(countReq.result);
        };
      });
    });

    console.log('Articles in database:', articleCount);
    expect(articleCount).toBeGreaterThan(0);
  });
});
