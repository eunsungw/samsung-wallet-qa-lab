import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createMockWalletServer } from '../mock-api/handler.mjs';

async function fixture(fn) {
  const server = createMockWalletServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api/mock`;
  const send = async (path, data, method = data === undefined ? 'GET' : 'POST') => {
    const response = await fetch(base + path, {
      method, headers: data === undefined ? {} : { 'content-type': 'application/json' },
      body: data === undefined ? undefined : JSON.stringify(data)
    });
    return { status: response.status, body: await response.json() };
  };
  try { await fn(send); } finally { await new Promise((resolve, reject) => server.close(e => e ? reject(e) : resolve())); }
}
const valid = (changes = {}) => ({ requestId: 'req-001', amountCents: 1001, category: 'food', online: true, authValid: true, cardActive: true, deviceSupported: true, ...changes });

test('API-001: health is clearly labeled sandbox', () => fixture(async send => {
  const r = await send('/health'); assert.equal(r.status, 200); assert.equal(r.body.environment, 'sandbox-only');
}));
test('API-002: payment and 2% cash back are correct', () => fixture(async send => {
  const r = await send('/payments', valid());
  assert.equal(r.status, 201); assert.equal(r.body.code, 'APPROVED'); assert.equal(r.body.transaction.cashbackCents, 20);
}));
test('API-003: same request ID cannot create duplicate charge', () => fixture(async send => {
  const first = await send('/payments', valid());
  const retry = await send('/payments', valid());
  const ledger = await send('/transactions');
  assert.equal(first.status, 201); assert.equal(retry.status, 200); assert.equal(retry.body.duplicate, true);
  assert.equal(ledger.body.transactions.length, 1);
}));
test('API-004: retrying ID with different amount is rejected', () => fixture(async send => {
  await send('/payments', valid());
  const r = await send('/payments', valid({ amountCents: 2000 }));
  assert.equal(r.status, 409); assert.equal(r.body.code, 'REQUEST_ID_CONFLICT');
}));
test('API-005: offline and expired authentication never charge', () => fixture(async send => {
  assert.equal((await send('/payments', valid({ online: false }))).status, 503);
  assert.equal((await send('/payments', valid({ authValid: false }))).status, 401);
  assert.equal((await send('/transactions')).body.transactions.length, 0);
}));
test('API-006: locked card and unsupported device decline', () => fixture(async send => {
  assert.equal((await send('/payments', valid({ cardActive: false }))).status, 423);
  assert.equal((await send('/payments', valid({ deviceSupported: false }))).status, 422);
}));
test('API-007: invalid input and out-of-range amount return 422', () => fixture(async send => {
  for (const body of [valid({ amountCents: 0 }), valid({ amountCents: 1.999 }), valid({ requestId: 'bad input' }), valid({ online: 'true' })]) {
    assert.equal((await send('/payments', body)).status, 422);
  }
}));
test('API-008: grocery reward/refund is correct and double refund is safe', () => fixture(async send => {
  const created = await send('/payments', valid({ amountCents: 1999, category: 'grocery' }));
  assert.equal(created.body.transaction.cashbackCents, 100);
  const first = await send('/refunds', { transactionId: created.body.transaction.id });
  const second = await send('/refunds', { transactionId: created.body.transaction.id });
  assert.equal(first.body.netCashbackCents, 0);
  assert.equal(second.body.duplicate, true);
  assert.equal(second.body.netCashbackCents, 0);
}));
test('API-009: reset removes demo transactions', () => fixture(async send => {
  await send('/payments', valid());
  await send('/reset', {});
  assert.equal((await send('/transactions')).body.transactions.length, 0);
}));
