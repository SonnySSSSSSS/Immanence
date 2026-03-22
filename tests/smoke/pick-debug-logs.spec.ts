import { expect, test, type Page } from '@playwright/test';

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
  await ensureSectionExpanded(page, 'Inspector', /Universal picker \(parity phase\)/i);

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

  await expect(page.getByTestId('controls-presets-json')).toBeVisible();
  await expect(page.getByTestId('controls-presets-export')).toBeVisible();
  await expect(page.getByTestId('controls-presets-import')).toBeVisible();
  await expect(page.getByTestId('controls-presets-reset-all')).toBeVisible();

  const samplePreset = {
    version: 2,
    presets: {
      'homeHub:mode:navigation': {
        thickness: 4,
        speed: 0.04,
        chaos: 0.12,
        offsetPx: 10,
        color: '#11aaee',
        glow: 30,
        blur: 8,
        opacity: 0.62,
      },
    },
  };

  await page.getByTestId('controls-presets-json').fill(JSON.stringify(samplePreset));
  await page.getByTestId('controls-presets-import').click();
  await page.getByTestId('controls-presets-export').click();

  const exported = await page.getByTestId('controls-presets-json').inputValue();
  expect(exported).toContain('"homeHub:mode:navigation"');
  expect(exported).toContain('"glow": 30');
  expect(exported).toContain('"blur": 8');
  expect(exported).toContain('"opacity": 0.62');

  await page.getByRole('button', { name: 'Stop Picking', exact: true }).click();
});
