# Security Checklist — Immanence OS

Based on community best practices for Claude Code-built apps.
Run this checklist before any production deployment.

---

## 1. API Cost Protection

- [ ] **Rate limiting on AI proxy endpoints**
  - `vite.config.js` Ollama proxy has no rate limiting — unlimited requests passthrough to `localhost:11434`
  - `worker/src/index.js` Gemini proxy: ✅ 100 req/hour per IP via Cloudflare KV
  - Fix: Add middleware in `tools/ollama-proxy.js` to throttle requests

- [ ] **Open CORS on Ollama proxy**
  - `tools/ollama-proxy.js` lines 11-12: `Access-Control-Allow-Origin: *` — anyone can call it
  - Fix: Restrict to `http://localhost:5173` only

- [ ] **No cost caps or usage tracking on LLM service**
  - `src/services/llmService.js`: No token counting, no budget cap, no per-user quota
  - Fix: Add max token limit per request; track usage in Supabase

---

## 2. Authentication & Sessions

- [ ] **Hardcoded Supabase credentials in source**
  - `src/lib/supabaseClient.js` lines 6-7: URL and anon key hardcoded — they appear in git history
  - Fix: Move to `.env.local` only; reference via `import.meta.env.VITE_SUPABASE_URL`
  - Rotate the key if the repo has ever been public

- [ ] **`.env.local` committed to repo**
  - Verify `.gitignore` includes `.env.local` — if not, remove it from git history
  - Run: `git ls-files .env.local` — if it returns a result, it's tracked

- [ ] **Auth can be disabled via source code**
  - `src/lib/supabaseClient.js` line 5: `const ENABLE_AUTH = true` — this is a code constant, not env-gated
  - Fix: Replace with `const ENABLE_AUTH = import.meta.env.VITE_ENABLE_AUTH !== 'false'`

- [ ] **Session expiry / idle timeout**
  - Supabase handles JWT refresh automatically — ✅ acceptable
  - No idle timeout warning in UI — low risk for personal app, add if multi-user

- [ ] **Token storage**
  - Supabase SDK manages tokens — ✅ no manual localStorage JWT storage

---

## 3. Payment & Webhook Security

- [ ] **No payment webhooks present** — ✅ not applicable
  - If added in future: verify HMAC-SHA256 signature before trusting any webhook payload

---

## 4. Database & Scalability

- [ ] **Row Level Security (RLS) on all Supabase tables**
  - Cannot verify from client code — check Supabase dashboard
  - Every table the anon key can reach must have RLS enabled
  - Test: call Supabase as an unauthed user and confirm data is not returned

- [ ] **No raw SQL in client code** — ✅ all via Supabase SDK

- [ ] **Pagination on data fetches**
  - Review any `.select()` calls in `src/state/` — ensure `.limit()` or `.range()` is used
  - Unbounded fetches will fail at scale

- [ ] **Connection pooling** — ✅ managed by Supabase server-side, not applicable to SPA

- [ ] **LocalStorage data not encrypted**
  - `src/state/offlineFirstUserStateSync.js`: 8 state keys stored in plain localStorage
  - Low risk for personal use; medium risk if device is shared

---

## 5. Input Handling

- [ ] **Weak auth input validation**
  - `src/components/auth/AuthGate.jsx` lines 161-173: only checks for empty fields and name length
  - Missing: email format regex, password strength (min 8 chars), XSS sanitization on display name

- [ ] **Prompt injection in LLM calls**
  - `src/services/llmService.js` lines 208-218: user text interpolated directly into prompt strings
  - Fix: validate and limit input length before passing to LLM; consider structured data format

- [ ] **XSS in markdown rendering**
  - `react-markdown` is installed — verify `rehype-sanitize` is also in use wherever user content renders

- [ ] **No SQL injection risk** — ✅ no raw SQL; Supabase SDK parameterizes all queries

---

## 6. API Keys & Secrets in Client Code

- [ ] **Supabase key hardcoded** — see section 2 above

- [ ] **Gemini API key** — ✅ stored in Cloudflare secret, never in source

- [ ] **No other API keys in client-side bundle**
  - Run: `grep -r "sk-\|api_key\|apiKey\|secret" src/ --include="*.js" --include="*.jsx"`
  - Anything found that isn't an env var reference is a vulnerability

- [ ] **`.env.local` in `.gitignore`**
  - Verify: `cat .gitignore | grep .env`

---

## 7. Access Control

- [ ] **Dev panel gated in production**
  - `src/dev/uiDevtoolsGate.js`: dual gate (query flag + localStorage) — acceptable for personal use
  - Risk: localStorage flag is user-settable via browser console
  - Stricter fix: strip dev panel from production bundle entirely using build env flag

- [ ] **No role-based access control needed** — ✅ all users are equal; not applicable currently

- [ ] **CORS too permissive on Worker**
  - `worker/src/index.js` line 21: `Access-Control-Allow-Origin: *`
  - Fix: change to your GitHub Pages domain: `https://<username>.github.io`

---

## 8. Operational Readiness

- [ ] **No startup environment variable validation**
  - App will fail silently if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing
  - Fix: add validation block to `src/main.jsx` before rendering:
    ```js
    const required = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
    const missing = required.filter(k => !import.meta.env[k]);
    if (missing.length) throw new Error(`Missing env vars: ${missing.join(', ')}`);
    ```

- [ ] **No comprehensive health check endpoint**
  - `src/services/llmService.js` has LLM availability check — ✅ partial
  - Missing: Supabase connectivity check, app version endpoint

- [ ] **Console logs in production**
  - `console.log` calls are widespread across `src/` — these appear in browser DevTools for all users
  - Fix: set `vite.config.js` `build.minify` + `drop_console: true`, or use a log level gate

- [ ] **No error tracking (Sentry or equivalent)**
  - Silent failures in production are invisible
  - Recommendation: add Sentry with `import.meta.env.PROD` guard

- [ ] **No data export / backup for user data**
  - `src/lib/resetLocalData.js` can wipe data with no export step
  - Fix: prompt user to download JSON export before wiping

- [ ] **Git history and private repo**
  - Ensure repo is private if it contains any credentials in history
  - Recommendation: commit after every major build

---

## 9. TypeScript

- [ ] **No TypeScript — full JavaScript codebase**
  - No compile-time type checking on any path including AI-generated code
  - Property typos and wrong shapes fail silently at runtime
  - Recommendation: migrate critical paths (`src/state/`, `src/services/`, `src/lib/`) to `.ts` / `.tsx` incrementally

---

## 10. CORS

- [ ] **Ollama proxy CORS open** — see section 1

- [ ] **Worker CORS open** — see section 7

- [ ] **Supabase CORS**
  - Verify in Supabase dashboard → Settings → API → Allowed Origins
  - Should list only your actual deployment domain(s)

---

## Priority Order

### Do immediately
1. Rotate Supabase anon key (it's in git history)
2. Remove hardcoded credentials — use `.env.local` exclusively
3. Confirm `.env.local` is in `.gitignore` and untracked
4. Lock Ollama proxy CORS to localhost only
5. Add startup env var validation to `src/main.jsx`

### Do before next deploy
6. Add email + password strength validation in `AuthGate.jsx`
7. Add input length cap on LLM prompt inputs
8. Lock Worker CORS to your GitHub Pages domain
9. Verify RLS is enabled on all Supabase tables
10. Remove / gate console logs from production build

### Do when scaling
11. Add per-user rate limiting on LLM service
12. Add token counting and cost caps
13. Integrate error tracking (Sentry)
14. Add GDPR data export before reset
15. Begin incremental TypeScript migration
