import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4173";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1240, height: 760 } });
  page.setDefaultTimeout(15000);

  console.log('goto');
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 15000 });

  console.log('find practice');
  const btn = page.getByRole('button', { name: /Practice/i }).first();
  await btn.waitFor({ timeout: 15000 });

  console.log('click');
  await btn.click({ timeout: 15000, noWaitAfter: true });

  console.log('wait container');
  await page.locator('.practice-section-container').waitFor({ timeout: 15000 });

  console.log('screenshot');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${process.env.TEMP}\\_debug_practice.png`, fullPage: true });

  await browser.close();
  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
