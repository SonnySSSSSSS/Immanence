AUDIT_PROBE_SUPABASE_GH_PAGES_V1

---
## CURRENT STATUS — BETA AUTH ENABLED (Public Launch Gate: FAIL)

**Auth is enabled for beta access across all auth files:**
- `src/components/auth/AuthGate.jsx`: `ENABLE_AUTH = true` — sign-in/sign-up gate rendered on unauthenticated boot
- `src/lib/supabaseClient.js`: `ENABLE_AUTH = true` — real Supabase client active; `sb_publishable_...` key in use
- `src/components/SettingsPanel.jsx`: `ENABLE_AUTH = true` — sign-out and account-update UI active when signed in

**Beta status: ENABLED** — beta users can sign in, sign up, and sign out via the existing Supabase-backed flows.

**Key findings from code audit:**
- Credentials: Supabase URL and anon key (`sb_publishable_...`) are hardcoded in `supabaseClient.js`. `.env.local` has `VITE_SUPABASE_*` vars but they are NOT consumed. Anon key is safe to ship in browser bundles; security depends on RLS + policies.
- No elevated keys: No `sb_secret_`, `service_role`, or `SUPABASE_SERVICE_ROLE` in any browser-delivered code.
- Table queries detected: `src/state/offlineFirstUserStateSync.js` calls `supabase.from('user_documents')` (upsert + select). This is NOT auth-only. Section 3A below incorrectly claimed no `from()` calls — corrected here.
- All public-launch Launch Gate checklist items remain unchecked (no flow testing done).

**Public Launch Gate verdict: FAIL** — remaining blocking conditions for public launch:
1. ~~Auth disabled while launch goal includes account creation/login.~~ ✅ RESOLVED — auth re-enabled for beta.
2. Email confirmation/recovery flows still need an end-to-end live redirect test on the GitHub Pages subpath.
3. Signup anti-abuse posture still needs an explicit human decision for public exposure (`mailer_autoconfirm` was enabled until 2026-03-06 dashboard hardening).
4. Rate limits/CAPTCHA are now reviewed for beta, but broader public-launch abuse posture is still a product decision.

**Smoke test coverage vs real beta auth verification:**

