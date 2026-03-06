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
2. Redirect allowlist (GH Pages site URL + email confirmation/recovery flows) not verified.
3. `supabase.from('user_documents')` table exists — RLS posture not inventoried or verified.
4. Signup anti-abuse posture (rate limits / CAPTCHA / email confirmation) not decided or verified.
5. Unused auth providers/mechanisms not audited or disabled.

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
| `user_documents` upsert (write path) succeeds under RLS | ❌ UNVERIFIED | Not tested to avoid uncontrolled writes; requires manual dashboard verification |
| Redirect allowlist covers GH Pages URL | ❌ UNVERIFIED | Must be confirmed in Supabase dashboard |

**Synthetic smoke sessions:** Tests 1–5 inject a fake JWT (`expires_at: 9999999999`) into
`sb-snyozqiselfxfifpavmj-auth-token`. Supabase `getSession()` returns this without a network
call. `tick()` in `offlineFirstUserStateSync` will attempt DB calls with this fake JWT and
receive 401/403 from Supabase, handled gracefully in local-only mode. TEST 5 additionally
intercepts `/auth/v1/logout` so `supabase.auth.signOut()` runs its full local cleanup path.

**Real beta auth status: UNVERIFIED in CI.** The sign-in/sign-up flows require a live Supabase
account and cannot be safely automated without test credentials. Manual beta validation is
required before public launch.

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
