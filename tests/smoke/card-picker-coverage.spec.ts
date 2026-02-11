import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const ARTIFACT_DIR = path.join(process.cwd(), 'tests', 'artifacts', 'card-picker');

test.use({ video: 'on', trace: 'on' });
test.setTimeout(180_000);

async function startFromCleanState(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
}

async function openDevPanel(page: Page): Promise<void> {
  await page.getByTitle('Dev Panel (Ctrl+Shift+D)').click();
  await expect(page.getByText('DEVELOPER PANEL', { exact: true })).toBeVisible();
}

async function ensureDevPanelOpen(page: Page): Promise<void> {
  const isOpen = await page.getByText('DEVELOPER PANEL', { exact: true }).isVisible().catch(() => false);
  if (isOpen) return;
  await openDevPanel(page);
}

async function closeDevPanel(page: Page): Promise<void> {
  const isOpen = await page.getByTestId('devpanel-root').isVisible().catch(() => false);
  if (!isOpen) return;
  await page.getByTestId('devpanel-close').click();
  await expect(page.getByTestId('devpanel-root')).toBeHidden();
}

async function gotoHub(page: Page): Promise<void> {
  await closeDevPanel(page);
  const home = page.getByRole('button', { name: 'Home', exact: true }).first();
  if (await home.isVisible().catch(() => false)) {
    await home.click();
  } else {
    await page.goto('/');
  }

  await expect
    .poll(async () => {
      const labels = ['Practice', 'Wisdom', 'Application', 'Navigation'] as const;
      for (const label of labels) {
        const visible = await page.getByRole('button', { name: label, exact: true }).first().isVisible().catch(() => false);
        if (!visible) return false;
      }
      return true;
    })
    .toBe(true);
}

async function startPick(page: Page): Promise<void> {
  if (await page.getByText('Card Picker Active', { exact: true }).isVisible().catch(() => false)) {
    await confirmPick(page);
  }

  await ensureDevPanelOpen(page);

  const pickOrStop = page.getByRole('button', { name: /Pick Card|Stop Picking/i }).first();
  await pickOrStop.scrollIntoViewIfNeeded();
  const label = await pickOrStop.textContent();
  if (label && /stop picking/i.test(label)) {
    await pickOrStop.click();
  }

  const pick = page.getByRole('button', { name: 'Pick Card', exact: true }).first();
  await pick.scrollIntoViewIfNeeded();
  await pick.click();
  await expect(page.getByText('Card Picker Active', { exact: true })).toBeVisible();
}

async function confirmPick(page: Page): Promise<void> {
  const btn = page.getByRole('button', { name: /Confirm \+ Return|Return/i });
  await btn.click();
  await expect(page.getByText('DEVELOPER PANEL', { exact: true })).toBeVisible();
}

async function pickByCardId(page: Page, cardId: string): Promise<void> {
  await startPick(page);
  await page.locator(`[data-card="true"][data-card-id="${cardId}"]`).first().click({ force: true });
  await expect(page.getByText(`Selected: ${cardId}`, { exact: true })).toBeVisible();
  await confirmPick(page);
}

async function ensureSelectedFxEnabled(page: Page): Promise<void> {
  await ensureDevPanelOpen(page);
  const toggle = page.getByRole('button', { name: /Enable Selected Card FX:/i });
  await toggle.scrollIntoViewIfNeeded();
  await expect(toggle).toBeVisible();
  const label = await toggle.textContent();
  if (!label?.includes('ON')) await toggle.click();
}

async function snap(page: Page, filename: string): Promise<void> {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, filename), fullPage: true });
}

test('DEV — Card picker coverage + carousel follow', async ({ page }) => {
  await startFromCleanState(page);
  await openDevPanel(page);

  // HomeHub: pick DailyPractice and enable overlay.
  await pickByCardId(page, 'dailyPractice');
  await ensureSelectedFxEnabled(page);
  await expect(page.locator('[data-dev-overlay="selected-card-electric-border"]')).toBeVisible();
  await snap(page, '01_homehub_dailyPractice.png');

  // Carousel slide change: border should follow the active card.
  await closeDevPanel(page);
  await page.getByRole('button', { name: 'Show Progress Overview', exact: true }).click();
  await page.waitForTimeout(650);
  await snap(page, '02_homehub_progress_slide.png');

  // Practice page: pick practice options card.
  await page.getByRole('button', { name: 'Practice', exact: true }).first().click();
  await expect(page.locator('.practice-section-container')).toBeVisible();
  await pickByCardId(page, 'practiceOptions');
  await closeDevPanel(page);
  await snap(page, '03_practice_practiceOptions.png');

  // Wisdom page: pick a category card.
  await gotoHub(page);
  await page.getByRole('button', { name: 'Wisdom', exact: true }).first().click();
  await expect(page.getByText('Wisdom', { exact: false }).first()).toBeVisible();
  const firstWisdomNode = page.locator('[data-card="true"][data-card-id^="wisdomNode:"]').first();
  await expect(firstWisdomNode).toBeVisible();
  await startPick(page);
  await firstWisdomNode.click({ force: true });
  await expect(page.getByText(/Selected:\s+wisdomNode:/i)).toBeVisible();
  await confirmPick(page);
  await closeDevPanel(page);
  await snap(page, '04_wisdom_categoryCard.png');

  // Navigation page: pick a path card.
  await gotoHub(page);
  await page.getByRole('button', { name: 'Navigation', exact: true }).first().click();
  await expect(page.getByTestId('path-grid-root')).toBeVisible();
  await pickByCardId(page, 'path:initiation');
  await closeDevPanel(page);
  await snap(page, '05_navigation_path_initiation.png');

  // Modal: open the navigation selection modal and pick its panel.
  await page.getByTestId('navigation-selector-button').click();
  await expect(page.getByTestId('navigation-selection-modal')).toBeVisible();
  await pickByCardId(page, 'modal:navigationSelection');
  await closeDevPanel(page);
  await snap(page, '06_modal_navigationSelection.png');
});