| What is verified | Coverage | How |
|---|---|---|
| Auth gate blocks unauthenticated boot | ✅ Smoke TEST 1 | No session in localStorage → Email input visible |
| Hub renders when session present | ✅ Smoke TEST 1–4 | Fake session injected into localStorage |
| `offlineFirstUserStateSync` guarded by userId | ✅ Code + comment | `tick()` calls `getSession()` independently; returns early if `!userId` |
| `supabase.auth.signOut()` clears session + fires SIGNED_OUT | ✅ Smoke TEST 5 | Real client call with mocked `/auth/v1/logout` → auth gate returns |
| Real Supabase `signInWithPassword` works for beta users | ✅ Smoke TEST 6 VERIFIED | Passed against live project with real beta credentials (2026-03-06) |
| Real Supabase session token persists across reload | ✅ Smoke TEST 6 VERIFIED | Reload restored real JWT; hub rendered without re-login (2026-03-06) |
| `user_documents` read-only auth guard proven | ✅ Smoke TEST 6 VERIFIED | SELECT returned no auth error under real session (2026-03-06) |
| `user_documents` upsert (write path) under RLS | ✅ Smoke TEST 7 VERIFIED | Authenticated upsert succeeded; probe row written + deleted (2026-03-06) |
| `user_documents` DELETE policy present for owner | ✅ Smoke TEST 7 VERIFIED | Owner delete of probe row succeeded; cleanup confirmed (2026-03-06) |
| `user_documents` anon read isolation (RLS ON) | ✅ Smoke TEST 7 VERIFIED | Signed-out SELECT returned 0 rows — USING (auth.uid()=user_id) is active (2026-03-06) |
| `user_documents` cross-user isolation: B SELECT on A | ✅ Smoke TEST 8 VERIFIED | B query for A's row by A's user_id returned 0 rows (2026-03-06) |
| `user_documents` cross-user isolation: B UPDATE on A | ✅ Smoke TEST 8 VERIFIED | B tamper attempt silently blocked; A's row unchanged (2026-03-06) |
| `user_documents` cross-user isolation: B DELETE on A | ✅ Smoke TEST 8 VERIFIED | B delete attempt silently blocked; A's row still exists (2026-03-06) |
| `user_documents` forged INSERT (B with A's user_id) | ✅ Smoke TEST 8 VERIFIED | WITH CHECK rejected forged insert with RLS policy error (2026-03-06) |
| OAuth/phone/SAML/anon provider surface | ✅ API VERIFIED | `/auth/v1/settings`: email only; all OAuth, phone, SAML, anon = false (2026-03-06) |
| Redirect allowlist covers GH Pages URL | ✅ DASHBOARD VERIFIED | `Site URL` = `https://SonnySSSSSSS.github.io/Immanence/`; redirects = GH Pages subpath + `http://localhost:5173/` only (2026-03-06) |
| Anti-abuse: email confirmation required on signup | ✅ DASHBOARD VERIFIED | `Authentication -> Sign In / Providers -> Confirm email` enabled (2026-03-06) |
| Anti-abuse: rate limits and CAPTCHA posture | ✅ DASHBOARD VERIFIED | CAPTCHA off by explicit beta choice; rate limits reviewed in dashboard (2026-03-06) |
| Provider surface reduced before launch | ✅ DASHBOARD VERIFIED | Email enabled; anonymous/manual linking off; `/auth/v1/settings` and dashboard both show no OAuth/phone/SAML providers (2026-03-06) |

**Synthetic smoke sessions:** Tests 1–5 inject a fake JWT (`expires_at: 9999999999`) into
`sb-snyozqiselfxfifpavmj-auth-token`. Supabase `getSession()` returns this without a network
call. `tick()` in `offlineFirstUserStateSync` will attempt DB calls with this fake JWT and
receive 401/403 from Supabase, handled gracefully in local-only mode. TEST 5 additionally
intercepts `/auth/v1/logout` so `supabase.auth.signOut()` runs its full local cleanup path.

**Real beta auth status: VERIFIED for beta, not for public launch automation.** Live beta sign-in,
session restore, sign-out, `user_documents` RLS, and dashboard auth posture were verified on
2026-03-06. CI still uses synthetic sessions for smoke coverage unless runtime credentials are
supplied.

**Dashboard verification summary (2026-03-06):**
- `Authentication -> Sign In / Providers`
  - `Allow new users to sign up` = enabled
  - `Allow manual linking` = disabled
  - `Allow anonymous sign-ins` = disabled
  - `Confirm email` = enabled
- `Authentication -> URL Configuration`
  - `Site URL` = `https://SonnySSSSSSS.github.io/Immanence/`
  - Redirect URLs = `https://SonnySSSSSSS.github.io/Immanence/`, `http://localhost:5173/`
  - No wildcard redirects configured
- `Authentication -> Rate Limits`
  - emails = `2 / hour`
  - token refreshes = `150 / 5 min / IP`
  - token verifications = `30 / 5 min / IP`
  - sign-ups and sign-ins = `30 / 5 min / IP`
- `Authentication -> Attack Protection`
  - CAPTCHA = disabled by explicit beta choice
  - leaked-password protection = disabled in current dashboard state

**Remaining manual/public-launch decisions:**
- Decide whether the current email sending quota (`2 / hour`) is sufficient for expected beta volume.
- Decide whether leaked-password protection should be enabled for a stricter public-launch posture.
- Run one end-to-end email confirmation and password recovery flow against the GitHub Pages subpath to prove redirect behavior in practice, not only in configuration.

**To disable auth** (e.g. for smoke testing without a session): set `ENABLE_AUTH = false` in all three files above.
**To clear for public launch:** complete every unchecked item in this document and re-run the Launch Gate.

---

CHANGES IN THIS REVISION:

* Clarify `sb_publishable_...` (anon/publishable) is expected public; `sb_secret_...` / `service_role` are hard FAIL blockers if shipped to the browser.
* Replace bundle-scan “no publishable key” assertions with conditional checks based on whether auth is enabled in production.
* Require Supabase Dashboard inventory of *all* tables/policies/RLS and Storage buckets/policies (even if current client code doesn’t call `from()`/Storage).
* Require end-to-end redirect allowlist validation via real confirmation/recovery/OAuth flows on the GitHub Pages subpath.
* Add Launch Gate hard FAIL when auth is disabled in production but the launch goal includes signup/login.

// PROBE:SUPABASE_AUDIT:START

# SECURITY AUDIT - Supabase + GitHub Pages

## 1) Inventory Checklist (Supabase URL/key flow to client)

### A. Where Supabase values are defined

* [ ] `src/lib/supabaseClient.js:6` defines Supabase URL in client code:

  * `https://snyozqiselfxfifpavmj.supabase.co`
* [ ] `src/lib/supabaseClient.js:7` defines client key:

  * `sb_publishable_...` (anon/publishable key format; **safe to expose** — security must come from RLS + policies)
* [ ] **Hard blocker:** `sb_secret_...` (secret/elevated key) must never appear anywhere in browser-delivered code/config.
* [ ] `.env.local:1-2` also contains:

  * `VITE_SUPABASE_URL=...`
  * `VITE_SUPABASE_ANON_KEY=...` (value should be `sb_publishable_...`, not `sb_secret_...`)
* [ ] `.env.local` values are currently **not consumed** by `src/lib/supabaseClient.js` (hardcoded values are used instead).

### B. How values reach browser runtime

* [ ] `src/App.jsx:43` imports `AuthGate`.
* [ ] `src/App.jsx:532` wraps app in `<AuthGate ...>`.
* [ ] `src/components/auth/AuthGate.jsx:7` lazy-loads Supabase client via `import("../../lib/supabaseClient")`.
* [ ] `src/components/SettingsPanel.jsx:8` also lazy-loads Supabase client for sign-out path.
* [ ] Production build must have a single authoritative auth enablement state:

  * [ ] Verify all code paths referencing `ENABLE_AUTH` resolve to `true` in the production bundle if launch goal includes signup/login.
  * [ ] If any `ENABLE_AUTH` reference resolves differently (conflicting/partial enablement), treat as Launch Gate FAIL.

### C. Explicit secret exposure verification

* [ ] Repo scan (required) finds **no** elevated secrets:

  * [ ] `sb_secret_`
  * [ ] `service_role`
  * [ ] `SUPABASE_SERVICE_ROLE`
* [ ] Repo scan confirms any shipped key is publishable only (OK):

  * [ ] `sb_publishable_` may appear in source and in built bundles when auth is enabled.
* [ ] Build artifact scan (required) interpretation depends on auth enablement:

  * [ ] If auth is **enabled** in production (`ENABLE_AUTH=true`): bundles are expected to contain `sb_publishable_...` and/or Supabase URL; verify they are publishable-only and that **no** `sb_secret_` / `service_role` appears.
  * [ ] If auth is **disabled** in production (`ENABLE_AUTH=false`): bundles may legitimately omit `sb_publishable_...` due to gating/tree-shaking; treat this as a **Launch Gate FAIL** *if* the launch goal includes account creation/login.
* [ ] Human verify deployed browser-delivered artifacts (Network tab / “view-source” / static assets) contain **no** `sb_secret_` / `service_role` material.

---

## 2) Auth Checklist (GitHub Pages URL + required Supabase redirects)

### A. URLs/paths inferred from repo

* [ ] `package.json:5` homepage: `https://SonnySSSSSSS.github.io/Immanence`
* [ ] `vite.config.js:20` production base path: `/Immanence/`
* [ ] `src/main.jsx:31` route handling includes `/Immanence/trace` (and `/trace`) for app routing.
* [ ] Auth flow in code uses `signUp`/`signInWithPassword` only (`src/components/auth/AuthGate.jsx:65,70`) with no explicit `redirectTo`.

### B. Supabase Auth URL Configuration required (least privilege)

Set these in **Supabase Dashboard -> Authentication -> URL Configuration**:

* [ ] **Site URL**:

  * `https://SonnySSSSSSS.github.io/Immanence/`
* [ ] **Redirect URLs / Additional Redirect URLs**:

  * `https://SonnySSSSSSS.github.io/Immanence/`
  * `http://localhost:5173/` (local Vite dev default)
  * `http://127.0.0.1:5173/` (only if you actually use this host)

### C. Tightening rules

* [ ] Do **not** include broad wildcards (for example `https://*.github.io/*`).
* [ ] Do **not** include unrelated paths/domains.
* [ ] Add `https://SonnySSSSSSS.github.io/Immanence/trace` only if you intentionally use that path as an auth callback destination.
* [ ] Reconcile README local URL note (`README.md:129` shows `5175`) with actual dev URL before finalizing redirect allowlist.

### D. Prove redirects by flow test (required; do not guess)

* [ ] **Email confirmation (signup)**: create a user, click the confirmation link, and confirm the browser returns to the GitHub Pages **subpath** (`/Immanence/`) and the session resolves correctly.
* [ ] **Password recovery**: trigger password reset, click the recovery link, and confirm the return path and session recovery work on the GitHub Pages subpath.
* [ ] **OAuth (only if used)**: complete provider login and confirm callback/return stays inside the allowlist (no unexpected origin or path).
* [ ] If any of the above fails, treat redirect allowlist config as **not verified** (Launch Gate FAIL until fixed and re-tested).

### E. Provider Surface Reduction (Required)

* [ ] Disable any unused OAuth providers in Supabase Dashboard.
* [ ] Disable phone auth if not intentionally supported.
* [ ] Disable any experimental or unused auth mechanisms.
* [ ] Confirm only intended providers are enabled before launch.

### F. Signup Abuse / Rate-Limit Posture

* [ ] Confirm Supabase project rate limits are acceptable for public exposure.
* [ ] Decide explicitly whether CAPTCHA or email confirmation is required before granting session.
* [ ] Verify signup flow cannot be spammed to create unlimited accounts without friction.
* [ ] If no anti-abuse posture is configured, treat as Launch Gate FAIL before public exposure.

---

## 3) RLS Checklist (tables/buckets touched + required policy shape)

### A. Objects touched by app code search

Code search results:

* `supabase.auth.*` calls exist (`getSession`, `onAuthStateChange`, `signUp`, `signInWithPassword`, `signOut`, `updateUser`).
* **CORRECTION:** `supabase.from('user_documents')` IS present in `src/state/offlineFirstUserStateSync.js` (upsert at line ~289, select at line ~320). The previous claim of "no from() calls" was incorrect.
* No detected `supabase.rpc(...)` or `supabase.storage...` usage in `src/`.

Enumerated app-touched objects (from code search):

* [ ] **Tables:** `user_documents` — referenced by `offlineFirstUserStateSync.js` (upsert + select). RLS posture must be inventoried before auth is re-enabled.
* [ ] **Storage buckets:** none currently referenced by client code.

Required Supabase-side inventory (Dashboard) — **do this even if the app currently doesn’t query tables**:

* [ ] Enumerate **all tables** in the Supabase project (not just ones referenced in `src/`).
* [ ] Classify each table as **public** (intentionally world-readable) vs **private** (user-scoped / sensitive).
* [ ] For every **private** table:

  * [ ] RLS is **ON**.
  * [ ] Policies exist for intended operations (SELECT/INSERT/UPDATE/DELETE) and are scoped (for example via `auth.uid()`).
  * [ ] Policies are not permissive for `anon`/`authenticated` (no blanket `USING (true)` / `WITH CHECK (true)` for private data).
* [ ] Enumerate **all Storage buckets** (if any):

  * [ ] Confirm bucket public/private intent.
  * [ ] Confirm policies on `storage.objects` restrict reads/writes/deletes appropriately.
* [ ] Explicit rule: **Even unused tables/buckets must be secured** — an attacker can query them using the public `sb_publishable_...` key from any browser client.

### B. Required RLS baseline for any user-private table introduced/used

For each user-private table (example owner column `user_id`):

* [ ] RLS is **ON**.
* [ ] `SELECT` policy uses `auth.uid() = user_id`.
* [ ] `INSERT` policy uses `WITH CHECK (auth.uid() = user_id)`.
* [ ] `UPDATE` policy uses:

  * `USING (auth.uid() = user_id)`
  * `WITH CHECK (auth.uid() = user_id)`
* [ ] `DELETE` policy uses `USING (auth.uid() = user_id)`.
* [ ] No permissive catch-all policy (`USING (true)` / `WITH CHECK (true)`) on private tables.

### C. Required Storage policy shape if buckets are used

For each private bucket:

* [ ] Bucket is not publicly readable unless explicitly intended.
* [ ] Policies on `storage.objects` scope by both:

  * target `bucket_id`
  * object path ownership convention (for example first path segment equals `auth.uid()`).
* [ ] Read/write/delete restricted to owner-scoped objects only.

---

## 4) Black-Box Tests (deployed GH Pages + DevTools)

Use two sessions:

* Session A: normal browser profile (User A)
* Session B: incognito/private window (User B)

Run all tests from deployed URL:

* `https://SonnySSSSSSS.github.io/Immanence/`

### A. Setup (both sessions)

1. Create User A and User B via app UI.
2. Confirm each can sign in.
3. In each session DevTools console, initialize a test client:

```js
const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
const supabase = createClient('<PROJECT_URL>', '<PUBLISHABLE_KEY>');
const { data: me } = await supabase.auth.getUser();
console.log('current user id', me?.user?.id);
```

Use project URL/publishable key only (no service role key).

### B. Cross-user table isolation tests (if/when table exists)

In Session A:

```js
const ownerIdA = (await supabase.auth.getUser()).data.user.id;
const insA = await supabase
  .from('<TABLE>')
  .insert({ <OWNER_COL>: ownerIdA, note: 'A-private' })
  .select();
console.log(insA);
```

Capture `<A_ROW_ID>` and `<A_OWNER_ID>`.

In Session B (attacker simulation):

```js
// Read A's row directly
await supabase.from('<TABLE>').select('*').eq('id', '<A_ROW_ID>');

// Update A's row
await supabase.from('<TABLE>').update({ note: 'tamper' }).eq('id', '<A_ROW_ID>').select();

// Delete A's row
await supabase.from('<TABLE>').delete().eq('id', '<A_ROW_ID>').select();

// Forge insert with A's owner id
await supabase.from('<TABLE>').insert({ <OWNER_COL>: '<A_OWNER_ID>', note: 'forged' }).select();
```

Expected secure outcomes:

* read returns zero rows (or permission error)
* update/delete affect zero rows (or permission error)
* forged insert is rejected by `WITH CHECK`

### C. Storage isolation tests (if/when bucket exists)

In Session B:

```js
// Attempt reading A-owned object path
await supabase.storage.from('<BUCKET>').download('<A_OWNER_ID>/private.txt');

// Attempt writing into A-owned path
await supabase.storage.from('<BUCKET>').upload('<A_OWNER_ID>/evil.txt', new Blob(['x']), { upsert: true });
```

Expected secure outcomes:

* read/write denied unless policy allows that exact user/path

### D. Auth redirect tests

1. Trigger signup/signin flows that involve redirects (email confirmation/recovery if enabled).
2. Confirm return URL stays within configured allowlist.
3. Confirm unexpected domain/path redirect attempts are blocked by Supabase.

---

## 5) Launch Gate (PASS/FAIL - non-negotiable)

### PASS only if all are true

* [ ] No elevated key/secret present in browser-delivered artifacts:

  * [ ] No `sb_secret_...` anywhere in built/deployed assets.
  * [ ] No `service_role` key anywhere in built/deployed assets.
  * [ ] No `SUPABASE_SERVICE_ROLE` key anywhere in built/deployed assets.
* [ ] Production build must have a single authoritative auth enablement state (if launch goal includes signup/login):

  * [ ] Verified all `ENABLE_AUTH` references resolve to `true` in production build (single authoritative state).
* [ ] Provider surface reduced before launch (unused mechanisms OFF):

  * [ ] Verified only intended Auth providers are enabled (unused OAuth providers OFF, phone auth OFF if not supported).
* [ ] Presence of `sb_publishable_...` in browser bundles is acceptable (and expected when auth is enabled); security depends on RLS + policies.
* [ ] Every app-used private table has RLS ON.
* [ ] Every app-used private table has strict `auth.uid()`-scoped policies for SELECT/INSERT/UPDATE/DELETE.
* [ ] Any used Storage bucket has owner-scoped policies.
* [ ] Supabase Auth URL Configuration contains only required GH Pages + required local dev URLs.
* [ ] Cross-user black-box attacks are blocked in deployed site tests.

### FAIL (block launch) if any is true

* [ ] Auth remains disabled in production (`ENABLE_AUTH=false` or equivalent) while the launch goal includes new account creation/login.
* [ ] Any occurrence of `sb_secret_...` in browser-delivered code/config/assets (hard FAIL).
* [ ] Any occurrence of `service_role` in browser-delivered code/config/assets (hard FAIL; no exceptions).
* [ ] Any occurrence of `SUPABASE_SERVICE_ROLE` in browser-delivered code/config/assets (hard FAIL; no exceptions).
* [ ] Conflicting or partially enabled auth gating detected in production bundle.
* [ ] Unused auth providers or mechanisms remain enabled (OAuth/phone/etc.).
* [ ] No explicit signup anti-abuse posture (rate limits/CAPTCHA/confirmation) decided and verified.
* [ ] Any app-used private table has RLS OFF.
* [ ] Any private-data policy allows broad access (`true` without auth owner checks).
* [ ] Redirect allowlist is missing required URL(s) or includes over-broad/unexpected domains.
* [ ] Cross-user read/write/delete or forged-owner insert succeeds.

// PROBE:SUPABASE_AUDIT:END

---

## user_documents RLS verification

### Scope of verification

This section audits the `user_documents` table's row-level security (RLS) configuration using:
1. **Repo-visible evidence**: Client code paths, test definitions, schema references
2. **Test evidence**: Three comprehensive Playwright smoke tests (TEST 6, 7, 8) executed against the live Supabase project on 2026-03-06
3. **Client import evidence**: Supabase client configuration and auth flow definitions

This audit does **not** include dashboard-exported policy SQL (which would require explicit manual capture into the repo). The assessment is based on observed RLS behavior from test execution and code evidence of table ownership semantics.

### Repo evidence inspected

**Client code paths:**
- [`src/lib/supabaseClient.js`](src/lib/supabaseClient.js) — Supabase client initialization with URL and publishable anon key
- [`src/state/offlineFirstUserStateSync.js:279-322`](src/state/offlineFirstUserStateSync.js#L279-L322) — Table access: upsert and select operations
- [`tests/smoke/critical-flows.spec.ts:273-673`](tests/smoke/critical-flows.spec.ts#L273-L673) — TEST 6 (read guard), TEST 7 (write + anon isolation), TEST 8 (cross-user isolation)

**Absence of migrations/schema exports:**
- No Supabase migration files (`.sql`, Supabase CLI migrations) found in repo
- No `supabase/` directory or schema exports detected
- No policy definitions found in version control
- No table schema DDL found in repo

**Conclusion**: Table structure and policies exist only in the hosted Supabase project dashboard; repo lacks schema documentation.

### Table and ownership model

**Table name:** `user_documents`

**Ownership column:** `user_id` (type: inferred as UUID)
- Evidence: [`offlineFirstUserStateSync.js:279`](src/state/offlineFirstUserStateSync.js#L279) — row.user_id is populated from `await supabase.auth.getSession()` returning `session?.user?.id`
- Evidence: [`critical-flows.spec.ts:445-446`](tests/smoke/critical-flows.spec.ts#L445-L446) — test explicitly extracts `userId = sd?.session?.user?.id ?? null` and writes as `user_id: userId`

**Primary key:** `(user_id, doc_key)` (composite)
- Evidence: [`offlineFirstUserStateSync.js:290`](src/state/offlineFirstUserStateSync.js#L290) — `.upsert(row, { onConflict: 'user_id,doc_key' })`
- Evidence: [`critical-flows.spec.ts:453`](tests/smoke/critical-flows.spec.ts#L453) — same conflict clause in test write probe

**Row structure (from code):**
```
{
  user_id: UUID,           // owner, from auth.uid()
  doc_key: string,         // partition key (e.g., 'progress_bundle_v1', 'smoke_rls_probe_v1')
  doc: JSON,               // document payload
  updated_at: ISO8601,     // timestamp
  updated_by_device: string // device identifier
}
```

### RLS enablement

**Status: CONFIRMED by live smoke-test behavior**

This confirmation is based on **observed behavior from TEST 7 and TEST 8 executed on 2026-03-06** against the live Supabase project. No repo-versioned schema DDL was consulted (none exists).

Evidence:
- **TEST 7 (lines 487-504)**: Signed-out (anon) SELECT after owner upsert returned 0 rows with no auth error. This proves RLS USING predicate `auth.uid() = user_id` is active, not a permissive blanket policy.
  - If RLS were OFF, anon SELECT would return all rows.
  - If RLS were ON with `USING (true)`, anon would see all rows.
  - Actual result: 0 rows = RLS is ON and predicate is enforced.

- **TEST 8 (lines 603-620)**: Account B attempted SELECT/UPDATE/DELETE on Account A's rows by explicit user_id filter. RLS blocked all read attempts (0 rows) and silently blocked write attempts (0 rows affected).
  - If RLS were OFF, all operations would succeed regardless of user_id.
  - Actual result: reads filtered to 0, writes silently blocked = RLS is ON with owner-only access.

### Policies found

**Repo-visible policy SQL definitions:** None (no `.sql`, schema exports, or Supabase migrations in repo).

**Inferred policies from live test behavior** (behavioral evidence from TEST 6, 7, 8 on 2026-03-06; policy SQL not version-controlled):

1. **SELECT policy** — `USING (auth.uid() = user_id)`
   - Evidence: TEST 6 line 359, TEST 7 line 494, TEST 8 lines 604-607 all use `.select(...)` without `user_id` filter
   - Owner SELECT succeeds; anon SELECT returns 0 rows (line 504); B SELECT on A's user_id returns 0 rows (line 640)

2. **INSERT policy** — `WITH CHECK (auth.uid() = user_id)` or `INSERT (auth.uid() = user_id)`
   - Evidence: TEST 7 line 447, TEST 8 lines 570, 622
   - Owner upsert succeeds (line 464); B forged insert with A's user_id rejected (line 645)

3. **UPDATE policy** — `USING (auth.uid() = user_id)` or `USING (...) WITH CHECK (auth.uid() = user_id)`
   - Evidence: TEST 8 lines 610-613
   - Owner UPDATE succeeds; B UPDATE on A's row affects 0 rows (silently blocked, line 642)

4. **DELETE policy** — `USING (auth.uid() = user_id)`
   - Evidence: TEST 7 lines 472-475 (cleanup), TEST 8 line 616
   - Owner DELETE succeeds (line 477); B DELETE on A's row affects 0 rows (silently blocked, line 643)

**Policy SQL definitions:** Not available in repo; dashboard capture required for complete documentation.

### Client access paths touching user_documents

1. **Sync write path** — [`src/state/offlineFirstUserStateSync.js:288-290`](src/state/offlineFirstUserStateSync.js#L288-L290)
   ```javascript
   result = await supabase
     .from('user_documents')
     .upsert(row, { onConflict: 'user_id,doc_key' });
   ```
   - Triggered on user state change; userId from `auth.getSession()` per [`offlineFirstUserStateSync.js:388`](src/state/offlineFirstUserStateSync.js#L388)

2. **Sync read path** — [`src/state/offlineFirstUserStateSync.js:319-322`](src/state/offlineFirstUserStateSync.js#L319-L322)
   ```javascript
   let query = supabase
     .from('user_documents')
     .select('doc')
     .eq('doc_key', 'progress_bundle_v1');
   ```
   - No explicit `user_id` filter; relies entirely on RLS USING predicate to scope to owner
   - Called once per sync cycle (3s interval) when tab is visible and online

3. **Test read/write paths** — [`tests/smoke/critical-flows.spec.ts:355-365`](tests/smoke/critical-flows.spec.ts#L355-L365), [`tests/smoke/critical-flows.spec.ts:447`](tests/smoke/critical-flows.spec.ts#L447), [`tests/smoke/critical-flows.spec.ts:651-655`](tests/smoke/critical-flows.spec.ts#L651-L655)
   - Multiple select/upsert/delete test probe operations verify RLS isolation

### Assessment

**Status: PASS — live behavioral verification confirms owner-only isolation for beta use**

This PASS is based on **live smoke-test execution on 2026-03-06**, not on repo-versioned policy SQL (which is not present).

**Behavioral Evidence:**
- RLS is **enabled** on `user_documents` (confirmed by TEST 7 anon read returning 0 rows — if RLS were OFF, all rows would be visible)
- Owner-only **SELECT** policy is **active** (TEST 6 ✓, TEST 7 ✓, TEST 8 ✓)
- Owner-only **INSERT/UPDATE** policies are **active** (TEST 7 upsert ✓, TEST 8 forged insert blocked ✓)
- Owner-only **DELETE** policy is **active** (TEST 7 cleanup ✓, TEST 8 B deletion blocked ✓)
- **Cross-user isolation** is **enforced** (TEST 8: B cannot read, tamper, or delete A's rows)
- **Authentication guard** is **enforced** (anon cannot read; auth userid required in JWT)

All three smoke tests (6, 7, 8) executed successfully on 2026-03-06 against the live Supabase project. Zero bypasses detected.

### Verification status

**What is behaviorally verified (by live smoke tests on 2026-03-06):**
- `user_documents` table exists and is queryable from the client
- RLS is enabled on the table (not disabled)
- Ownership isolation is enforced via `auth.uid() = user_id` predicate behavior
- All four operations (SELECT, INSERT, UPDATE, DELETE) exhibit owner-only isolation
- Anonymous (unauthenticated) users cannot read or write
- Cross-user tampering is blocked: User B cannot read, update, or delete User A's rows
- User B's attempt to forge an insert with User A's user_id is rejected

**What is NOT verified (would require repo-captured policy SQL):**
- Exact SQL syntax of each policy (e.g., whether UPDATE uses separate USING/WITH CHECK or combined)
- Policy enable/disable status in dashboard UI (behavior proves active, but not the UI state itself)
- Presence of any additional restrictive policies beyond the core four operations
- Proof that no permissive policies exist that might bypass owner checks (not evidenced by tests without policy source)

**Test coverage:**
- **TEST 6** (lines 281-333): Real beta auth + read guard — ✅ VERIFIED
- **TEST 7** (lines 406-513): Write path + anon isolation — ✅ VERIFIED
- **TEST 8** (lines 528-673): Cross-user isolation (two accounts) — ✅ VERIFIED

All test verdicts are `expect(...).toBe(true)` (not skipped), indicating credentials were supplied and tests ran against the live project.

### Next action

**Recommended follow-up (not blocking, improves future auditability):**
Export the actual RLS policy SQL definitions from Supabase Dashboard (`Authentication -> Tables & Policies -> user_documents`) and commit them to `docs/supabase-schema.sql` or equivalent.

Current audit is based on **behavioral verification** (smoke tests). Adding **schema-text verification** (exported policies in repo) would:
1. Provide definitive proof of policy syntax for code review and auditing
2. Enable version control history tracking of policy changes
3. Allow faster future policy verification without dashboard access
4. Document schema for new contributors
5. Prove that no additional permissive policies exist beyond those tested

**Current state is production-ready for the beta.** Behavioral verification (PASS) stands. Dashboard policy capture would strengthen future audits but is not required for this conclusion.

---

## real beta auth validation

### Scope of validation

This pass is limited to the real beta auth flow: `signInWithPassword`, session persistence across page reload, token refresh continuity, and protected access after sign-out. This does not cover broader auth architecture review, email confirmation redirect flows, or signup anti-abuse posture (those are addressed separately in the Launch Gate checklist above).

Verification is done against the live Supabase project. CI smoke tests 1–5 use synthetic sessions and are explicitly excluded from "real beta auth" claims.

### Evidence inspected

- [`tests/smoke/critical-flows.spec.ts`](tests/smoke/critical-flows.spec.ts) — TEST 5 (sign-out), TEST 6 (sign-in + session restore), TEST 7 (anon access after sign-out), TEST 8 (cross-user isolation), TEST 9 (forced token refresh — added in this pass)
- [`SECURITY_AUDIT_SUPABASE_GH_PAGES.md`](SECURITY_AUDIT_SUPABASE_GH_PAGES.md) — existing verification table (lines 29–47) recording TEST 6, 7, 8 as VERIFIED on 2026-03-06
- [`README.md`](README.md) — smoke coverage notes (lines 13–15)
- [`src/lib/supabaseClient.js`](src/lib/supabaseClient.js) — client init; `ENABLE_AUTH = true`, real Supabase URL, publishable anon key

No runtime auth logic files were edited during this pass.

### Sign-in with password

**VERIFIED — by live smoke test (TEST 6, 2026-03-06)**

TEST 6 ([lines 311–332](tests/smoke/critical-flows.spec.ts#L311-L332)): calls `supabase.auth.signInWithPassword({ email, password })` against the live Supabase project using real beta credentials. The test then asserts hub renders (proving the auth chain succeeds end-to-end) and additionally verifies `userId` is non-null and not the synthetic smoke placeholder (`00000000-0000-0000-0000-000000000001`).

### Session persistence across reload

**VERIFIED — by live smoke test (TEST 6, 2026-03-06)**

TEST 6 ([lines 335–345](tests/smoke/critical-flows.spec.ts#L335-L345)): after a successful real sign-in, calls `page.reload()`, waits for domcontentloaded, then asserts hub is still visible. This proves that Supabase auth-js stores the session (including the `refresh_token`) into `localStorage` under `sb-snyozqiselfxfifpavmj-auth-token`, and that `getSession()` restores it without a network call on the next page load.

### Token refresh continuity

This sub-behavior has two distinct aspects:

**1. `refresh_token` storage across reload — VERIFIED (indirectly by TEST 6)**

The session object Supabase stores in localStorage includes `access_token`, `refresh_token`, and `expires_at`. TEST 6's reload step restores this full session. The `refresh_token` being present and valid is a prerequisite for that restore to succeed, so its persistence is structurally proven — but it is an indirect proof, not a direct refresh exchange.

**2. Forced `refreshSession()` exchange — UNVERIFIED (test added; execution attempted but credentials absent)**

TEST 9 ([tests/smoke/critical-flows.spec.ts](tests/smoke/critical-flows.spec.ts)) was added in the previous pass and covers this case. It signs in with real credentials, then calls `supabase.auth.refreshSession()` directly to force an immediate `refresh_token → new access_token` exchange against the live project. The test asserts:
- No error returned (endpoint reachable; `refresh_token` accepted by Supabase)
- `hasSessionAfter` is true (new session returned)
- `userIdAfter === userIdBefore` (session identity preserved through the exchange)
- Hub remains visible after the refresh (Supabase client accepted the new access token)

**Execution record (this pass):** TEST 9 execution was attempted. `BETA_TEST_EMAIL` was not set in the current shell environment; no `.env` file contained beta credentials. TEST 9 self-skipped. Forced refresh exchange status remains **UNVERIFIED** until the test is run with live credentials.

**3. Supabase client auto-refresh timer — UNVERIFIED**

The Supabase auth-js client runs a background `setInterval` that fires approximately 60 seconds before the access token's `expires_at` timestamp (typically 1 hour after issue). This timer triggers `refreshSession()` automatically without any user action. This behavior cannot be exercised in a time-bounded smoke run without:
- Waiting ~1 hour for natural expiry, or
- Patching `expires_at` in the stored session to a near-future value to force early timer trigger

Neither approach is included in the current smoke suite. This path remains **UNVERIFIED** from automated tests.

### Protected access after sign-out

**VERIFIED — by TEST 5 (synthetic), TEST 6, and TEST 7 (live, 2026-03-06)**

Three layers of evidence:

1. **TEST 5** ([lines 243–258](tests/smoke/critical-flows.spec.ts#L243-L258)): calls real `supabase.auth.signOut()` (network intercepted so local cleanup runs), asserts `SIGNED_OUT` event propagated through `onAuthStateChange` → `AuthGate` → UI returns to auth gate.

2. **TEST 6** ([lines 381–384](tests/smoke/critical-flows.spec.ts#L381-L384)): post-sign-out with real credentials — auth gate returns, proving the real sign-out cycle clears the session from localStorage.

3. **TEST 7** ([lines 487–507](tests/smoke/critical-flows.spec.ts#L487-L507)): after `supabase.auth.signOut()`, a SELECT on `user_documents` returns 0 rows with no error — proving the Supabase client now sends requests as `anon` (no JWT) and RLS blocks unauthenticated data access silently.

### Assessment

**PARTIAL — core beta auth flow is verified; forced token refresh exchange and background auto-refresh timer are both unverified**

What is verified: real `signInWithPassword` end-to-end, session storage and restore across reload, sign-out session clearing, and post-sign-out data protection.

What is not verified:
- Forced `refreshSession()` exchange (TEST 9 is in place but was not executed — credentials were absent from this environment)
- Supabase auth-js background auto-refresh timer (the `setInterval` that runs before token expiry in production without user action)

For the current beta scope, the unverified token refresh paths are low-risk outstanding items. Sign-in, session restore, and sign-out are all live-verified. Token refresh can be validated in one targeted credential-supplied run.

### Verification status

**Smoke-test proven (TEST 5, self-contained synthetic):**
- `supabase.auth.signOut()` clears local session and fires `SIGNED_OUT` → UI teardown

**Live-execution proven (TEST 6, 7 — 2026-03-06):**
- `signInWithPassword` succeeds against live Supabase project
- Session (including `refresh_token`) persists across reload via localStorage
- Sign-out clears real session; post-sign-out requests are treated as `anon`

**Instrumented but not yet executed:**
- `refresh_token` → new `access_token` exchange via `refreshSession()` — TEST 9 is in place; credentials were not present in the environment when execution was attempted in this pass; forced refresh is **UNVERIFIED**

**Still unverified (requires a separate timed live observation):**
- Supabase auth-js auto-refresh timer behavior: does the client silently refresh the token before the 1-hour expiry under real production conditions without user action?

### Next action

Run TEST 9 once with live beta credentials to convert forced token refresh from `UNVERIFIED` to `VERIFIED`:

```bash
BETA_TEST_EMAIL=you@example.com BETA_TEST_PASSWORD=secret npm run test:smoke
```

After TEST 9 passes live, the only remaining auth verification gap is the auto-refresh timer, which requires a long-duration live session observation (allow a real beta session to age to within 2 minutes of expiry and confirm the client auto-refreshes without re-login).
