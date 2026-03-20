import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1080, height: 800 }
  });
  
  await page.goto('http://localhost:5175/Immanence/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // Wait for animations to settle
  
  await page.screenshot({ path: '/tmp/homehub-fullbleed.png', fullPage: false });
  
  console.log('Screenshot saved to /tmp/homehub-fullbleed.png');
  await browser.close();
})();
