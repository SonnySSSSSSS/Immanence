import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920 });
    await page.goto('http://localhost:5175/Immanence/', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Wait for the Avatar/instrument ring to render
    await page.waitForSelector('canvas', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshot.png', fullPage: false });
    console.log('Screenshot saved to screenshot.png');
    await browser.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
