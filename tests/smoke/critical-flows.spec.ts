import { expect, test, type Page } from '@playwright/test';

const HUB_BUTTONS = ['Practice', 'Wisdom', 'Application', 'Navigation'] as const;
const INITIATION_SLOT_ERROR = 'Please select exactly 2 time slots to begin this path.';

async function gotoAppRoot(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
}

async function startFromCleanState(page: Page): Promise<void> {
  await gotoAppRoot(page);
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
}

async function areHubButtonsVisible(page: Page): Promise<boolean> {
  for (const label of HUB_BUTTONS) {
    const visible = await page.getByRole('button', { name: label, exact: true }).first().isVisible().catch(() => false);
    if (!visible) return false;
  }
  return true;
}

async function hasHubAnchor(page: Page): Promise<boolean> {
  const todayPracticeVisible = await page.getByText("Today's Practice", { exact: false }).first().isVisible().catch(() => false);
  if (todayPracticeVisible) return true;

  const startSetupVisible = await page.getByText('START SETUP', { exact: false }).first().isVisible().catch(() => false);
  if (startSetupVisible) return true;

  return areHubButtonsVisible(page);
}

async function expectHubVisible(page: Page): Promise<void> {
  await expect
    .poll(async () => hasHubAnchor(page), {
      message: 'Expected HomeHub anchors to render',
    })
    .toBe(true);
}

async function openNavigationFromHub(page: Page): Promise<void> {
  await expectHubVisible(page);
  await page.getByRole('button', { name: 'Navigation', exact: true }).first().click();
  await expect(page.getByTestId('navigation-selector-button')).toBeVisible();
}

async function openInitiationPathOverlay(page: Page): Promise<void> {
  await openNavigationFromHub(page);

  await page.getByTestId('navigation-selector-button').click();
  const modal = page.getByTestId('navigation-selection-modal');
  await expect(modal).toBeVisible();

  await modal.getByRole('button', { name: /Paths/i }).click();
  await expect(modal).toBeHidden();
  await expect(page.getByTestId('path-grid-root')).toBeVisible();

  await page.getByTestId('path-card-initiation').click();
  await expect(page.getByTestId('path-overview-overlay')).toBeVisible();
  await expect(page.getByText('Step 2: Select Time Slots', { exact: true })).toBeVisible();
}

function getTimeSlotButtons(page: Page) {
  return page
    .getByTestId('path-overview-panel')
    .getByRole('button')
    .filter({ hasText: /^\d{1,2}:\d{2}\s(?:AM|PM)$/ });
}

async function beginInitiationPathWithTwoSlots(page: Page): Promise<void> {
  await openInitiationPathOverlay(page);
  const slotButtons = getTimeSlotButtons(page);
  await expect(slotButtons.first()).toBeVisible();
  await slotButtons.nth(0).click();
  await slotButtons.nth(1).click();
  await page.getByTestId('begin-path-button').click();
  await expect(page.getByTestId('active-path-root')).toBeVisible();
}

test('TEST 1 — Boot → HomeHub renders (Flow #1)', async ({ page }) => {
  await startFromCleanState(page);
  await expectHubVisible(page);
});

test('TEST 2 — Hub → Section navigation works (Flow #2)', async ({ page }) => {
  await startFromCleanState(page);
  await openNavigationFromHub(page);

  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expectHubVisible(page);

  await page.getByRole('button', { name: 'Practice', exact: true }).first().click();
  await expect(page.locator('.practice-section-container')).toBeVisible();

  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expectHubVisible(page);
});

test('TEST 3 — Navigation selector modal + Initiation slot enforcement (Flows #3 + #4)', async ({ page }) => {
  await startFromCleanState(page);
  await openInitiationPathOverlay(page);

  const slotButtons = getTimeSlotButtons(page);
  await expect(slotButtons.first()).toBeVisible();
  await slotButtons.nth(0).click();

  await page.getByTestId('begin-path-button').click({ force: true });
  await expect(page.getByText(INITIATION_SLOT_ERROR, { exact: true })).toBeVisible();

  await slotButtons.nth(1).click();
  await page.getByTestId('begin-path-button').click();
  await expect(page.getByTestId('active-path-root')).toBeVisible();
});

test('TEST 4 — Reload persists active path and no overlays auto-open (Flow #8)', async ({ page }) => {
  await startFromCleanState(page);
  await beginInitiationPathWithTwoSlots(page);

  await page.reload();
  await page.waitForLoadState('domcontentloaded');

  const navigationSelectorVisible = await page.getByTestId('navigation-selector-button').isVisible().catch(() => false);
  if (!navigationSelectorVisible) {
    await expectHubVisible(page);
    await page.getByRole('button', { name: 'Navigation', exact: true }).first().click();
  }

  await expect(page.getByTestId('active-path-root')).toBeVisible();
  await expect(page.getByTestId('path-overview-overlay')).toBeHidden();
  await expect(page.getByTestId('navigation-selection-modal')).toBeHidden();

  const homeButtonVisible = await page.getByRole('button', { name: 'Home', exact: true }).isVisible().catch(() => false);
  if (homeButtonVisible) {
    await page.getByRole('button', { name: 'Home', exact: true }).click();
  }
  await expectHubVisible(page);
});
