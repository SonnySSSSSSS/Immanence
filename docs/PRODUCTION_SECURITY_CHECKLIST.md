# PRODUCTION SECURITY AND READINESS CHECKLIST

## Purpose

This document defines the minimum security, abuse-resistance, configuration, and production-readiness standards required before any application is considered ready for deployment. It is intended to be used as a standing repository rule and release gate for all projects.

## Usage

- Evaluate every item as `PASS`, `FAIL`, `N/A`, or `DEFERRED`.
- For every non-`N/A` item, record:
  - `Status`
  - `Evidence`
  - `Owner`
  - `Fix Path`
  - `Severity`
- Treat all `Critical` and `High` failures as release blockers unless explicitly waived.
- Where a project does not use a given subsystem, mark the item `N/A`.
- This checklist applies to both AI-assisted and manually written code.

---

# 1. Secrets and Configuration

## 1.1 Secret Handling

- No API keys, database credentials, access tokens, webhook secrets, or private service credentials are hardcoded in client-side or server-side source files.
- No secrets are committed to the repository.
- If a secret was ever committed, it is treated as compromised and rotated.
- Secret-bearing local files are excluded from version control.
- Development, staging, and production use separate credentials where applicable.

## 1.2 Environment Validation

- All required environment variables are validated at startup.
- Missing or malformed environment variables cause clear startup failure, not silent misconfiguration.
- Public and private environment variables are clearly separated by intended exposure.
- Production configuration values are documented in a template file such as `.env.example` without real secrets.

## 1.3 Configuration Safety

- Security-sensitive behavior is controlled by environment or deployment configuration, not by source constants that require code edits.
- Production-safe defaults are used when configuration is absent.
- Feature flags affecting authentication, authorization, billing, or admin access default to secure behavior.

---

# 2. Authentication and Session Security

## 2.1 Authentication Controls

- Authentication is enabled by configuration, not by editing source code constants.
- Authentication flows do not expose secrets or privileged data in client-visible code.
- Login, logout, password reset, and magic-link flows behave as intended in production.

## 2.2 Session Management

- Session expiration exists and is appropriate for the application risk level.
- Session renewal, refresh, and revocation behavior are defined.
- Stolen session tokens do not grant indefinite access.
- Logout clears or invalidates relevant session state.

## 2.3 Token Storage

- Sensitive tokens are not stored in insecure browser storage unless there is a documented reason and compensating controls.
- Tokens are not exposed unnecessarily to JavaScript when safer storage mechanisms exist.
- Session handling is delegated to trusted platform or SDK behavior when appropriate rather than reimplemented unsafely.

---

# 3. Authorization and Access Control

## 3.1 Role and Permission Checks

- Privileged routes and actions verify role or permission, not just authentication state.
- Admin-only functions cannot be accessed by standard users.
- Authorization checks occur on the trusted execution side for sensitive actions.

## 3.2 Object-Level Access Control

- Users cannot read, modify, or delete other users' data by changing identifiers, request payloads, or route parameters.
- Multi-tenant boundaries are enforced explicitly.
- Ownership and role checks are centralized where practical.

## 3.3 Default Security Posture

- Access defaults to deny unless explicitly allowed.
- Test accounts, seeded users, or development backdoors are not present in production.

---

# 4. API and Abuse Protection

## 4.1 Rate Limiting

- Public and expensive routes have rate limiting.
- LLM, inference, search, image generation, and other cost-driving endpoints have abuse protection.
- Internal or local-only HTTP services are not exposed to arbitrary network access.

## 4.2 Request Protection

- Request size limits exist where relevant.
- Replay-sensitive endpoints implement idempotency, nonce validation, or equivalent protections where appropriate.
- Sensitive endpoints reject malformed or unexpected payloads.

## 4.3 Webhook Security

- Payment, subscription, and third-party webhook endpoints verify signatures.
- Webhook handlers do not trust unsigned or unverifiable events.
- Replay handling exists where applicable.

---

# 5. Input Handling and Output Safety

## 5.1 Input Validation

- User input is validated before persistence or privileged execution.
- Untrusted input is constrained by schema, type, and expected shape where appropriate.
- Dangerous input paths are explicitly reviewed.

## 5.2 Database Safety

- Database access uses parameterized queries, ORM protections, or equivalent safe query construction.
- Raw query execution is reviewed carefully and protected against injection.

## 5.3 Rendered Content Safety

- HTML, Markdown, rich text, and user-generated content are sanitized before rendering where relevant.
- Unsafe rendering methods are minimized and reviewed.

## 5.4 File and Media Uploads

- File uploads validate type, size, and allowed formats.
- Uploaded files are stored and served safely.
- Executable or unsafe file handling paths are blocked where applicable.

## 5.5 LLM Prompt and Output Safety

- System instructions and user-provided content are separated clearly in prompt construction.
- User input is treated as data, not merged blindly into control instructions.
- Model outputs are validated before being used for privileged or state-changing actions.
- Prompt injection risk is considered for all LLM-integrated workflows.

---

# 6. Browser and Frontend Security

## 6.1 Client Exposure

- No secret or privileged server logic is relied upon in client-visible code.
- Sensitive operations are not protected solely by frontend checks.

## 6.2 Origin and Cross-Origin Controls

- CORS is restricted to explicit allowed origins.
- Wildcard CORS is not used on sensitive endpoints, workers, proxies, or internal services.
- Cross-origin settings are reviewed for both development and production.

## 6.3 Frontend Safety Controls

