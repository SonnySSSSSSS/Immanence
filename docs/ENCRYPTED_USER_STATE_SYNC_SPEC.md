# Encrypted User State Sync Spec

Date: 2026-04-09  
Status: Drafted, critiqued, revised (this document)  
Scope owner: Auth and sync boundary (`offlineFirstUserStateSync`)

## Execution Task Spec (For This Doc Change)

- Goal: Define an implementation-ready spec for encrypting synced user state, critique it, revise it, and align canonical docs.
- Files to modify (ALLOWLIST):
  - `docs/ENCRYPTED_USER_STATE_SYNC_SPEC.md`
  - `ARCHITECTURE.md`
  - `SECURITY_CHECKLIST.md`
  - `docs/DOCS_INDEX.md`
- Files NOT to modify (DENYLIST):
  - `src/**`
  - `worker/**`
  - `.claude-worktrees/**`
- Constraints:
  - Single-purpose change: documentation and spec only.
  - No runtime code changes in this task.
  - Keep compatibility with existing local-first architecture.
- No sequencing rule: No sequencing; perform only the listed atomic change.
- Verification:
  - `rg -n "Encrypted User State Sync Spec|progress_bundle_v2_enc|offline-first cloud sync payload encryption" docs ARCHITECTURE.md SECURITY_CHECKLIST.md`
  - Confirm `docs/DOCS_INDEX.md` references this file.
- Screenshot signal: N/A (non-visual work).
- Stop gate: Stop if architecture/security claims cannot be proven from current repo state.
- Commit message: `docs(security): add encrypted user-state sync spec and align architecture checklist docs`

## Part 1: Draft Spec (V0)

## Goal

Protect synced user state in Supabase `user_documents` so server-side operators and leaked table exports cannot read journal/progress plaintext.

## Hypothesis

If sync payloads are encrypted client-side before `.upsert()` and decrypted only client-side after `.select()`, user privacy improves without breaking offline-first conflict behavior.

## Functional Requirements

1. Keep existing offline-first allowlist and bundle hashing semantics.
2. Encrypt bundle payload before remote upsert.
3. Decrypt payload after remote pull before apply.
4. Preserve current local-first behavior when network/auth is unavailable.
5. Keep one account’s payload isolated from another under existing RLS.

## Crypto Draft (V0)

- Algorithm: `AES-GCM` 256-bit.
- Key derivation: `PBKDF2-SHA-256` from user passphrase.
- Envelope fields (remote `doc`):
  - `schema: "progress_bundle_v2_enc"`
  - `kdf: { name, iterations, saltB64 }`
  - `cipher: { alg, ivB64, ciphertextB64 }`
  - `capturedAt`
  - `bundleHash` (hash of decrypted canonical bundle shape)
- Storage key plan:
  - Keep current local state keys unchanged.
  - Add passphrase latch metadata key per user in local storage (no plaintext key storage).

## Implementation Draft (V0)

1. Add crypto helper module for derive/encrypt/decrypt.
2. Update capture/push path to encrypt before `.upsert()`.
3. Update pull/apply path to decrypt after `.select('doc')`.
4. Add migration logic:
  - Read `progress_bundle_v2_enc` first.
  - Fallback to plaintext `progress_bundle_v1`.
  - Re-write as encrypted on next successful push.
5. Add test coverage for:
  - encrypt/decrypt round-trip
  - cross-user inability to decrypt with wrong passphrase
  - migration from v1 plaintext to v2 encrypted.

## Part 2: Critique Of V0

1. Key management is underspecified.
- V0 says passphrase-derived key but does not define passphrase lifecycle, reset, or re-wrap behavior.

2. Recovery UX is missing.
- No explicit behavior for forgotten passphrase, incorrect passphrase retries, or lockout handling.

3. Performance constraints are missing.
- PBKDF2 cost and mobile budget are not defined; this can regress startup and periodic sync ticks.

4. Logging boundary is incomplete.
- Spec does not explicitly forbid plaintext payloads in diagnostics/probes.

5. Migration safety is incomplete.
- V0 lacks explicit rollback and dual-read sunset timeline.

6. Scope creep risk.
- V0 could be interpreted as full localStorage-at-rest encryption, which is not required for this phase.

## Part 3: Revised Spec (V1)

## Single-Sentence Failing Behavior

