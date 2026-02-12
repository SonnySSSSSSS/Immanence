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

async function ensureSectionExpanded(page: Page, title: string, expandedHint: RegExp): Promise<void> {
  const hint = page.getByText(expandedHint);
  if (await hint.isVisible().catch(() => false)) return;
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await page.getByRole('button', { name: new RegExp(escaped, 'i') }).click();
  await expect(hint).toBeVisible();
}

test('DEV — Controls picker readout + probes', async ({ page }) => {
  await startFromCleanState(page);
  await ensureHubReady(page);

  await openDevPanel(page);
  await ensureSectionExpanded(page, 'Inspector (NEW)', /Universal picker \(parity phase\)/i);

  await page.getByRole('button', { name: 'Probe: Targets', exact: true }).click();
  await page.getByRole('button', { name: 'Probe: Cards', exact: true }).click();

  await page.getByRole('button', { name: 'Controls', exact: true }).click();
  await page.getByRole('button', { name: 'Pick Target', exact: true }).click();
  await expect(page.locator('html')).toHaveClass(/dev-ui-controls-picking-active/);
  await expect(page.locator('html')).toHaveClass(/dev-ui-controls-capture-attached/);

  const nav = page.locator('[data-ui-id="homeHub:mode:navigation"]').first();
  await expect(nav).toBeVisible();
  await nav.dispatchEvent('pointerdown', { bubbles: true, cancelable: true, composed: true, button: 0, clientX: 10, clientY: 10, pointerType: 'mouse' });
  await nav.dispatchEvent('pointerup', { bubbles: true, cancelable: true, composed: true, button: 0, clientX: 10, clientY: 10, pointerType: 'mouse' });
  await nav.dispatchEvent('click', { bubbles: true, cancelable: true, composed: true, button: 0, clientX: 10, clientY: 10 });

  const selected = page.getByText(/Selected:\s+homeHub:mode:navigation/i);
  await selected.scrollIntoViewIfNeeded();
  await expect(selected).toBeVisible();
  await expect(page.getByText(/Selected:\s+homeHub:mode:navigation/i)).toBeVisible();
  await expect(page.getByText(/Role group:\s+homeHub/i)).toBeVisible();
  await expect(page.getByText(/Surface:\s+descendant/i)).toBeVisible();

  await page.getByRole('button', { name: 'Stop Picking', exact: true }).click();
});
