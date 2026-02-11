import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4173";

const hardTimeout = setTimeout(() => {
  // eslint-disable-next-line no-console
  console.error('HARD_TIMEOUT');
  process.exit(2);
}, 20000);

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1240, height: 760 } });
  page.setDefaultTimeout(8000);

  console.log('goto');
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 8000 });

  console.log('find practice');
  const btn = page.getByRole('button', { name: /Practice/i }).first();
  await btn.waitFor({ timeout: 8000 });

  console.log('click');
  await btn.click({ timeout: 8000, noWaitAfter: true });

  console.log('wait container');
  await page.locator('.practice-section-container').waitFor({ timeout: 8000 });

  console.log('screenshot');
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${process.env.TEMP}\\_debug_practice.png`, fullPage: true });

  await browser.close();
  clearTimeout(hardTimeout);
  console.log('done');
}

main().catch((err) => {
  console.error('ERROR', err);
  process.exitCode = 1;
}).finally(() => {
  clearTimeout(hardTimeout);
});
