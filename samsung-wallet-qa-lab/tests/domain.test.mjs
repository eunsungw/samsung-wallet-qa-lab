import test from 'node:test';
import assert from 'node:assert/strict';
import { charge, cashbackFor, dollarsToCents, earnedCashback, initialWallet, refund } from '../dist/domain.js';
const device = { model: 'Galaxy S25', android: '15', network: 'wifi', supported: true, authValid: true };
const make = (changes = {}) => ({ requestId: 'req-01', amountCents: 1001, merchant: 'Demo Coffee', category: 'food', cardId: 'galaxy', device, ...changes });
test('WAL-001: approved purchase earns correctly rounded reward', () => {
  const result = charge(initialWallet(), make());
  assert.equal(result.ok, true);
  assert.equal(result.transaction.amountCents, 1001);
  assert.equal(result.transaction.cashbackCents, 20);
  assert.equal(result.wallet.transactions.length, 1);
});
test('WAL-002: duplicate request is idempotent', () => {
  const first = charge(initialWallet(), make());
  const second = charge(first.wallet, make());
  assert.equal(second.ok, true);
  assert.equal(second.duplicate, true);
  assert.equal(second.wallet.transactions.length, 1);
});
test('WAL-003: offline payment declines without creating a charge', () => {
  const result = charge(initialWallet(), make({ device: { ...device, network: 'offline' } }));
  assert.equal(result.ok, false);
  assert.equal(result.code, 'OFFLINE');
  assert.equal(result.wallet.transactions.length, 0);
});
test('WAL-004: expired authentication declines', () => {
  const result = charge(initialWallet(), make({ device: { ...device, authValid: false } }));
  assert.equal(result.ok, false);
  assert.equal(result.code, 'AUTH_EXPIRED');
});
test('WAL-005: locked and expired demo cards decline', () => {
  assert.equal(charge(initialWallet(), make({ cardId: 'locked' })).code, 'CARD_LOCKED');
  assert.equal(charge(initialWallet(), make({ cardId: 'expired' })).code, 'CARD_EXPIRED');
});
test('WAL-006: unsupported device profile declines', () => {
  const result = charge(initialWallet(), make({ device: { ...device, supported: false } }));
  assert.equal(result.code, 'UNSUPPORTED_DEVICE');
});
test('WAL-007: grocery promotion applies 5% with cent rounding', () => {
  const result = charge(initialWallet(), make({ amountCents: 1999, category: 'grocery' }));
  assert.equal(result.transaction.cashbackCents, 100);
});
test('WAL-008: refund reverses earned reward exactly once', () => {
  const charged = charge(initialWallet(), make());
  const once = refund(charged.wallet, charged.transaction.id);
  assert.equal(earnedCashback(once), 0);
  const twice = refund(once, charged.transaction.id);
  assert.deepEqual(once, twice);
});
test('WAL-009: invalid decimal input is rejected', () => {
  assert.equal(dollarsToCents('19.99'), 1999);
  for (const invalid of ['-2', '1.999', '1e5', '0.001', '', 'Infinity', ' 1,000 ']) assert.equal(dollarsToCents(invalid), null);
  assert.equal(charge(initialWallet(), make({ amountCents: 0 })).code, 'INVALID_AMOUNT');
});
test('Fault injection: BUG-01 reproduces a duplicate charge', () => {
  const flags = { duplicateCharge: true, cashbackCeiling: false };
  const first = charge(initialWallet(), make(), flags);
  const second = charge(first.wallet, make(), flags);
  assert.equal(second.wallet.transactions.length, 2);
});
test('Fault injection: BUG-02 reproduces wrong rounding and fixes cleanly', () => {
  assert.equal(cashbackFor(1001, 200, 'food', true), 21);
  assert.equal(cashbackFor(1001, 200, 'food', false), 20);
});
