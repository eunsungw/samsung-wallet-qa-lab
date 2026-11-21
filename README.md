# Wallet QA Lab — Standalone Mobile Wallet Testing Project

**Independent, non-production digital-wallet simulator and QA portfolio** built for a Samsung Wallet Mobile Quality Lab interview. It is **not** Samsung Wallet, a partner integration, a payment processor, or an actual NFC implementation. There are no real account credentials, transfers, or payment transactions. The mock 'Galaxy Card' is fictional.

## What you can do now
- Simulate payment approvals and failures: unsupported phone, offline, expired authentication, locked/expired card, invalid amount.
- Exercise demo rewards (2% base, 5% grocery promotion), refunds, and ledger reconciliation using integer cents.
- Trigger **BUG-01** duplicate charge and **BUG-02** incorrect cash-back rounding; export sanitized logs and bug reports.
- Run **11 passing JavaScript unit tests** and record **10 manual QA cases**.
- Run Playwright browser tests on desktop and mobile device *emulation* (requires npm + Playwright browser install).
- Run Appium on an Android device/emulator against Chrome loading this demo (requires Android SDK, Appium and UiAutomator2).
- Explore a standalone **native Android Kotlin/Jetpack Compose** mini-app with two instrumented UI tests (requires Android Studio/Gradle setup).
- Independently deploy the frontend to Vercel. The **separate Supabase Auth + PostgreSQL backend has been provisioned** and supports cloud QA run and defect reporting through `cloud.html`; Supabase Auth redirect allowlisting is still required for local and hosted sign-in.

## 1. Start locally (Windows PowerShell / macOS / Linux)
Prerequisite: Node.js 20+.
```bash
npm install
npm run dev
```
Open **http://localhost:4173**. The app is a responsive, local-first static web app. It persists only fictional demo data in your browser's localStorage. It does not contact Supabase or Samsung.

To run the immediately useful unit suite:
```bash
npm test
```
Expected: **11 tests passing**. The tests verify monetary correctness, idempotency, decline safety, card status, rewards and refunds, input validation and deliberate fault reproduction.

## 2. Practice manual testing
1. Open **Payment testing**. Keep **Galaxy Card · demo**, Wi-Fi and valid authentication; submit `$10.01` at Demo Coffee.
2. Expected: payment approved and exactly `$0.20` cash back. Inspect **Overview** / **Cash back ledger**.
3. Set network to **Offline** and submit again: expect `OFFLINE`, with no additional transaction.
4. Select **Locked Card**, test again; expect `CARD_LOCKED`.
5. Open **Test cases**, follow each step and record Pass/Fail + notes.
6. Open **Event logs** and export JSON; locate the relevant synthetic trace ID.

## 3. Practice finding and reporting real test defects
1. In **Payment testing**, enable **BUG-01: Duplicate charge**.
2. Click **Run duplicate-tap experiment**. This submits two mock charges with the same idempotency key.
3. Expected (healthy): one transaction. Actual (fault injected): two. The app displays **FAIL: duplicated charge** and logs `DUPLICATE_CHARGE_DETECTED`.
4. Record **WAL-002** as Fail with device/build and reproduction notes; open **Bug reports** and export a Markdown report.
5. Disable BUG-01, reset, rerun: expect **PASS: deduplicated**. This is a *regression test*.
6. For BUG-02, turn on incorrect rounding and charge `$10.01`: **$0.21** versus correct **$0.20**.

## 4. Automated UI testing with Playwright
```bash
npx playwright install chromium
npm run test:e2e
npx playwright show-report
```
The suite executes against a local server and includes desktop Chromium and simulated Pixel mobile browser configurations. **A simulated viewport is not a physical Samsung Galaxy test**. Useful debugging commands:
```bash
npx playwright test --headed
npx playwright test --trace on
npx playwright codegen http://localhost:4173
```

## 5. Android device testing with Appium
1. Install **Android Studio** and SDK Platform Tools. Create an Android emulator with Chrome, or connect your own authorized device with USB debugging.
2. Run `adb devices` and `adb shell getprop ro.build.version.release`.
3. Run `npm run dev` in terminal A. Run `adb reverse tcp:4173 tcp:4173` so Chrome on device can reach the local server.
4. Install Appium globally: `npm install -g appium` and `appium driver install uiautomator2`.
5. Start `appium` in terminal B; run `npm run test:android` in terminal C. Use `ANDROID_DEVICE` for device name where required.
6. The Appium sample automates **Android Chrome displaying this lab**, not the proprietary Samsung Wallet app. Chromedriver/Chrome compatibility and Android SDK setup may need local configuration.
7. For a real hosted Vercel URL, set `WALLET_URL=https://your-preview-url.example` instead of forwarding localhost.

