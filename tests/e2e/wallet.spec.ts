import { test, expect } from '@playwright/test';
test('WAL-001: successful payment and expected reward', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Payment testing' }).click();
  await page.getByLabel('Amount (USD)').fill('10.01');
  await page.getByTestId('pay-button').click();
  await expect(page.getByRole('status')).toContainText('APPROVED: $10.01');
  await expect(page.getByRole('status')).toContainText('$0.20');
});
test('WAL-003: offline checkout returns actionable error', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Payment testing' }).click();
  await page.locator('#network').selectOption('offline');
  await page.getByTestId('pay-button').click();
  await expect(page.getByRole('status')).toContainText('OFFLINE');
  await page.getByRole('button', { name: 'Event logs' }).click();
  await expect(page.getByLabel('Diagnostic logs')).toContainText('PAYMENT_DECLINED');
});
test('WAL-002: repeat taps result in one charge by default', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Payment testing' }).click();
  await page.getByRole('button', { name: 'Run duplicate-tap experiment' }).click();
  await expect(page.getByRole('status')).toContainText('1 charge(s)');
  await page.getByRole('button', { name: 'Overview' }).click();
  await expect(page.getByText('Total demo payments').locator('..')).toContainText('1');
});
test('BUG-01: deliberately injected idempotency defect is visible', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Payment testing' }).click();
  await page.locator('#fault-duplicate').check();
  await page.getByRole('button', { name: 'Run duplicate-tap experiment' }).click();
  await expect(page.getByRole('status')).toContainText('FAIL: duplicated charge');
});
