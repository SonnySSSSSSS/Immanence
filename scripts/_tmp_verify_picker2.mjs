import { chromium } from "playwright";
import process from "node:process";

const BASE = 'http://127.0.0.1:4173';

function setSettings(page, patchState) {
  return page.addInitScript((patch) => {
    const key = 'immanence-settings';
    const raw = window.localStorage.getItem(key);
    let persisted = null;
    try { persisted = raw ? JSON.parse(raw) : null; } catch { persisted = null; }
    const next = {
      version: 1,
      state: {
        ...(persisted && persisted.state && typeof persisted.state === 'object' ? persisted.state : {}),
        ...patch,
      },
    };
    window.localStorage.setItem(key, JSON.stringify(next));
  }, patchState);
}

function setPicker(page, cfg) {
  return page.addInitScript((c) => {
    window.localStorage.setItem('immanence.dev.practiceButtonFxPicker', JSON.stringify(c));
  }, cfg);
}

async function gotoPractice(page) {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  const practiceBtn = page.getByRole('button', { name: /Practice/i }).first();
  await practiceBtn.waitFor({ timeout: 60000 });
  await practiceBtn.click();
  await page.locator('.practice-section-container').waitFor({ timeout: 60000 });
  await page.waitForTimeout(700);
}

async function main() {
  const out = process.env.TEMP || '.';
  const browser = await chromium.launch({ headless: true });

  {
    const page = await browser.newPage({ viewport: { width: 1240, height: 760 } });
    await setSettings(page, { practiceButtonFxEnabled: true });
    await setPicker(page, { applyToAll: true, selectedKey: null });
    await gotoPractice(page);
    await page.screenshot({ path: `${out}\\picker_apply_all_on.png`, fullPage: true });
    await page.close();
  }

  {
    const page = await browser.newPage({ viewport: { width: 1240, height: 760 } });
    await setSettings(page, { practiceButtonFxEnabled: true });
    await setPicker(page, { applyToAll: false, selectedKey: 'awareness:awareness' });
    await gotoPractice(page);
    await page.screenshot({ path: `${out}\\picker_apply_all_off_selected.png`, fullPage: true });
    await page.close();
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