## 6. Native Kotlin mini-app (advanced but recommended)
The separate `android/` folder contains a small Kotlin + Jetpack Compose Android app implementing simulated `APPROVED`, `OFFLINE` and `AUTH_EXPIRED` flows. It logs `WalletQaLab` events to **actual Android Logcat** and contains two Compose instrumentation tests.

Open `android/` in Android Studio. If prompted, install Android SDK 35 and Java 17, configure Gradle 8.9/Gradle wrapper, and sync project dependencies. The source scaffold does not bundle a Gradle wrapper JAR and was **not compiled in this environment**. After local setup, run `connectedAndroidTest` and:
```bash
adb logcat -s WalletQaLab:I '*:S'
```
(For Windows PowerShell, the filter can be supplied as a quoted argument.)

## 7. Connect your independent Vercel and Supabase projects
See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). The standalone source has no dependencies on another application. Vercel Root Directory = repository root, Build Command = `npm run build`, Output = `dist`. The **independent Supabase project `wallet-qa-lab` is now provisioned** at `https://mvypyjjfqjiuolluyhmj.supabase.co` with `wallet_qa_runs` and `wallet_qa_defects` protected by owner-scoped RLS. Its public URL and browser-safe publishable key are already configured as build defaults (override with Vercel `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`). Before authenticating, allowlist your actual local and deployed `/cloud.html` URLs in Supabase Auth → URL Configuration. Vercel deployment is not yet connected; see deployment docs.

## 8. Use Codex to extend the project
Read [`AGENTS.md`](AGENTS.md). In Codex, open the NEW standalone GitHub repository on a feature branch and assign:
> Implement a stable Playwright test for refund reversal, covering the cash-back ledger before/after refund. First run the current tests, make the smallest change, rerun unit and E2E suites, and include screenshots or trace evidence in the PR. Do not use real financial data.

## Interview portfolio checkpoints
- **Manual QA:** 10 recorded test cases; at least one P0 and one P1 defect with logs and reproduction.
- **Automation:** unit suite passing, Playwright web/mobile emulator run and an Appium Android Chrome run (after local setup).
- **Android:** device matrix, OS/One UI/build recording, `adb logcat`, native Kotlin instrumentation results.
- **Debugging:** correlation IDs, reproducibility, criticality assessment and post-fix regression.
- **Communication:** explain architecture and defects clearly in 60–90 seconds.

Further reading: [`docs/TEST_PLAN.md`](docs/TEST_PLAN.md), [`docs/INTERVIEW_PREP.md`](docs/INTERVIEW_PREP.md).

## Privacy and accuracy
All sample card digits and transactions are fabricated. Don't add real cards or financial data, secrets, partner certificates or unredacted user logs. This educational demo makes **no claim** that Samsung uses Playwright, Appium, Kotlin or the stack listed here internally; the uploaded job description does not identify a specific QA toolchain.


## Native Android QA lab extension

Open **`docs/ANDROID_QA_LAB.md`** for the full Windows Android Studio emulator setup, Kotlin/Compose test app, ADB/Logcat, Appium native and browser automation, Postman local mock API and supervised physical Galaxy testing scope. The test matrix and simulated defect template are in **`docs/ANDROID_TEST_CASES.md`**.

Quick start (Node 20+):

```bash
npm install
npm test             # Web payment logic + local API contract tests
npm run dev:api      # Separate local mock HTTP API at 127.0.0.1:4300
```

Import `postman/Wallet_QA_Lab.postman_collection.json` into Postman. Open `android/` in Android Studio; its Kotlin sample and instrumentation suite run on a **generic Android Emulator** (requires local SDK). Appium smoke tests live at `tests/appium/native.wallet.android.mjs`; run `npm run test:android:native` after installing the app and starting Appium.

**Never interpret simulator tests as real Samsung Wallet certification.** The native app and local API are independent educational fixtures; the real wallet requires supported Samsung hardware and approved partner resources for privileged testing.
