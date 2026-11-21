/**
 * Black-box native UI smoke tests with Appium 3 + UiAutomator2.
 * Prerequisite: build/install the Kotlin app in Android Studio, launch an AVD,
 * run `appium driver install uiautomator2` once, then start `appium`.
 * Only tests OUR OWN `com.example.walletqalab` app; not Samsung Wallet.
 */
import { remote } from 'webdriverio';

const caps = {
  platformName: 'Android',
  'appium:automationName': 'UiAutomator2',
  'appium:deviceName': process.env.ANDROID_DEVICE || 'Android Emulator',
  'appium:appPackage': 'com.example.walletqalab',
  'appium:appActivity': '.MainActivity',
  'appium:noReset': false,
  'appium:newCommandTimeout': 120,
  ...(process.env.ANDROID_UDID ? { 'appium:udid': process.env.ANDROID_UDID } : {})
};
const driver = await remote({ hostname: '127.0.0.1', port: Number(process.env.APPIUM_PORT || 4723), path: '/', capabilities: caps });

// Compose maps .testTag to Android resource-id via testTagsAsResourceId semantics.
const byTag = tag => driver.$(`android=new UiSelector().resourceId("${tag}")`);
async function tap(tag) {
  let el = await byTag(tag);
  if (!(await el.isDisplayed())) {
    // Scroll the native Compose screen; an Appium UiScrollable handles below-fold controls.
    el = await driver.$(`android=new UiScrollable(new UiSelector().scrollable(true)).scrollIntoView(new UiSelector().resourceId("${tag}"))`);
  }
  await el.waitForDisplayed({ timeout: 20_000 });
  await el.click();
}
async function expectText(tag, expected) {
  const el = await byTag(tag);
  await el.waitForDisplayed({ timeout: 20_000 });
  const actual = await el.getText();
  if (!actual.includes(expected)) throw new Error(`${tag}: expected "${expected}" but saw "${actual}"`);
}
try {
  await tap('pay_button');
  await expectText('result_text', 'APPROVED');
  await expectText('history_count', '1');
  console.log('PASS native Android approved payment');

  await tap('duplicate_button');
  await expectText('result_text', 'APPROVED_DUPLICATE_IGNORED');
  await expectText('history_count', '1');
  console.log('PASS native Android retry is idempotent');

  await tap('network_switch');
  await tap('pay_button');
  await expectText('result_text', 'OFFLINE');
  await expectText('history_count', '1');
  console.log('PASS native Android offline decline');
} finally {
  await driver.deleteSession();
}
