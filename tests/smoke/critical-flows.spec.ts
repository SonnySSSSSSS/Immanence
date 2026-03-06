import { expect, test, type Page } from '@playwright/test';

const HUB_BUTTONS = ['Practice', 'Wisdom', 'Application', 'Navigation'] as const;
// Note: slot enforcement is now tested via disabled wizard Next button at step 3

// Supabase v2 reads the session from localStorage at this key on every page load.
// getSession() returns the stored session immediately (no network call) when
// expires_at is in the future. We inject a structurally-valid fake session with
// expires_at in year 2286 so AuthGate renders children instead of the sign-in form.
const SUPABASE_STORAGE_KEY = 'sb-snyozqiselfxfifpavmj-auth-token';
const SMOKE_FAKE_JWT = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', // {"alg":"HS256","typ":"JWT"}
  'eyJleHAiOjk5OTk5OTk5OTl9',              // {"exp":9999999999}
  'fakesig',
].join('.');

async function injectSmokeSession(page: Page): Promise<void> {
  await page.evaluate(
    ([key, token]) => {
      const session = {
        access_token: token,
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: 9999999999,
        refresh_token: 'smoke-refresh-token',
        user: {
          id: '00000000-0000-0000-0000-000000000001',
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
    [SUPABASE_STORAGE_KEY, SMOKE_FAKE_JWT] as const,
  );
}

async function gotoAppRoot(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
}

async function startFromCleanState(page: Page): Promise<void> {
  await gotoAppRoot(page);
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    const measuredAt = Date.now();
    const benchmark = {
      inhale: 4,
      hold1: 4,
      exhale: 4,
      hold2: 4,
      total: 16,
      measuredAt,
    };
    window.localStorage.setItem(
      'immanence-user-mode',
      JSON.stringify({
        state: { userMode: 'explorer', hasChosenUserMode: true },
        version: 0,
      })
    );
    window.localStorage.setItem(
      'immanence-breath-benchmark',
      JSON.stringify({
        state: {
          benchmark,
          lastBenchmark: benchmark,
          benchmarkHistory: [benchmark],
          benchmarksByRunId: {},
          attemptBenchmarksByRunId: {},
          lifetimeMax: {
            inhale: 4,
            hold1: 4,
            exhale: 4,
            hold2: 4,
            total: 16,
          },
        },
        version: 3,
      })
    );
  });
  await injectSmokeSession(page);
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
  // Advance through wizard steps 1 and 2 (no prerequisites)
  const wizardPanel = page.getByTestId('path-overview-panel');
  await wizardPanel.getByRole('button', { name: 'Next', exact: true }).click();
  await wizardPanel.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('Step 2: Select Time Slots', { exact: true })).toBeVisible();
  await page.evaluate(async () => {
    const navMod = await import('/src/state/navigationStore.js');
    const benchmarkMod = await import('/src/state/breathBenchmarkStore.js');
    const navState = navMod.useNavigationStore.getState();
    const runId = navState?.pendingAttemptRunId;
    const pathId = navState?.pendingAttemptPathId;
    if (!runId || !pathId) return;
    benchmarkMod.useBreathBenchmarkStore.getState().completeAttemptBenchmark({
      runId,
      source: 'fresh',
      results: {
        inhale: 4,
        hold1: 4,
        exhale: 4,
        hold2: 4,
        measuredAt: Date.now(),
      },
    });
  });
}

function getTimeSlotInputs(page: Page) {
  return page
    .getByTestId('path-overview-panel')
    .locator('input[type="time"]');
}

async function beginInitiationPathWithTwoSlots(page: Page): Promise<void> {
  await openInitiationPathOverlay(page);
  const slotInputs = getTimeSlotInputs(page);
  await expect(slotInputs.first()).toBeVisible();
  await slotInputs.nth(0).fill('08:00');
  await slotInputs.nth(1).fill('20:00');
  // Advance wizard: step 3 → 4 (slots valid) → 5 (benchmark already satisfied)
  const wizardPanel = page.getByTestId('path-overview-panel');
  await wizardPanel.getByRole('button', { name: 'Next', exact: true }).click();
  await wizardPanel.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByTestId('begin-path-button').click();
  await expect(page.getByTestId('active-path-root')).toBeVisible();
}