Current sync writes plaintext allowlisted user-state bundle content to remote storage, exposing sensitive behavioral/journal data if DB access is compromised.

## Runtime Source Of Truth

- Local canonical state: allowlisted keys in `OFFLINE_FIRST_USER_STATE_KEYS`.
- Remote canonical sync row: `user_documents` keyed by `(user_id, doc_key)`.

## Correction Boundary

Persistence boundary only: transform at sync serialization/deserialization (`capture -> upsert`, `select -> apply`), without redefining store ownership.

## In Scope (V1)

1. Client-side encryption for remote sync payloads only.
2. Dual-read migration path from plaintext `progress_bundle_v1` to encrypted `progress_bundle_v2_enc`.
3. Strict no-plaintext logging at sync boundary.
4. Passphrase-based key derivation with explicit UX and error states.

## Out Of Scope (V1)

1. Full localStorage encryption at rest.
2. Supabase table redesign beyond adding a new `doc_key` variant.
3. Multi-tenant key escrow or server-side decryption features.

## Revised Technical Design

### Envelope

- New `doc_key`: `progress_bundle_v2_enc`.
- Remote `doc` shape:
  - `schema: "progress_bundle_v2_enc"`
  - `capturedAt: ISO-8601`
  - `bundleHash: string`
  - `crypto`:
    - `alg: "AES-GCM-256"`
    - `kdf: "PBKDF2-SHA-256"`
    - `iterations: number`
    - `saltB64: string`
    - `ivB64: string`
  - `ciphertextB64: string` (encrypted canonical plaintext bundle JSON)

### Key Model

- User provides sync passphrase during first encrypted-sync setup.
- Key is derived in-browser with PBKDF2 and held in memory only.
- No plaintext passphrase persisted.
- Optional short-lived session unlock marker may be persisted without key material.

### Sync Behavior

1. Push:
- Capture allowlisted bundle.
- Canonical stringify -> encrypt -> upsert encrypted envelope under `progress_bundle_v2_enc`.
- Keep outbox idempotency behavior unchanged (hash-based dedup remains on plaintext canonical hash).

2. Pull:
- Prefer encrypted doc key.
- If present: decrypt, validate schema/hash, apply bundle.
- If missing and plaintext v1 exists: read once, apply, enqueue encrypted rewrite.

3. Failure modes:
- Wrong passphrase: skip remote apply, preserve local-only mode, emit sanitized diagnostic code.
- Crypto error: do not wipe local; keep sync paused and visible in debug diagnostics.

### Logging Rules

- Never log decrypted bundle or ciphertext.
- Logs may include only:
  - hashed IDs
  - schema version
  - success/failure category
  - timing metrics

## Security And Privacy Requirements

1. RLS remains mandatory for `user_documents`; encryption supplements, not replaces, authorization.
2. Production logs must never include raw email or raw bundle payload.
3. Encryption settings and schema versions must be auditable in docs and tests.

## Verification Plan

1. Unit tests:
- deterministic bundle canonicalization hash stability
- encrypt/decrypt round-trip
- wrong-passphrase decrypt failure path

2. Integration tests (smoke/auth):
- authenticated user can upsert/pull `progress_bundle_v2_enc`
- signed-out user gets no readable rows
- cross-user row access denied by RLS

3. Migration tests:
- existing `progress_bundle_v1` user migrates to `progress_bundle_v2_enc`
- fallback disabled after sunset window

4. Manual checks:
- confirm browser console does not print plaintext bundle or full email in sync probes
- confirm local-only mode continues when crypto setup is incomplete

## Implementation File Plan (When Building V1)

- Primary:
  - `src/state/offlineFirstUserStateSync.js`
  - `src/state/offlineFirstUserStateSnapshot.js`
  - `src/lib/supabaseClient.js` (if option/config plumbing is needed)
  - `src/App.jsx` (remove plaintext email from probes)
- New helper:
  - `src/lib/userStateCrypto.js` (or equivalent)
- Supporting:
  - `src/components/auth/AuthGate.jsx` (passphrase/setup UX if hosted here)
  - `tests/smoke/critical-flows.spec.ts`
  - unit tests for crypto helper and migration

## Release Gate

Do not declare encryption complete until:

1. `progress_bundle_v2_enc` is the default read/write path.
2. `progress_bundle_v1` fallback is removed or explicitly sunset-gated.
3. Security checklist items for sync encryption and plaintext log suppression are checked off.
