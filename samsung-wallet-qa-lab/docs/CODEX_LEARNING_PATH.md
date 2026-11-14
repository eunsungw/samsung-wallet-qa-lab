# Codex task-by-task engineering and QA learning path

Start a new Codex session with the NEW `samsung-wallet-qa-lab` GitHub repository. Read `AGENTS.md` and `docs/TEST_PLAN.md`. Work on feature branches, one focused task at a time, and provide a pull request with reproducible test evidence.

## Phase 1: Payments and device environment
**Codex prompt:** "Inspect src/domain.ts and tests/domain.test.mjs. Explain idempotency, cashback rounding and refund invariants. Add two new unit tests for declined transactions and refund retries without touching the existing correct behavior. Run npm test."

## Phase 2: Browser automation
**Codex prompt:** "Create robust Playwright tests for offline decline, duplicate charge fault injection, refund reward reversal, and one mobile viewport. Capture trace on retry; do not use brittle sleep-based waits. Run npm run test:e2e."

## Phase 3: Android and ADB
**Codex prompt:** "Inspect android/ for Kotlin Compose app. Make the Android Gradle project buildable with pinned supported versions and wrapper, add instrumentation tests for expired session and offline decline, and document reproducible adb/logcat evidence. Do not claim tests ran unless the Android SDK and emulator were present."

## Phase 4: API testing and backend
**Codex prompt:** "Review cloud.html, src/cloud.ts and supabase/schema.sql. Test owner-scoped Supabase RLS with two synthetic accounts using a separate sandbox, add API contract tests for valid, expired and missing JWT, and test records cannot be accessed across users. Never expose service-role secrets in the frontend."

## Phase 5: Mobile field testing
**Codex prompt:** "Create a device matrix checklist for Galaxy phone models, Android and One UI versions, Wi-Fi/5G/offline, foreground/background, rotation, accessibility and connection dropouts. Provide reproducible steps for Appium + UiAutomator2 against our own demo app, not Samsung Wallet."

## Phase 6: Portfolio and interview
**Codex prompt:** "Use captured evidence to produce an anonymized test execution report, high-severity duplicate-charge bug report, reproduction matrix, root cause analysis and regression report. Label simulated findings clearly. Explain the distinction between QA of our demo and proprietary Samsung Wallet test work."

## Important caveats
- Appium on Android Chrome is mobile-browser automation, NOT native Samsung Wallet testing.
- Playwright mobile emulation does not prove real Galaxy hardware compatibility.
- Real NFC and tokenized payment qualification needs approved test access, hardware and payment-network test systems.
