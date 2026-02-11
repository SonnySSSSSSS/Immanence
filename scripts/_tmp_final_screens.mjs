import { chromium } from "playwright";
import { spawn } from "node:child_process";
import http from "node:http";
import process from "node:process";

const PORT = 4174;
const BASE = `http://127.0.0.1:${PORT}`;

function waitForServer(url, timeoutMs = 120000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) reject(new Error('Timed out waiting for server'));
        else setTimeout(tick, 300);
      });
    };
    tick();
  });
}

function initStorage(page, { fxEnabled }) {
  return page.addInitScript(({ enabled }) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem('immanence-settings', JSON.stringify({
      version: 1,
      state: { practiceButtonFxEnabled: Boolean(enabled) },
    }));
    window.localStorage.setItem('immanence.dev.practiceButtonFxPicker', JSON.stringify({ applyToAll: true, selectedKey: null }));
  }, { enabled: fxEnabled });
}

async function gotoPractice(page) {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
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

async function snap(name, { fxEnabled, practiceLabel }) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1240, height: 760 } });
  await initStorage(page, { fxEnabled });
  await gotoPractice(page);
  if (practiceLabel) await setPracticeViaSelector(page, practiceLabel);
  await page.screenshot({ path: `${process.env.TEMP}\\${name}.png`, fullPage: true });
  await browser.close();
}

async function main() {
  const dev = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
    cwd: process.cwd(),
    shell: true,
    stdio: 'inherit',
  });

  try {
    await waitForServer(BASE + '/');

    await snap('before_practice_breath_fx_off', { fxEnabled: false, practiceLabel: null });
    await snap('after_practice_breath_fx_on', { fxEnabled: true, practiceLabel: null });

    await snap('after_practice_awareness_fx_on', { fxEnabled: true, practiceLabel: 'Awareness' });
    await snap('after_practice_visual_fx_on', { fxEnabled: true, practiceLabel: 'Visual' });
    await snap('after_practice_sound_fx_on', { fxEnabled: true, practiceLabel: 'Vibration' });
  } finally {
    dev.kill();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