- Debug output is gated in production.
- User-facing errors do not expose stack traces, secrets, or internal implementation details.
- Security headers or equivalent browser protections are considered where applicable.
- Content Security Policy is considered for production web applications.

---

# 7. Data Protection and Privacy

## 7.1 Data Minimization

- Only necessary user data is collected and stored.
- Sensitive data is classified and handled according to its risk.

## 7.2 Transport and Storage Protection

- Sensitive data is encrypted in transit.
- Sensitive stored data is protected appropriately for the stack and threat level.

## 7.3 Logging Hygiene

- Logs do not contain secrets, tokens, raw credentials, or unnecessary sensitive personal data.
- Diagnostic logging is reviewed for leakage risk.

## 7.4 Backup and Recovery

- Backup strategy exists for persistent data.
- Restore procedure is defined and tested where persistent data matters.
- Destructive migrations or data operations are recoverable.

---

# 8. Reliability and Production Visibility

## 8.1 Logging and Observability

- Production logging exists and is sufficient for incident diagnosis.
- Application failures can be observed without relying solely on user reports.

## 8.2 Error Capture

- Unhandled runtime errors are captured through a structured reporting path.
- Startup failures are explicit and diagnosable.
- Critical background failures are surfaced appropriately.

## 8.3 Health and Availability

- Health checks, uptime visibility, or equivalent operational signals exist where relevant.
- Third-party dependency failure modes are understood.
- Degraded-mode behavior is defined where reasonable.

---

# 9. Dependencies and Supply Chain

## 9.1 Dependency Review

- Dependencies are reviewed for necessity and trustworthiness.
- Abandoned, high-risk, or unnecessary packages are avoided where practical.
- Lockfiles are committed.

## 9.2 Build and Deployment Safety

- Build and deployment systems do not leak secrets.
- Generated artifacts do not accidentally include confidential values.
- CI/CD configuration follows least-privilege access where possible.

## 9.3 AI-Generated Code Review

- AI-generated code is reviewed before release.
- Code produced confidently by AI is not assumed correct without verification.
- Type, schema, or contract checking is used where appropriate to reduce silent shape errors.

---

# 10. Scalability and Structural Safety

## 10.1 Data Access Patterns

- Database indexes exist for common production query paths where needed.
- Large collections use pagination, batching, or bounded queries.
- Full-table fetches are avoided on unbounded production datasets.

## 10.2 Resource Management

- Connection pooling or equivalent controls are used where the stack requires them.
- Expensive background jobs are bounded and observable.
- Memory and request growth paths are reviewed for abuse or failure risk.

## 10.3 Traffic Readiness

- Basic traffic spikes do not immediately exhaust database, worker, or API resources.
- Expensive routes have both functional and operational guardrails.

---

# 11. Payments and Financial Integrity

## 11.1 Purchase Trust Boundaries

- Successful purchase state is not granted solely from client assertions.
- Payment completion is verified through trusted backend or webhook flows.

## 11.2 Subscription and Entitlement Safety

- Entitlements, subscription status, and premium access checks are validated on the trusted side.
- Refund, cancellation, and failed payment states are handled safely.

---

# 12. Local Tools, Workers, and Internal Services

## 12.1 Internal Exposure

- Internal-only endpoints, proxies, workers, and services are clearly identified and protected.
- Development utilities cannot be abused in production contexts.
- Internal services validate origin and input where applicable.

## 12.2 Worker Safety

- Workers validate origin and input where applicable.
- Workers do not expose secrets in responses or logs.
- Worker retries, backoff, and abuse surfaces are reviewed where relevant.

---

# 13. Release Gate

## 13.1 Required Release Conditions

- No unresolved `Critical` security failures.
- No unresolved `High` security failures unless explicitly waived with owner and timeline.
- Secrets audit completed.
- Authentication and authorization audit completed.
- Origin and CORS audit completed.
- Abuse and rate-limiting audit completed.
- Logging and error visibility audit completed.
- Backup and recovery audit completed if persistent data exists.
- Manual privileged-user test completed.
- Manual malicious-user test completed for key trust boundaries.
- Production configuration review completed.

## 13.2 Waiver Rules

- Any waived item must include:
  - explicit reason
  - owner
  - risk statement
  - mitigation
  - target fix date

---

# 14. Severity Levels

## Critical

Direct compromise of money, secrets, admin power, user account integrity, or unrestricted cost exposure.

## High

Serious exposure likely to lead to compromise, abuse, or production-impacting incidents under realistic conditions.

## Medium

Meaningful weakness that increases risk, fragility, or exploitability but is not an immediate severe compromise by itself.

## Low

Non-blocking weakness, hygiene issue, or defense-in-depth improvement.

---

# 15. Audit Record Template

## Item

[Checklist item name]

## Status

PASS | FAIL | N/A | DEFERRED

## Severity

Critical | High | Medium | Low

## Evidence

[Concrete proof, file path, test result, screenshot reference, or code reference]

## Owner

[Person or team responsible]

## Fix Path

[Exact file, service, or action required]

## Notes

[Optional]

---

# 16. Project-Specific Appendix

Add project-specific sections below this line for stack-specific requirements such as:

- Supabase or Firebase rules
- Cloudflare worker controls
- Payment provider requirements
- Mobile secure storage requirements
- Object storage policy requirements
- Admin dashboard constraints
- AI model cost controls
- Privacy or regulatory obligations

---

# 17. Standing Rule

No application is considered production-ready solely because it builds, runs locally, or passes a happy-path demo. Release readiness requires explicit review against this checklist and documented evidence for each applicable item.