test('TEST 1 — Boot → HomeHub renders (Flow #1)', async ({ page }) => {
  // Unauthenticated boot must show sign-in gate (auth guard is active)
  await gotoAppRoot(page);
  await expect(page.getByPlaceholder('Email')).toBeVisible();

  // With session injected HomeHub renders
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

  const slotInputs = getTimeSlotInputs(page);
  await expect(slotInputs.first()).toBeVisible();
  await slotInputs.nth(0).fill('08:00');

  // With only 1 slot filled, wizard Next (step 3 → 4) must be disabled (slot enforcement)
  const wizardPanel = page.getByTestId('path-overview-panel');
  await expect(wizardPanel.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();

  await slotInputs.nth(1).fill('20:00');
  // Advance wizard: step 3 → 4 (slots valid) → 5 (benchmark already satisfied)
  await wizardPanel.getByRole('button', { name: 'Next', exact: true }).click();
  await wizardPanel.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByTestId('begin-path-button').click();
  await expect(page.getByTestId('active-path-root')).toBeVisible();
});

// TEST 5 — Sign-out cycle via real supabase.auth.signOut() (beta auth behavior)
//
// Why this tests real auth behavior:
//   - Calls the real supabase.auth.signOut() method (not a mock or localStorage clear)
//   - The Supabase auth-js _signOut() path: acquires lock → sends POST /auth/v1/logout
//     → removes local session → fires onAuthStateChange("SIGNED_OUT")
//   - App.jsx handleAuthChange("SIGNED_OUT") runs: stopUserStateSync, setAuthUser(null),
//     AuthGate sets session to null → sign-in gate re-renders
// Why we route-mock /auth/v1/logout:
//   - CORS: if localhost isn't in the Supabase allowlist, the network error would NOT be
//     treated as a 401/403 and _removeSession() would not run (see auth-js _signOut impl)
//   - Route intercept returns 204 so auth-js proceeds to _removeSession() normally
//   - All post-network code (local session clear, SIGNED_OUT event, UI teardown) runs real
test('TEST 5 — Sign-out returns to auth gate (beta auth cycle)', async ({ page }) => {
  // Intercept the Supabase logout API so CORS doesn't prevent _removeSession() from running
  await page.route('**/auth/v1/logout', route => route.fulfill({ status: 204, body: '' }));

  await startFromCleanState(page);
  await expectHubVisible(page);

  // Open settings via the Account button in the header
  await page.getByTitle('Click for account / logout').click();
  await expect(page.getByRole('button', { name: 'Sign Out', exact: true })).toBeVisible();

  // Click sign-out — calls real supabase.auth.signOut(), clears session, fires SIGNED_OUT
  await page.getByRole('button', { name: 'Sign Out', exact: true }).click();

  // Auth gate must return (proves SIGNED_OUT propagated through AuthGate → App)
  await expect(page.getByPlaceholder('Email')).toBeVisible();
});

// TEST 6 — Real beta auth: signInWithPassword, session restore on reload, and sign-out
//
// Prerequisites:
//   Set BETA_TEST_EMAIL and BETA_TEST_PASSWORD in the environment before running:
//     BETA_TEST_EMAIL=you@example.com BETA_TEST_PASSWORD=secret npm run test:smoke
//
// If credentials are absent the test self-skips and beta auth remains UNVERIFIED.
//
// What this proves (when credentials are supplied):
//   a) Real signInWithPassword succeeds against the live Supabase project
//   b) Supabase stores a real JWT in localStorage (not a synthetic placeholder)
//   c) Reload restores the real session via getSession() — hub visible without re-login
//   d) offlineFirstUserStateSync.tick() receives a non-null real userId → DB path is reached
//   e) A read-only SELECT on user_documents returns no auth error (proves RLS lets owner read)
//   f) signOut() clears the real session and returns to the auth gate
//
// What this does NOT prove (remains for manual/dashboard verification):
//   - user_documents upsert (write path) under RLS — not attempted to avoid uncontrolled writes
//   - email confirmation redirect flows
//   - cross-user RLS isolation
test('TEST 6 — Real beta sign-in, session restore, and sign-out', async ({ page }) => {
  const email = process.env.BETA_TEST_EMAIL ?? '';
  const password = process.env.BETA_TEST_PASSWORD ?? '';

  if (!email || !password) {
    // Not a test failure — credentials must be supplied manually for real-auth verification.
    // beta auth status remains UNVERIFIED until this test passes with live credentials.
    test.skip(true, [
      'BETA_TEST_EMAIL and BETA_TEST_PASSWORD are not set.',
      'Real beta auth is UNVERIFIED. Supply credentials at runtime to prove signInWithPassword,',
      'session restore, and user_documents auth guard against the live Supabase project.',
    ].join(' '));
    return;
  }

  // Intercept logout so CORS doesn't prevent _removeSession() from running (same as TEST 5).
  await page.route('**/auth/v1/logout', route => route.fulfill({ status: 204, body: '' }));

  // --- 1. Clean boot — no session injected ---
  await gotoAppRoot(page);
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
  await page.reload();
  await page.waitForLoadState('domcontentloaded');

  // Auth gate must be visible (signed-out state confirmed)
  await expect(page.getByPlaceholder('Email')).toBeVisible();

  // --- 2. Real sign-in via the live Supabase project ---
  await page.getByPlaceholder('Email').fill(email);
  await page.getByPlaceholder('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  // Dismiss name-prompt if shown for accounts without a stored display name
  const namePromptDismiss = page.getByRole('button', { name: 'Not now', exact: true });
  if (await namePromptDismiss.isVisible({ timeout: 3000 }).catch(() => false)) {
    await namePromptDismiss.click();
  }

  // Hub must appear — proves real signInWithPassword succeeded
  await expectHubVisible(page);

  // --- 3. Verify the stored session is a real Supabase token (not smoke placeholder) ---
  const userId = await page.evaluate(async () => {
    // @ts-ignore — runtime browser import; TypeScript cannot resolve Vite src paths from Node
    const mod = await import('/src/lib/supabaseClient.js');
    const { data } = await (mod as any).supabase.auth.getSession();
    return data?.session?.user?.id ?? null;
  });
  expect(userId).toBeTruthy();
  expect(userId).not.toBe('00000000-0000-0000-0000-000000000001'); // not synthetic smoke id

  // --- 4. Reload — proves real session persists across page load ---
  await page.reload();
  await page.waitForLoadState('domcontentloaded');

  // Dismiss name-prompt again if it re-appears after reload
  if (await namePromptDismiss.isVisible({ timeout: 3000 }).catch(() => false)) {
    await namePromptDismiss.click();
  }

  // Hub still visible — proves getSession() restored the real JWT from localStorage
  await expectHubVisible(page);

  // --- 5. user_documents: read-only auth guard check ---
  // offlineFirstUserStateSync.tick() will reach DB only when userId is non-null.
  // Here we do an explicit read-only SELECT to prove the auth chain reaches the table
  // without RLS blocking it (write path not tested to avoid uncontrolled mutations).
  const udResult = await page.evaluate(async () => {
    // @ts-ignore — runtime browser import; TypeScript cannot resolve Vite src paths from Node
    const mod = await import('/src/lib/supabaseClient.js');
    const supabase = (mod as any).supabase;
    const result = await supabase
      .from('user_documents')
      .select('doc_key, updated_at')
      .limit(1)
      .maybeSingle();
    return {
      hasError: !!result.error,
      errorCode: result.error?.code ?? null,
      errorMessage: result.error?.message ?? null,
      hasData: result.data !== null,
    };
  });

  if (udResult.hasError) {
    // PGRST116 = no rows — acceptable (empty user_documents for this account)
    const isNoRows = (udResult.errorMessage ?? '').includes('PGRST116') ||
                     (udResult.errorCode ?? '').includes('PGRST116');
    // Any 401/403/JWT error means the auth chain did NOT reach user_documents
    const isAuthError = (udResult.errorMessage ?? '').toLowerCase().includes('401') ||
                        (udResult.errorMessage ?? '').toLowerCase().includes('403') ||
                        (udResult.errorMessage ?? '').toLowerCase().includes('jwt') ||
                        (udResult.errorMessage ?? '').toLowerCase().includes('unauthorized');
    expect(isNoRows || !isAuthError).toBe(true);
  }

  // --- 6. Sign-out → auth gate returns ---
  await page.getByTitle('Click for account / logout').click();
  await expect(page.getByRole('button', { name: 'Sign Out', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sign Out', exact: true }).click();
  await expect(page.getByPlaceholder('Email')).toBeVisible();
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
