# Samsung Wallet QA interview: concept guide and study plan

This guide is tailored to the uploaded job description for the **Samsung Wallet/P&T/TIG, Mobile Quality Lab** team in Plano. The role cites Cash Back, Galaxy Card, digital payments, mobile device compatibility, test results, bugs, regressions, first-level log troubleshooting, and effective communication. **No precise internal automation tool or language is identified in the description.** The tools in this lab are transferable, not claimed to be Samsung's internal stack.

## Wallet ecosystem: architecture in words
1. **User and phone:** The phone hosts the digital wallet app. An owner may enroll payment cards, passes, tickets, keys, or other supported wallet items.
2. **Wallet UI and authentication:** The app displays eligible instruments, verifies the user (e.g. biometric/PIN where supported), and enforces local device/service policies.
3. **Tokenization and issuer services:** Production contactless payment systems may use network tokens rather than exposing the original primary account number. A token service provider, payment network, issuer, and risk services participate depending on the payment flow.
4. **Merchant / gateway / acquirer:** At physical checkout, NFC/EMV contactless messaging is exchanged with the terminal and routed to the card network. Web/app checkout uses a different app-to-app or online gateway flow.
5. **Back-end authorization:** Real authorization is asynchronous across network parties, including declines, timeout, duplication, reversals and settlement. This lab **does not** perform any of these real-money steps.
6. **Rewards/cash back:** A reward system may derive eligibility and calculate reward accrual based on merchant category, campaign terms and transaction state. Our 2%/5% rates are **fictional teaching examples**; do not claim they are Samsung's offer.
7. **Telemetry/QA:** App logs, request IDs, device configuration, HTTP status codes and release/build metadata enable reproducibility and root-cause triage. Sensitive payment credentials should not appear in logs.

### Testing types you should explain
- **Manual functional:** execute preconditions and test steps, compare expected versus actual, document results.
- **Smoke:** few critical features immediately after installing a build: launch, sign-in, add card/checkout entry, transaction receipt.
- **Regression:** rerun previously passing tests after a code change; include adjacent features impacted by the fix.
- **Compatibility:** Android version, One UI/version, device family, screen size, region, issuer, network, wallet/app version.
- **Negative/error:** offline, expired authentication, unsupported device/card, canceled biometric, wrong PIN, duplicate tap, timeout, corrupted data.
- **API/integration:** verify status codes, contracts, schema, idempotency, retries, token expiry, consistent cross-service state. Use *authorized sandbox endpoints only*.
- **Security/privacy:** proper masked account display, no secrets in logs, encryption/token handling, lockout and biometric behavior; do not attempt to bypass access control.
- **Field testing:** real connectivity transitions, NFC terminal interaction **only in an authorized Samsung/partner test program**, different locations and supported carriers.
- **Automation:** Playwright browser/mobile viewport; Appium UiAutomator2 on a genuine Android Chrome or app; Kotlin/Compose instrumented UI tests.

## 6-day skill-building sequence
**Day 1 — QA fundamentals:** run the web app; complete WAL-001, WAL-003, WAL-005, WAL-009 manually; write preconditions, steps and results. Distinguish severity from priority.

**Day 2 — Unit tests:** read `src/domain.ts` and `tests/domain.test.mjs`. Run `npm test`. Intentionally alter reward rounding, observe failing tests, fix and rerun.

**Day 3 — Playwright:** install Playwright. Run desktop/mobile Chromium suites, open HTML report and failure traces. Add a new test verifying refund removes cash back.

**Day 4 — Android hardware:** install Android Studio, SDK Platform Tools, AVD. Connect your Android device/emulator via `adb devices`, inspect OS/build and run the native Kotlin mini-app. Learn `adb logcat` and `adb bugreport` handling.

**Day 5 — Appium:** install Appium + UiAutomator2 and run `npm run test:android` against your own hosted demo in Chrome on emulator or physical device. Record model/OS/build. Contrast emulation with a real-device session.

**Day 6 — Triage and reporting:** enable BUG-01 and BUG-02. Collect sanitized evidence. Export two reports, reproduce on two configurations, verify fixes, and summarize the issue in 90 seconds.

## Interview questions + answer sketches
**Q: Have you used Samsung Wallet QA tools?**
> I haven't used Samsung's internal toolchain. I built a separate mobile wallet QA lab with TypeScript, Playwright and Appium, and I practiced Android logging with ADB/Logcat. I designed successful and unsuccessful payment tests, duplicate-request safeguards, cash-back validation and reproducible defect reports. I understand that internal systems and real payment integration require proper access, and I'm prepared to learn the team's standards quickly.

**Q: A payment fails only on cellular, not Wi-Fi. What do you do?**
> Confirm device/One UI/app build, SIM/carrier, network type, steps and frequency. Reproduce on another device and compare airplane/offline states. Record timestamp and trace ID, inspect sanitized Android/app logs, distinguish DNS/TLS/timeouts from authorization declines, and report a prioritized issue. Retest on the original devices after a fix.

**Q: How do you test Cash Back?**
> Define business rules and eligibility, then build boundary cases for rounding and promotions. Validate approved versus declined or refunded purchases, duplication, and UI/ledger consistency. Capture expected cash-back in integer cents to avoid floating-point errors.

**Q: What is smoke vs regression testing?**
> Smoke validates that basic critical functions work on a new build; regression confirms a fix hasn't broken previously functioning areas. After a duplicate-charge fix, I would rerun happy path, repeated requests, network retries, refunds, and reward calculation.

**Q: What's a good bug report?**
> A precise title, device/app/OS/build environment, preconditions, reliable steps to reproduce, expected and actual behavior, frequency, impact/severity, sanitized traces, screenshots and retest results. I avoid ambiguous "not working" wording.

## Source-first study links
- Samsung Wallet product docs: https://developer.samsung.com/wallet
- Samsung Pay merchant test cases: https://developer.samsung.com/pay/merchant/test-and-release/test-cases.html
- Samsung partner prerequisites: https://developer.samsung.com/wallet/GetStarted/Prerequisites.html
- Android Logcat: https://developer.android.com/tools/logcat
- Playwright mobile emulation: https://playwright.dev/docs/emulation
- Appium UiAutomator2: https://appium.io/docs/en/3.0/quickstart/uiauto2-driver/
