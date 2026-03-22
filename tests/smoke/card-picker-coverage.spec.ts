import fs from 'node:fs';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';

const ARTIFACT_DIR = path.join(process.cwd(), 'tests', 'artifacts', 'card-picker');

test.use({ video: 'on', trace: 'on' });
test.setTimeout(180_000);

const SUPABASE_STORAGE_KEY = 'sb-snyozqiselfxfifpavmj-auth-token';
const SMOKE_USER_ID = '00000000-0000-0000-0000-000000000001';
const SMOKE_FAKE_JWT = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
  'eyJleHAiOjk5OTk5OTk5OTl9',
  'fakesig',
].join('.');

async function injectSmokeSession(page: Page): Promise<void> {
  await page.evaluate(
    ([key, token, smokeUserId]) => {
      const session = {
        access_token: token,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: 9999999999,
        refresh_token: 'smoke-refresh-token',
        user: {
          id: smokeUserId,
          aud: 'authenticated',
          role: 'authenticated',
          email: 'smoke@test.example',
          email_confirmed_at: '2021-01-01T00:00:00.000Z',
          created_at: '2021-01-01T00:00:00.000Z',
          updated_at: '2021-01-01T00:00:00.000Z',
          user_metadata: { name: 'Smoke Test' },
        },
      };
      window.localStorage.setItem(key, JSON.stringify(session));
    },
    [SUPABASE_STORAGE_KEY, SMOKE_FAKE_JWT, SMOKE_USER_ID] as const,
  );
}

async function startFromCleanState(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await page.evaluate(([smokeUserId]) => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    window.localStorage.setItem(
      'immanence-user-mode',
      JSON.stringify({
        state: {
          modeByUserId: {
            [smokeUserId]: 'explorer',
          },
          hasCompletedAccessChoiceByUserId: {
            [smokeUserId]: true,
          },
          accessPostureByUserId: {
            [smokeUserId]: 'full',
          },
        },
        version: 3,
      })
    );
  }, [SMOKE_USER_ID] as const);
  await injectSmokeSession(page);
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

async function ensureSectionExpanded(page: Page, title: string, expandedHint: RegExp): Promise<void> {
  const hint = page.getByText(expandedHint);
  if (await hint.isVisible().catch(() => false)) return;
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await page.getByRole('button', { name: new RegExp(escaped, 'i') }).click();
  await expect(hint).toBeVisible();
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
  await ensureDevPanelOpen(page);
  await ensureSectionExpanded(page, 'Inspector', /Universal picker \(parity phase\)/i);
  await page.getByRole('button', { name: 'Cards', exact: true }).click();

  const pickOrStop = page.getByRole('button', { name: /Pick Target|Stop Picking/i }).first();
  await pickOrStop.scrollIntoViewIfNeeded();
  const label = await pickOrStop.textContent();
  if (label && /stop picking/i.test(label)) {
    await pickOrStop.click();
  }

  const pick = page.getByRole('button', { name: 'Pick Target', exact: true }).first();
  await pick.scrollIntoViewIfNeeded();
  await pick.click();
  await expect(page.getByRole('button', { name: 'Stop Picking', exact: true }).first()).toBeVisible();
}

async function confirmPick(page: Page): Promise<void> {
  const stop = page.getByRole('button', { name: 'Stop Picking', exact: true }).first();
  if (await stop.isVisible().catch(() => false)) {
    await stop.click();
  }
}

async function pickByCardId(page: Page, cardId: string): Promise<void> {
  await startPick(page);
  await page.locator(`[data-card="true"][data-card-id="${cardId}"]`).first().click({ force: true });
  await expect(page.getByText(`Selected: ${cardId}`, { exact: false }).first()).toBeVisible();
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
  await pickByCardId(page, 'practice-options');
  await closeDevPanel(page);
  await snap(page, '03_practice_practice-options.png');

  // Wisdom page: pick a category card.
  await gotoHub(page);
  await page.getByRole('button', { name: 'Wisdom', exact: true }).first().click();
  await expect(page.getByText('Wisdom', { exact: false }).first()).toBeVisible();
  const firstWisdomNode = page.locator('[data-card="true"][data-card-id^="wisdomNode:"]').first();
  await expect(firstWisdomNode).toBeVisible();
  await startPick(page);
  await firstWisdomNode.click({ force: true });
  await expect(page.getByText(/Selected:\s+wisdomNode:/i).first()).toBeVisible();
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
