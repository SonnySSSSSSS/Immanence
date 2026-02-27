AUDIT_PROBE_SUPABASE_GH_PAGES_V1
// PROBE:SUPABASE_AUDIT:START

# SECURITY AUDIT - Supabase + GitHub Pages

## 1) Inventory Checklist (Supabase URL/key flow to client)

### A. Where Supabase values are defined

- [ ] `src/lib/supabaseClient.js:20` defines Supabase URL in client code:
  - `https://snyozqiselfxfifpavmj.supabase.co`
- [ ] `src/lib/supabaseClient.js:21` defines client key:
  - `sb_publishable_...` (anon/publishable key format)
- [ ] `.env.local:1-2` also contains:
  - `VITE_SUPABASE_URL=...`
  - `VITE_SUPABASE_ANON_KEY=...`
- [ ] `.env.local` values are currently **not consumed** by `src/lib/supabaseClient.js` (hardcoded values are used instead).

### B. How values reach browser runtime

- [ ] `src/App.jsx:43` imports `AuthGate`.
- [ ] `src/App.jsx:532` wraps app in `<AuthGate ...>`.
- [ ] `src/components/auth/AuthGate.jsx:7` lazy-loads Supabase client via `import("../../lib/supabaseClient")`.
- [ ] `src/components/SettingsPanel.jsx:8` also lazy-loads Supabase client for sign-out path.
- [ ] `src/lib/supabaseClient.js:5`, `src/components/auth/AuthGate.jsx:4`, and `src/components/SettingsPanel.jsx:7` all set `ENABLE_AUTH = false` currently.

### C. Explicit secret exposure verification

- [x] Repo scan found **no** `service_role`, `SUPABASE_SERVICE_ROLE`, or `sb_secret` strings.
- [x] Only publishable client key pattern found: `sb_publishable_...` in:
  - `src/lib/supabaseClient.js:21`
  - `.env.local:2`
- [x] Build artifact scan (`dist/`, `gh-pages/`) found no `supabase`, `sb_publishable_`, `service_role`, or `sb_secret` strings.
- [ ] Human verify browser bundles/network from deployed site also contain no service-role material.

---

## 2) Auth Checklist (GitHub Pages URL + required Supabase redirects)

### A. URLs/paths inferred from repo

- [ ] `package.json:5` homepage: `https://SonnySSSSSSS.github.io/Immanence`
- [ ] `vite.config.js:20` production base path: `/Immanence/`
- [ ] `src/main.jsx:31` route handling includes `/Immanence/trace` (and `/trace`) for app routing.
- [ ] Auth flow in code uses `signUp`/`signInWithPassword` only (`src/components/auth/AuthGate.jsx:65,70`) with no explicit `redirectTo`.

### B. Supabase Auth URL Configuration required (least privilege)

Set these in **Supabase Dashboard -> Authentication -> URL Configuration**:

- [ ] **Site URL**:
  - `https://SonnySSSSSSS.github.io/Immanence/`
- [ ] **Redirect URLs / Additional Redirect URLs**:
  - `https://SonnySSSSSSS.github.io/Immanence/`
  - `http://localhost:5173/` (local Vite dev default)
  - `http://127.0.0.1:5173/` (only if you actually use this host)

### C. Tightening rules

- [ ] Do **not** include broad wildcards (for example `https://*.github.io/*`).
- [ ] Do **not** include unrelated paths/domains.
- [ ] Add `https://SonnySSSSSSS.github.io/Immanence/trace` only if you intentionally use that path as an auth callback destination.
- [ ] Reconcile README local URL note (`README.md:129` shows `5175`) with actual dev URL before finalizing redirect allowlist.

---

## 3) RLS Checklist (tables/buckets touched + required policy shape)

### A. Objects touched by app code search

