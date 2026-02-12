import { expect, test, type Page } from '@playwright/test';

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

async function ensureSectionExpanded(page: Page, title: string, expandedHint: RegExp): Promise<void> {
  const hint = page.getByText(expandedHint);
  if (await hint.isVisible().catch(() => false)) return;
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await page.getByRole('button', { name: new RegExp(escaped, 'i') }).click();
  await expect(hint).toBeVisible();
}

test('DEV — Universal picker parity: card + practice button', async ({ page }) => {
  await startFromCleanState(page);

  // Navigate to a page with practice buttons first (pick mode captures clicks).
  await page.getByRole('button', { name: 'Practice', exact: true }).first().click();
  await expect(page.locator('.practice-section-container')).toBeVisible();

  await openDevPanel(page);
  await ensureSectionExpanded(page, 'Inspector (NEW)', /Universal picker \(parity phase\)/i);

  // Practice button pick.
  await page.getByRole('button', { name: 'Practice Buttons', exact: true }).click();
  await page.getByRole('button', { name: 'Pick Target', exact: true }).click();
  await expect(page.getByText('Universal Picker Active', { exact: true })).toBeVisible();

  const practiceButton = page.locator('[data-ui="practice-button"]').first();
  await expect(practiceButton).toBeVisible();
  await practiceButton.click({ force: true });

  await expect(page.getByTestId('devpanel-universal-peek').getByText(/Selected:\s+(?!none)/i)).toBeVisible();
  await page.getByRole('button', { name: 'Confirm + Return', exact: true }).click();
  await expect(page.getByText('DEVELOPER PANEL', { exact: true })).toBeVisible();
  await ensureSectionExpanded(page, 'Inspector (NEW)', /Universal picker \(parity phase\)/i);
  await expect(page.getByText(/Selected:\s+(?!none)/i).first()).toBeVisible();

  // Card pick.
  await page.getByRole('button', { name: 'Cards', exact: true }).click();
  await page.getByRole('button', { name: 'Pick Target', exact: true }).click();
  await expect(page.getByText('Universal Picker Active', { exact: true })).toBeVisible();

  await page.locator('[data-card="true"][data-card-id="practice-options"]').first().click({ force: true });
  await expect(page.getByTestId('devpanel-universal-peek').getByText('Selected: practice-options', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Confirm + Return', exact: true }).click();
  await expect(page.getByText('DEVELOPER PANEL', { exact: true })).toBeVisible();
});
