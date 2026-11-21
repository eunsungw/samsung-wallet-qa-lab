# Native Android wallet QA lab — hands-on learning guide

**Scope:** The Android app here is an independent educational wallet simulator. It is not Samsung Wallet, does not provide NFC/contactless payments, does not interact with bank rails, and does not integrate with proprietary payment SDKs. Use only synthetic values. This repository's Vercel website is separate from the native Android APK.

## Architecture and what each tool teaches

```text
Windows PC with Android Studio
  └─ Android Virtual Device (Pixel / generic Android emulator)
       ├─ Native Wallet QA Lab APK (Kotlin + Jetpack Compose)
       │    ├─ PaymentEngine (pure Kotlin business rules)
       │    ├─ Compose UI (testTags exposed for automation)
       │    └─ Log.i("WalletQaLab", ...) diagnostic events
       └─ ADB ↔ Logcat / Espresso instrumentation / Appium UiAutomator2

Local mock API (Node.js on 127.0.0.1:4300)
  ├─ Postman Collection Runner (functional and negative API cases)
  └─ Node contract test suite (automated, no real payment services)

Deployed browser-based wallet + Supabase QA reporting
  ├─ Playwright for browser/viewport tests
  └─ cloud.html for recording runs and defects in isolated Supabase sandbox
```

The Kotlin demo and the Node API are **two independent practice fixtures**. The Kotlin app currently runs a local in-memory payment engine and does not call the mock HTTP API. This helps you isolate UI/device issues from network/API failures. A future Codex task could integrate Retrofit/OkHttp to call the mock API after adding integration tests.

## Step 1 — Windows setup

Install:

