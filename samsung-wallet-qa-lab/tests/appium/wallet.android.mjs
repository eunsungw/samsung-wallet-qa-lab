/**
 * Run on an Android emulator or YOUR OWN authorized physical device.
 * 1. npm run dev              (separate terminal)
 * 2. adb reverse tcp:4173 tcp:4173
 * 3. appium                  (separate terminal; install UiAutomator2 first)
 * 4. npm run test:android
 * Browser automation targets this independent demo, NOT Samsung Wallet.
 */
import { remote } from 'webdriverio';
const url = process.env.WALLET_URL ?? 'http://127.0.0.1:4173';
const driver = await remote({
  hostname: '127.0.0.1', port: 4723, path: '/',
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.ANDROID_DEVICE ?? 'Android',
    browserName: 'Chrome',
    'appium:newCommandTimeout': 120
  }
});
try {
  await driver.url(url);
  await (await driver.$('[data-nav="pay"]')).click();
  const amount = await driver.$('#amount');
  await amount.waitForDisplayed({ timeout: 15_000 });
  await amount.setValue('10.01');
  await (await driver.$('[data-testid="pay-button"]')).click();
  const result = await driver.$('[role="status"]');
  await result.waitForDisplayed({ timeout: 15_000 });
  const resultText = await result.getText();
  if (!resultText.includes('APPROVED: $10.01')) throw new Error(`Unexpected payment response: ${resultText}`);
  console.log('PASS Android Chrome payment test:', resultText);
} finally { await driver.deleteSession(); }
