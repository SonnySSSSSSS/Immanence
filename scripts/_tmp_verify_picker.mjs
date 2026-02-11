import { chromium } from "playwright";
import process from "node:process";

const BASE = 'http://127.0.0.1:4173';

function setLocalStoragePatch(page, patch) {
  return page.addInitScript((patchObj) => {
    for (const [k, v] of Object.entries(patchObj)) {
      window.localStorage.setItem(k, v);
    }
  }, patch);
}

function patchSettings({ practiceButtonFxEnabled }) {
  const key = 'immanence-settings';
  const next = { version: 1, state: { practiceButtonFxEnabled: Boolean(practiceButtonFxEnabled) } };
  return { [key]: JSON.stringify(next) };
}

function patchPicker({ applyToAll, selectedKey }) {
  const key = 'immanence.dev.practiceButtonFxPicker';
  return { [key]: JSON.stringify({ applyToAll, selectedKey }) };
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  // 1) Apply-to-all ON
  {
    const page = await browser.newPage({ viewport: { width: 1240, height: 760 } });
    await setLocalStoragePatch(page, { ...patchSettings({ practiceButtonFxEnabled: true }), ...patchPicker({ applyToAll: true, selectedKey: null }) });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Practice', exact: true }).first().waitFor({ timeout: 60000 });
    await page.getByRole('button', { name: 'Practice', exact: true }).first().click();
    await page.locator('.practice-section-container').waitFor({ timeout: 60000 });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${process.env.TEMP}\\picker_apply_all_on.png`, fullPage: true });
    await page.close();
  }

  // 2) Apply-to-all OFF, target selector only (awareness:awareness)
  {
    const page = await browser.newPage({ viewport: { width: 1240, height: 760 } });
    await setLocalStoragePatch(page, { ...patchSettings({ practiceButtonFxEnabled: true }), ...patchPicker({ applyToAll: false, selectedKey: 'awareness:awareness' }) });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Practice', exact: true }).first().waitFor({ timeout: 60000 });
    await page.getByRole('button', { name: 'Practice', exact: true }).first().click();
    await page.locator('.practice-section-container').waitFor({ timeout: 60000 });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${process.env.TEMP}\\picker_apply_all_off_selected.png`, fullPage: true });
    await page.close();
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
