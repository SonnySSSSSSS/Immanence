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

test('DEV — Pick Debug logs (nav pill + recommendations)', async ({ page }) => {
  const pickDebugLines: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    if (text.startsWith('[pick-debug] ')) pickDebugLines.push(text);
  });

  await startFromCleanState(page);

  // Ensure there are nav pills in the DOM (Navigation page has `.im-nav-pill` elements).
  await ensureHubReady(page);
  await page.getByRole('button', { name: 'Navigation', exact: true }).first().click();
  await expect(page.getByRole('button', { name: /◈ Compass|◇ Paths/i })).toBeVisible();

  // Open DevPanel + enable Pick Debug.
  await openDevPanel(page);
  await ensureSectionExpanded(page, 'Inspector (NEW)', /Universal picker \(parity phase\)/i);
  await page.getByRole('button', { name: /Pick Debug/i }).click();

  // Probes ON (helps manual verification; here just ensures toggles are wired).
  await page.getByRole('button', { name: 'Probe: Nav Pills', exact: true }).click();
  await page.getByRole('button', { name: 'Probe: Cards', exact: true }).click();

  // NAV PILL pick.
  await page.getByRole('button', { name: 'Nav Pills', exact: true }).click();
  await page.getByRole('button', { name: 'Pick Target', exact: true }).click();
  await expect(page.getByText('Universal Picker Active', { exact: true })).toBeVisible();

  const navPill = page.locator('.im-nav-pill').first();
  await expect(navPill).toBeVisible();
  await navPill.click({ force: true });

  await expect(page.getByTestId('devpanel-universal-peek').getByText(/Selected:\s+(?!none)/i)).toBeVisible();
  await page.getByRole('button', { name: 'Confirm + Return', exact: true }).click();
  await expect(page.getByText('DEVELOPER PANEL', { exact: true })).toBeVisible();

  // Navigate to Wisdom page (outside pick mode).
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await ensureHubReady(page);
  await page.getByRole('button', { name: 'Wisdom', exact: true }).first().click();
  await expect(page.getByText('Wisdom', { exact: false }).first()).toBeVisible();

  // RECOMMENDATIONS pick.
  await openDevPanel(page);
  await ensureSectionExpanded(page, 'Inspector (NEW)', /Universal picker \(parity phase\)/i);
  await page.getByRole('button', { name: 'Cards', exact: true }).click();
  await page.getByRole('button', { name: 'Pick Target', exact: true }).click();
  await expect(page.getByText('Universal Picker Active', { exact: true })).toBeVisible();

  const recommendationsPanel = page.locator('[data-card-id="wisdom:recommendationsPanel"]').first();
  await expect(recommendationsPanel).toBeVisible();
  await recommendationsPanel.click({ force: true });
  await expect(page.getByTestId('devpanel-universal-peek').getByText(/Selected:\s+(?!none)/i)).toBeVisible();
  await page.getByRole('button', { name: 'Confirm + Return', exact: true }).click();
  await expect(page.getByText('DEVELOPER PANEL', { exact: true })).toBeVisible();

  // Print 1 nav-pill and 1 recommendations debug line as ground-truth artifacts.
  const navLine = pickDebugLines.find((l) => l.includes('"mode":"universal:nav-pill"')) || null;
  const recLine = pickDebugLines.find((l) => l.includes('"resolvedId":"wisdom:recommendationsPanel"')) || null;

  console.log('PICK_DEBUG_NAV_PILL', navLine);
  console.log('PICK_DEBUG_RECOMMENDATIONS', recLine);

  expect(navLine).toBeTruthy();
  expect(recLine).toBeTruthy();
});
