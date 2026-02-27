GATE_B_AUTH_BLACKBOX_RUNBOOK_V1
// PROBE:AUTH_BLACKBOX:START

# Gate B Auth Black-Box Runbook

## Target URL

- `https://SonnySSSSSSS.github.io/Immanence/`

## Preconditions Checklist

- [ ] Run only on deployed production URL above (not localhost).
- [ ] Gate A probe banner is visible: `AUTH ENABLED: TRUE (PROBE)`.
- [ ] Two fresh contexts are prepared:
  - [ ] Context A: normal browser profile
  - [ ] Context B: incognito/private window or different browser
- [ ] Two unused email addresses are available for signup tests.
- [ ] If email confirm/reset is enabled, inbox access is available.

## Two-Context Procedure

### Context A (normal profile)

1. Open deployed URL.
2. Confirm banner is visible.
3. Sign up User A with a new email + password.
4. If confirmation required, complete email confirmation first.
5. Sign in as User A.
6. Capture successful logged-in screenshot.
7. Sign out.
8. Refresh page.
9. Verify auth screen is shown again (session cleared).
10. Sign in again as User A.
11. Capture second successful logged-in screenshot.

### Context B (incognito/different browser)

1. Open deployed URL in fresh context.
2. Confirm banner is visible.
3. Sign up User B with a different new email + password.
4. If confirmation required, complete email confirmation first.
5. Sign in as User B.
6. Capture successful logged-in screenshot.
7. Sign out.
8. Refresh page and verify auth screen is shown.

## Email-Dependent Flows (Run Only If Enabled in Supabase)

### Email Confirmation Flow

1. Trigger signup requiring confirmation.
2. Open confirmation email link.
3. Verify landing URL origin/path is correct:
   - Origin: `https://SonnySSSSSSS.github.io`
   - App path: `/Immanence/` (or expected in-app route)
4. Verify account becomes usable for sign-in.
5. Capture screenshots of landing page and successful post-confirm sign-in.

### Password Reset Flow

1. Trigger password reset from deployed app.
2. Open reset email link.
3. Verify landing URL origin/path is correct (same origin/path rules above).
4. Set a new password successfully.
5. Sign in with new password.
6. Capture screenshots of reset completion and successful post-reset sign-in.

## Evidence Checklist

Required screenshots (minimum set):

- [ ] `GATEB_01_probe_auth_screen_A.png` (Context A auth screen with probe)
- [ ] `GATEB_02_userA_logged_in_1.png` (Context A first successful login)
- [ ] `GATEB_03_userA_signed_out_auth_screen.png` (Context A after sign-out + refresh)
- [ ] `GATEB_04_userA_logged_in_2.png` (Context A second login)
- [ ] `GATEB_05_probe_auth_screen_B.png` (Context B auth screen with probe)
- [ ] `GATEB_06_userB_logged_in.png` (Context B successful login)
- [ ] `GATEB_07_userB_signed_out_auth_screen.png` (Context B after sign-out + refresh)

If email confirmation is enabled:

- [ ] `GATEB_08_email_confirm_link_landing.png`
- [ ] `GATEB_09_email_confirm_success_signin.png`

If password reset is enabled:

- [ ] `GATEB_10_reset_link_landing.png`
- [ ] `GATEB_11_reset_success.png`
- [ ] `GATEB_12_post_reset_signin_success.png`

## Error Capture Protocol

If any step fails:

1. Keep the failing screen visible and capture screenshot.
2. Open browser DevTools Console and capture screenshot with error visible.
3. Note timestamp (local time) and user/context (A or B).
4. In Supabase Dashboard, capture Auth logs screenshots:
   - Authentication -> Logs (or Auth event logs page)
   - Include entries matching failure timestamp (signup/signin/confirm/recovery/callback errors).

Console errors to capture explicitly (examples):

- Redirect mismatch errors (`redirect_uri mismatch`, `invalid redirect`, wrong origin/path)
- PKCE/code exchange errors
- Token/session errors
- Repeated auth loop or uncaught runtime exceptions

## PASS/FAIL Rubric

| Step | Expected | Evidence Filename | Pass/Fail |
|---|---|---|---|
| Gate A presence | Probe banner visible on auth screen | `GATEB_01_probe_auth_screen_A.png` |  |
| Context A signup/signin | User A can sign up and reach logged-in UI | `GATEB_02_userA_logged_in_1.png` |  |
| Context A signout clear | Sign-out returns to auth state; refresh stays signed out | `GATEB_03_userA_signed_out_auth_screen.png` |  |
| Context A re-login | User A can sign in again after sign-out | `GATEB_04_userA_logged_in_2.png` |  |
| Context B signup/signin | User B can sign up and reach logged-in UI in fresh context | `GATEB_06_userB_logged_in.png` |  |
| Context B signout clear | Sign-out clears session in second context | `GATEB_07_userB_signed_out_auth_screen.png` |  |
| Email confirmation (if enabled) | Link lands on correct origin/path and account is confirmed | `GATEB_08_email_confirm_link_landing.png`, `GATEB_09_email_confirm_success_signin.png` |  |
| Password reset (if enabled) | Reset link works, password updates, new sign-in succeeds | `GATEB_10_reset_link_landing.png`, `GATEB_11_reset_success.png`, `GATEB_12_post_reset_signin_success.png` |  |
| No blocking auth errors | No persistent redirect/session/runtime blockers | Console + Auth log screenshots |  |

## Non-Negotiable Guardrail

Do not proceed to any RLS/security isolation claims until the app actually touches at least one per-user table or Storage path. Auth account success alone is not evidence of per-user data isolation.

// PROBE:AUTH_BLACKBOX:END