1. [Android Studio](https://developer.android.com/studio) (includes SDK Manager and Android Emulator)
2. Android SDK Platform **API 35**, Android SDK Platform-Tools (ADB), Android Emulator, x86_64 compatible system image
3. JDK 17, Node.js 22+, [Postman](https://www.postman.com/downloads/)
4. Appium 3 and UiAutomator2 (for the optional cross-app native automation)

The project's Android Gradle Plugin is **8.7.3** (Gradle **8.9**, **JDK 17**). If Android Studio prompts for Gradle distribution, choose Gradle 8.9. This repository has not yet committed Gradle wrapper files; if your PC has Gradle 8.9 installed, from `android/` run `gradle wrapper --gradle-version 8.9` and then use `./gradlew` or `gradlew.bat`. The current application module has not been compiled with the full Android SDK in the automated environment, so treat the Android build as a first-run verification step.

Android emulator on Windows may require virtualization (Windows Hypervisor Platform enabled in Windows Features); follow Android Studio's device acceleration wizard rather than forcing BIOS settings without understanding them.

## Step 2 — Create an Android Phone Simulator

1. Open **Android Studio → Open → [repo]/android** (not the TypeScript repo root).
2. Wait for Gradle sync, install any requested SDK components.
3. Open **Tools → Device Manager → Create Device**.
4. Choose a phone hardware profile (for example a Pixel; this is a generic Android emulator, **not a real Samsung Galaxy or One UI**).
5. Select an Android 15 / API 35 system image supported on your PC; create and start the AVD.
6. Select the AVD from the target-device menu and click **Run** to install the `app` module.
7. Expect to see **Wallet QA Lab · Android**, a $10.01 amount field, test switches, payment/refund buttons and the result panel.

Optional: Samsung's [Galaxy Emulator Skin](https://developer.samsung.com/support) changes appearance only. It does **not** provide Knox, secure element, Samsung Wallet or payment NFC behavior.

## Step 3 — Run tests from Android Studio

- Native JVM business logic tests: right-click `WalletEngineTest.kt` → **Run**; or `gradlew.bat :app:testDebugUnitTest` from `android` after wrapper setup.
- Espresso/Compose instrumented tests: right-click `WalletScreenTest.kt` → **Run** with the AVD started; or `gradlew.bat :app:connectedDebugAndroidTest`.
- The JVM tests validate calculation, negative paths, idempotency, retries, and refunds.
- The UI tests simulate taps and switches to check the visible result and transaction count.

For failing assertions, document whether the failure is business logic, UI rendering, emulator configuration, instrumentation setup or device-specific.

## Step 4 — ADB and Logcat diagnostics

Open Android Studio's Terminal or a PowerShell where `adb` is in PATH:

```powershell
adb devices
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
adb shell pm list packages com.example.walletqalab
adb shell am start -n com.example.walletqalab/.MainActivity
adb logcat -c
adb logcat -v time -s WalletQaLab:I '*:S'
```

Perform a mock payment while Logcat is running, then look for e.g.

```text
I/WalletQaLab: event=PAYMENT code=APPROVED requestId=req-0001 total=1
I/WalletQaLab: event=PAYMENT code=APPROVED_DUPLICATE_IGNORED requestId=req-0001 total=1
I/WalletQaLab: event=PAYMENT code=OFFLINE requestId=req-0002 total=1
```

These are **illustrative example lines**; timestamps, process IDs, etc. will differ. Capture logs only for your own demo; keep personal data out of bug-report archives.

## Step 5 — Appium native automation

Appium 3 + UiAutomator2 work with a **running emulator or authorized physical Android device**. Android Studio's generic AVD is sufficient for our app.

```powershell
npm install -g appium
appium driver install uiautomator2
appium driver doctor uiautomator2
```

Terminal 1: `appium` (keep running). Terminal 2 at repository root:

```powershell
npm install
npm run test:android:native
```

Appium accesses Compose test tags as Android resource IDs because the native root includes `testTagsAsResourceId = true`. Tests target the package `com.example.walletqalab`. Our existing `npm run test:android:web` separately opens the browser simulator in Android Chrome and requires `npm run dev` + `adb reverse tcp:4173 tcp:4173`.

If more than one emulator/device is connected, select one via `ANDROID_UDID`, e.g. `$env:ANDROID_UDID = 'emulator-5554'`. For locator issues, use [Appium Inspector](https://appium.github.io/appium-inspector/latest/) to inspect the native view tree; re-check `testTagsAsResourceId` and scroll state before adding brittle sleeps.

## Step 6 — API testing in Postman

At repository root, run the **local-only synthetic API server**:

```powershell
npm run dev:api
```

API default: `http://127.0.0.1:4300/api/mock`. This API is deliberately local, and its records are stored **in memory** only (restart to reset).

In Postman choose **Import** → `postman/Wallet_QA_Lab.postman_collection.json` and optionally `postman/Local.postman_environment.json`. Open the collection → **Run** to run the ten ordered cases. They cover health, approval, duplicate request, ledger verification, refund/retry, offline, expired auth, locked card and malformed amount.

To run the same API logic without Postman:

```powershell
npm run test:api
npm test
```

Important: The local API is not a Vercel production endpoint. Do not send the Postman collection to Supabase's URL or a real bank/gateway API.

## Step 7 — Test case execution and evidence

Open `docs/ANDROID_TEST_CASES.md` for concrete cases, preconditions, expected result, severity, and evidence. In `https://samsung-wallet-qa-lab.vercel.app/cloud.html` (after authentication), record a manual test run with case ID, app build, device model, Android version, pass/fail and sanitized notes. Log defects using the same IDs. The Supabase reporting portal stores reports only; it is **not** the same as the synthetic Node API.

## Samsung Wallet reality check

- [Samsung Wallet developer prerequisites](https://developer.samsung.com/wallet/GetStarted/Prerequisites.html) require a supported physical Samsung device and, for partner integrations, an approved partner account and secure server environment.
- [Samsung Wallet partner testing](https://developer.samsung.com/wallet/TestAndGoLive/TestStrategyAndAcceptanceChecklist.html) requires test-mode cards and supported physical devices for acceptance.
- [Knox SDK sample guidance](https://docs.samsungknox.com/dev/knox-sdk/sample-app-tutorials/manage-device-applications/run-sample-app/) states Android Studio emulator does not support Knox features.
- A normal Android emulator cannot establish real Samsung Wallet payment compatibility. With a personally owned compatible Galaxy, basic app installation/UI exploration may be possible, but don't automate real purchase flows or provision actual cards as testing fixtures. Use Samsung-issued test resources when authorized.

## Follow-up Codex task

> Read `docs/ANDROID_QA_LAB.md`, `docs/ANDROID_TEST_CASES.md` and the native app. Validate the Android Gradle build on an SDK-equipped environment; add a Gradle wrapper; run the JVM and emulator instrumentation suites; fix any reproducible setup issues with clear evidence. Next, integrate the native Kotlin app with the localhost mock API using a repository abstraction, Retrofit/OkHttp, and an injected fake, while keeping all data synthetic and preventing real network use outside the demo.
