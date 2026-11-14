# Codex instructions — Wallet QA Lab

Scope: repository root of the standalone `samsung-wallet-qa-lab` project. Build and test an independent educational wallet QA simulator. Never request, include, commit or test real PAN/card numbers, CVCs, OTPs, biometric data, payment tokens, private keys or Samsung partner credentials.

## Before you edit
1. Read `README.md`, `docs/TEST_PLAN.md`, `src/domain.ts`, and the latest passing tests.
2. Preserve functional requirements: no real payments, request idempotency, integer-cent reward calculations, refund reversal, safe declines and sanitized logs.
3. Use a feature branch and PR; document changed behavior and evidence in PR description.
4. Add regression tests to cover any bug you fix. Avoid fragile timing-based UI automation.

## Check commands
```bash
npm install
npm test
npx playwright install chromium
npm run test:e2e
```

## Safe follow-up Codex tasks
- Add Playwright E2E coverage of refund/reward reversal and mobile viewport accessibility. Report failing tests and repairs.
- Add API contract tests with a synthetic local endpoint, status codes, timeouts, retries and correlation IDs; no real payment API.
- Improve the native Kotlin simulator with a deterministic ViewModel and Compose UI tests for network/auth state, maintaining testability.
- Implement Supabase authenticated QA run storage against a **new sandbox project** with RLS checks and test fixtures. Never use service_role in frontend.
