# QA test plan — Wallet QA Lab

## Scope and limitations
This is a synthetic wallet app, *not* the Samsung Wallet application, SDK, payment processor, partner portal, or a NFC payment terminal. No real cards, payment tokens, authentication factors, or funds exist. Device profiles in the web app simulate business rules, not hardware or firmware. Real device testing uses only the browser-demo or the separate native Kotlin app you control.

## Definition of done for each test
1. Record test ID, objective and preconditions.
2. Capture device model, Android version, app/build version, network and locale.
3. Execute precise reproducible steps with synthetic data.
4. Compare expected with actual response; assert **no transaction on decline**.
5. For failures record reproducibility, severity, timestamp, trace/request ID, sanitized logs, screenshot/video.
6. After a fix, rerun the original test plus relevant adjacent tests and report pass/fail.

## Minimum coverage matrix
| Category | Happy path | Negative / edge path | Evidence |
| --- | --- | --- | --- |
| Card enrollment (theoretical) | Compatible card added | Unsupported issuer, duplicate, expired card | screenshots + API result |
| Card status | Active test card succeeds | Locked/expired cannot pay | result + log |
| Payments | Authorized $10.01 | zero, negative, invalid precision, 100000.01 | trace + history |
| Idempotency | One request = one charge | Double tap and retry under latency | number of transactions |
| Auth | Session valid | Expired session / canceled biometrics (native extension) | code + log |
| Connectivity | Wi-Fi, cellular | Offline, loss of network, retry | error + recovery |
| Device compatibility | Named Galaxy profiles | Unsupported OS / region / feature flag | device matrix |
| Cash Back | 2% / 5% demo rules | Rounding and ineligible transaction | ledger calculations |
| Refund | Completed payment reversed | Double refund, nonexistent transaction | ledger before/after |
| Security | Display only synthetic last four digits | Logging PAN/OTP/secret, replay, broken auth | redacted trace |
| Accessibility | Proper labels/tap targets | Zoom, screen reader, keyboard navigation | screenshots + notes |
| Localization | en-US format | Korean layout/strings, locale/date/currency | locale evidence |
| Release regression | Previous tests remain passing | Version updates, device matrix, install/upgrade | CI run |

## Device test run sheet
| Device | OS | Network | Locale | App build | WAL-001 | WAL-003 | WAL-004 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Android Emulator (user configured) | record version | Wi-Fi | en-US | 1.0 | not run | not run | not run |
| Physical Galaxy (if owned) | record version | Wi-Fi | en-US | 1.0 | not run | not run | not run |
| Physical Galaxy (if owned) | record version | cellular | ko-KR | 1.0 | not run | not run | not run |

## Severity rubric
- **P0 blocker:** real or potential duplicate charge, payment security breach, widespread inability to complete purchases (severity contingent on release scope).
- **P1 high:** common payment failure, wrong reward amount, inaccurate refund accounting.
- **P2 medium:** confusing error/UX defect with available workaround.
- **P3 low:** minor visual polish or copy inconsistency.

## Reproduce fault BUG-01
1. Reset data, choose compatible device, online network, valid auth.
2. Enable `BUG-01: Duplicate charge`.
3. Select **Run duplicate-tap experiment**.
4. Actual: two transactions share the same request ID; event log displays `DUPLICATE_CHARGE_DETECTED`.
5. Expected: one charge, second request deduplicated.
6. Screenshot, export sanitized logs, write a P0 defect with exact reproduction.
7. Disable BUG-01, reset and re-run: one transaction, `IDEMPOTENCY_PASS`.

## Reproduce fault BUG-02
1. Reset, choose active Galaxy demo card; merchant Demo Coffee; enter `$10.01`.
2. Enable `BUG-02: Incorrect cash back`, submit.
3. Observe `21¢` instead of `20¢`: incorrect use of ceiling instead of normal rounding of 20.02¢.
4. Disable BUG-02, reset and re-run; record passing result and assert refund reverses award.

## Android troubleshooting commands (only for your own authorized devices)
```bash
adb devices
adb shell getprop ro.build.version.release
adb shell getprop ro.product.model
adb logcat -c
adb logcat -v threadtime -s WalletQaLab:I '*:S'
adb bugreport wallet-lab-bugreport.zip
adb reverse tcp:4173 tcp:4173
```
Never commit `adb bugreport` archives or unredacted logs containing other apps' personal information. Avoid logging payment identifiers except synthetic request IDs.

## Public documentation
- https://developer.samsung.com/pay/merchant/test-and-release/test-cases.html
- https://developer.samsung.com/wallet/TestAndGoLive/TestStrategyAndAcceptanceChecklist.html
- https://developer.android.com/tools/logcat
- https://appium.io/docs/en/latest/ecosystem/drivers/
- https://playwright.dev/docs/emulation
