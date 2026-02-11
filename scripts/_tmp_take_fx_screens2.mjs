import { chromium } from "playwright";
import process from "node:process";

const BASE = 'http://127.0.0.1:4173';

function setSettings(page, patch) {
  return page.addInitScript((patchObj) => {
    const key = 'immanence-settings';
    const raw = window.localStorage.getItem(key);
    let persisted = null;
    try { persisted = raw ? JSON.parse(raw) : null; } catch { persisted = null; }
    const next = {
      version: 1,
      state: {
        ...(persisted && persisted.state && typeof persisted.state === 'object' ? persisted.state : {}),
        ...patchObj,
      },
    };
    window.localStorage.setItem(key, JSON.stringify(next));
  }, patch);
}

async function gotoPractice(page) {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Practice', exact: true }).first().waitFor({ timeout: 60000 });
  await page.getByRole('button', { name: 'Practice', exact: true }).first().click();
  await page.locator('.practice-section-container').waitFor({ timeout: 60000 });
  await page.waitForTimeout(900);
}

async function setPracticeViaSelector(page, label) {
  const selectorButton = page.locator('[data-ui="practice-button"][data-practice-id]').first();
  await selectorButton.click({ force: true });
  const menuItem = page.getByRole('button', { name: new RegExp(`^\\s*${label}\\s*$`, 'i') }).first();
  await menuItem.waitFor({ timeout: 60000 });
  await menuItem.click();
  await page.waitForTimeout(900);
}

async function screenshot(path, goto) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1240, height: 760 } });
  await setSettings(page, { practiceButtonFxEnabled: true });
  await goto(page);
  await page.screenshot({ path, fullPage: true });
  await browser.close();
}

async function main() {
  const outBase = process.env.TEMP || '.';

  await screenshot(`${outBase}\\home_fx_on_v2.png`, async (page) => {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Practice', exact: true }).first().waitFor({ timeout: 60000 });
    await page.waitForTimeout(900);
  });

  await screenshot(`${outBase}\\practice_fx_breath_v2.png`, gotoPractice);

  await screenshot(`${outBase}\\practice_fx_awareness_v2.png`, async (page) => {
    await gotoPractice(page);
    await setPracticeViaSelector(page, 'Awareness');
  });

  await screenshot(`${outBase}\\practice_fx_visual_v2.png`, async (page) => {
    await gotoPractice(page);
    await setPracticeViaSelector(page, 'Visual');
  });

  await screenshot(`${outBase}\\practice_fx_sound_v2.png`, async (page) => {
    await gotoPractice(page);
    await setPracticeViaSelector(page, 'Vibration');
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
