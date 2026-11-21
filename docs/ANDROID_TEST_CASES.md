# Native Android and API test suite — execution worksheet

Use case IDs consistently in bug reports, Android tests, Postman and the Supabase QA reporting portal. Each run must include a real test execution timestamp, build, Android version, emulator/device model, OS locale, evidence and actual result. **Do not mark a case passed solely because source code or a test exists.**

| Case ID | Area | Preconditions | Steps | Expected result | Severity if broken |
|---|---|---|---|---|---|
| NAT-001 | Payment approval | online, auth valid, active demo card | Launch app, enter 10.01, tap mock payment | APPROVED, exactly 1 transaction, 20¢ cash back | P1 |
| NAT-002 | Idempotency | NAT-001 succeeds | Tap Retry last request twice | Transaction count stays 1; no extra cash back | P0 |
| NAT-003 | Offline | online switch OFF | Tap payment | OFFLINE; no new charge | P1 |
| NAT-004 | Auth | auth valid switch OFF | Tap payment | AUTH_EXPIRED; no new charge | P1 |
| NAT-005 | Card | card active switch OFF | Tap payment | CARD_LOCKED; no new charge | P1 |
| NAT-006 | Amount boundaries | all gates valid | Enter 0, -1, 1.999, 100000.01, 19.99 | Invalid inputs decline; 19.99 approves | P1 |
| NAT-007 | Rewards | grocery ON | Pay 19.99 | 100¢ reward (5%, half-up rounding) | P1 |
| NAT-008 | Refund | a valid transaction exists | Refund once; try again | Award reversed once; retry cannot reverse twice | P1 |
| NAT-009 | Fault injection | fault switch ON | Pay, tap Retry | 2 charges for same request: reproducible intentional BUG-01 | P0 simulated |
| NAT-010 | Logcat | debug build launched | Clear logcat, pay, retry, expire auth | Sanitized WalletQaLab tag events and consistent request ID | P2 |
| NAT-011 | Device matrix | 2 emulator profiles available | Run NAT-001–008 on each Android API level | No unexpected behavior changes | P2 |
| NAT-012 | Accessibility | TalkBack enabled | Navigate buttons/switches | Meaningful labels and usable controls | P2 |
| API-001–009 | API contract | `npm run dev:api` running | Run `npm test` or Postman collection | Correct HTTP code, response code, ledger state | P1 |

## Example defect report (simulated, not a real Samsung Wallet defect)

**ID:** BUG-ANDROID-001 · **Title:** Same request ID creates two synthetic charges when injected bug is enabled · **Severity:** P0-equivalent *in a real payments system* · **Environment:** Android Emulator / App build 1.0 / API 35 / online.

**Repro:** 1) Reset app (force stop + clear app data for demo), 2) Enable duplicate-charge fault, 3) Pay $10.01, 4) Retry the same request.

**Expected:** One ledger entry, single reward posting, repeated request returns cached approval.

**Actual:** Two ledger entries under the same request ID (intentional training defect).

**Likely cause:** Injected mode skips the request-ID deduplication check in `WalletEngine`.

**Suggested regression:** NAT-002 must pass when fault switch OFF; NAT-009 reproduces with switch ON. Capture sanitized Logcat output and screenshots; ensure no real personal or payment data is present.

## Real device compatibility checklist

For a personally owned compatible Galaxy device and authorized QA scope, separately record:

- Galaxy model, One UI/Android version, Samsung Wallet version, regional availability, device lock/unlock state.
- Wi-Fi vs cellular vs airplane mode, interrupted network transitions, locale, text scaling and accessibility.
- The **real Samsung Wallet app's supported UI flows only**; actual payment or card provisioning acceptance requires Samsung-approved test cards and partner testing access. Never confuse lab results with production Samsung compatibility qualification.
