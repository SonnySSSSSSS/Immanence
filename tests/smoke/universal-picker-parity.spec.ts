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

async function ensureHubReady(page: Page): Promise<void> {
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

test('DEV — Universal picker parity: controls + card', async ({ page }) => {
  await startFromCleanState(page);

  await ensureHubReady(page);

  await openDevPanel(page);
  await ensureSectionExpanded(page, 'Inspector (NEW)', /Universal picker \(parity phase\)/i);
  await page.getByRole('button', { name: /Inspector \(NEW\)/i }).scrollIntoViewIfNeeded();

  // Controls pick (home hub nav pill circle).
  await page.getByRole('button', { name: 'Controls', exact: true }).click();
  await page.getByRole('button', { name: 'Pick Target', exact: true }).click();
  await expect(page.locator('html')).toHaveClass(/dev-ui-controls-picking-active/);
  await expect(page.locator('html')).toHaveClass(/dev-ui-controls-capture-attached/);

  const nav = page.locator('[data-ui-id="homeHub:mode:navigation"]').first();
  await expect(nav).toBeVisible();
  await expect(nav).toHaveAttribute('data-ui-target', 'true');
  await nav.dispatchEvent('pointerdown', { bubbles: true, cancelable: true, composed: true, button: 0, clientX: 10, clientY: 10, pointerType: 'mouse' });
  await nav.dispatchEvent('pointerup', { bubbles: true, cancelable: true, composed: true, button: 0, clientX: 10, clientY: 10, pointerType: 'mouse' });
  await nav.dispatchEvent('click', { bubbles: true, cancelable: true, composed: true, button: 0, clientX: 10, clientY: 10 });

  const selectedNav = page.getByText(/Selected:\s+homeHub:mode:navigation/i);
  await selectedNav.scrollIntoViewIfNeeded();
  await expect(selectedNav).toBeVisible();
  const stopPick = page.getByRole('button', { name: 'Stop Picking', exact: true });
  await stopPick.scrollIntoViewIfNeeded();
  await stopPick.click();

  // Card pick.
  await page.getByRole('button', { name: 'Practice', exact: true }).first().click();
  await expect(page.locator('.practice-section-container')).toBeVisible();

  await page.getByRole('button', { name: 'Cards', exact: true }).click();
  await page.getByRole('button', { name: 'Pick Target', exact: true }).click();

  const practiceOptions = page.locator('[data-card="true"][data-card-id="practice-options"]').first();
  await expect(practiceOptions).toBeVisible();
  await practiceOptions.dispatchEvent('click', { bubbles: true, cancelable: true, composed: true, button: 0, clientX: 10, clientY: 10 });
  const selectedCard = page.getByText(/Selected:\s+practice-options/i).first();
  await selectedCard.scrollIntoViewIfNeeded();
  await expect(selectedCard).toBeVisible();
  const stopPick2 = page.getByRole('button', { name: 'Stop Picking', exact: true });
  await stopPick2.scrollIntoViewIfNeeded();
  await stopPick2.click();
});