Code search results:
- `supabase.auth.*` calls exist (`getSession`, `onAuthStateChange`, `signUp`, `signInWithPassword`, `signOut`).
- No detected `supabase.from(...)`, `supabase.rpc(...)`, or `supabase.storage...` usage in `src/`.

Enumerated app-touched objects (from code search):
- [ ] **Tables:** none currently referenced by client code.
- [ ] **Storage buckets:** none currently referenced by client code.

### B. Required RLS baseline for any user-private table introduced/used

For each user-private table (example owner column `user_id`):

- [ ] RLS is **ON**.
- [ ] `SELECT` policy uses `auth.uid() = user_id`.
- [ ] `INSERT` policy uses `WITH CHECK (auth.uid() = user_id)`.
- [ ] `UPDATE` policy uses:
  - `USING (auth.uid() = user_id)`
  - `WITH CHECK (auth.uid() = user_id)`
- [ ] `DELETE` policy uses `USING (auth.uid() = user_id)`.
- [ ] No permissive catch-all policy (`USING (true)` / `WITH CHECK (true)`) on private tables.

### C. Required Storage policy shape if buckets are used

For each private bucket:

- [ ] Bucket is not publicly readable unless explicitly intended.
- [ ] Policies on `storage.objects` scope by both:
  - target `bucket_id`
  - object path ownership convention (for example first path segment equals `auth.uid()`).
- [ ] Read/write/delete restricted to owner-scoped objects only.

---

## 4) Black-Box Tests (deployed GH Pages + DevTools)

Use two sessions:
- Session A: normal browser profile (User A)
- Session B: incognito/private window (User B)

Run all tests from deployed URL:
- `https://SonnySSSSSSS.github.io/Immanence/`

### A. Setup (both sessions)

1. Create User A and User B via app UI.
2. Confirm each can sign in.
3. In each session DevTools console, initialize a test client:

```js
const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
const supabase = createClient('<PROJECT_URL>', '<ANON_KEY>');
const { data: me } = await supabase.auth.getUser();
console.log('current user id', me?.user?.id);
```

Use project URL/anon key only (no service role key).

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
- read returns zero rows (or permission error)
- update/delete affect zero rows (or permission error)
- forged insert is rejected by `WITH CHECK`

### C. Storage isolation tests (if/when bucket exists)

In Session B:

```js
// Attempt reading A-owned object path
await supabase.storage.from('<BUCKET>').download('<A_OWNER_ID>/private.txt');

// Attempt writing into A-owned path
await supabase.storage.from('<BUCKET>').upload('<A_OWNER_ID>/evil.txt', new Blob(['x']), { upsert: true });
```

Expected secure outcomes:
- read/write denied unless policy allows that exact user/path

### D. Auth redirect tests

1. Trigger signup/signin flows that involve redirects (email confirmation/recovery if enabled).
2. Confirm return URL stays within configured allowlist.
3. Confirm unexpected domain/path redirect attempts are blocked by Supabase.

---

## 5) Launch Gate (PASS/FAIL - non-negotiable)

### PASS only if all are true

- [ ] No service-role/secret key present in source, env shipped to client, or built assets.
- [ ] Every app-used private table has RLS ON.
- [ ] Every app-used private table has strict `auth.uid()`-scoped policies for SELECT/INSERT/UPDATE/DELETE.
- [ ] Any used Storage bucket has owner-scoped policies.
- [ ] Supabase Auth URL Configuration contains only required GH Pages + required local dev URLs.
- [ ] Cross-user black-box attacks are blocked in deployed site tests.

### FAIL (block launch) if any is true

- [ ] Any service-role/secret appears in browser-delivered code/config.
- [ ] Any app-used private table has RLS OFF.
- [ ] Any private-data policy allows broad access (`true` without auth owner checks).
- [ ] Redirect allowlist is missing required URL(s) or includes over-broad/unexpected domains.
- [ ] Cross-user read/write/delete or forged-owner insert succeeds.

// PROBE:SUPABASE_AUDIT:END
