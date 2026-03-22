# Security Checklist — Immanence OS

Based on community best practices for Claude Code-built apps.
Run this checklist before any production deployment.

---

## 1. API Cost Protection

- [ ] **Rate limiting on AI proxy endpoints**
  - `worker/src/index.js` Gemini proxy: ✅ 100 req/hour per IP via Cloudflare KV
  - Verify any internal proxy or worker path has explicit throttling and abuse controls

- [ ] **Internal-only HTTP tools are not broadly exposed**
  - Local or internal tools exposed over HTTP are not open to arbitrary network access
  - Internal-only endpoints are clearly marked and protected

- [ ] **No cost caps or usage tracking on LLM service**
  - `src/services/llmService.js`: No token counting, no budget cap, no per-user quota
  - Fix: Add max token limit per request; track usage in Supabase

---

## 2. Authentication & Sessions

- [ ] **Hardcoded Supabase credentials in source**
  - Ensure `src/lib/supabaseClient.js` reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` through the runtime env helper
  - Keep real values out of tracked source; rotate the key if the repo has ever been public
  - Rotate the key if the repo has ever been public

- [ ] **`.env.local` committed to repo**
  - Verify `.gitignore` includes `.env.local` — if not, remove it from git history
  - Run: `git ls-files .env.local` — if it returns a result, it's tracked

- [ ] **Auth can be disabled via source code**
  - Auth enablement must be env-gated in both `src/lib/supabaseClient.js` and `src/components/auth/AuthGate.jsx`
  - `VITE_ENABLE_AUTH` should accept only `true` / `false` and default to enabled when missing or malformed

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
  - `src/services/llmService.js` should keep system instructions separate from user-provided data
  - Treat user input as bounded data payloads, not appended control instructions

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
  - `worker/src/index.js` should allow only the production GitHub Pages origin and required localhost dev origins
  - No wildcard fallback for active LLM traffic

---

## 8. Operational Readiness

- [ ] **No startup environment variable validation**
  - `src/config/runtimeEnv.js` should fail fast when auth is enabled and `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` is missing
  - `VITE_LLM_PROXY_URL` should fail clearly when LLM features are invoked, not as a global startup blocker

- [ ] **No comprehensive health check endpoint**
  - `src/services/llmService.js` has LLM availability check — ✅ partial
  - Missing: Supabase connectivity check, app version endpoint

- [ ] **Workers, proxies, and internal services validate origin and input where applicable**
  - Confirm request origin rules, schema validation, and method restrictions match the deployed architecture

- [ ] **Console logs in production**
  - Route debug/info logs in sensitive bootstrap/auth/runtime files through a shared log-level gate
  - Preserve warnings and errors needed for troubleshooting

- [ ] **No error tracking (Sentry or equivalent)**
  - Install a minimal dependency-free reporter for unhandled errors and promise rejections at app bootstrap
  - External observability remains optional

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
4. Add startup env validation through `src/config/runtimeEnv.js` and `src/main.jsx`
5. Lock worker origins to the GitHub Pages deployment origin plus required localhost origins

### Do before next deploy

1. Add email + password strength validation in `AuthGate.jsx`
2. Add input length cap on LLM prompt inputs
3. Confirm worker origin allowlist matches the deployed GitHub Pages origin exactly
4. Verify RLS is enabled on all Supabase tables
5. Extend production log gating beyond bootstrap/auth/runtime files if more client surfaces become sensitive

### Do when scaling

1. Add per-user rate limiting on LLM service
2. Add token counting and cost caps
3. Integrate error tracking (Sentry)
4. Add GDPR data export before reset
5. Begin incremental TypeScript migration
