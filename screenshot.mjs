import { chromium } from 'playwright';
import fs from 'fs';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await chromium.launch();
  let logs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
    
    page.on('console', msg => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', err => {
      logs.push(`[PAGE_ERROR] ${err.message}`);
    });

    console.log('Navigating to Record app...');
    await page.goto('http://localhost:8081');
    await delay(8000);
    
    await page.screenshot({ path: 'verify_record.png' });
    console.log('Took record tab screenshot');

    // Click 履歴 tab
    const rireki = page.locator('text=履歴');
    if (await rireki.count() > 0) {
      await rireki.click();
      await delay(2000);
      await page.screenshot({ path: 'verify_rireki.png' });
      console.log('Took rireki tab screenshot');
      
      // Click on first record to test detail view
      const firstRecord = page.locator('[style*="paddingVertical"]').first();
      if (await firstRecord.count() > 0) {
        await firstRecord.click();
        await delay(2000);
        await page.screenshot({ path: 'verify_detail.png' });
        console.log('Took detail view screenshot');
      }
    }

  } catch(e) {
    console.error('Error during run:', e);
    logs.push(`[TEST_RUNNER_ERROR] ${e.message}`);
  } finally {
    fs.writeFileSync('browser_errors.log', logs.join('\n'));
    console.log('Logs written to browser_errors.log');
    await browser.close();
  }
})();
