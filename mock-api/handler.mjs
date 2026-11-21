import { createServer } from 'node:http';

/** Local-only, fake wallet API for contract testing. No payment processor, real card data, or storage. */
export function createMockWalletServer() {
  const transactions = [];
  const requestIndex = new Map();

  function reply(res, code, body) {
    res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-demo-only': 'true' });
    res.end(JSON.stringify(body));
  }

  async function readJson(req) {
    let data = '';
    for await (const chunk of req) {
      data += chunk;
      if (data.length > 32_768) throw Object.assign(new Error('Request exceeds 32 KB'), { status: 413 });
    }
    try { return JSON.parse(data); }
    catch { throw Object.assign(new Error('Expected valid JSON'), { status: 400 }); }
  }

  return createServer(async (req, res) => {
    const path = (req.url ?? '/').split('?')[0];
    const method = req.method;
    try {
      if (method === 'GET' && path === '/api/mock/health') {
        return reply(res, 200, { status: 'ok', environment: 'sandbox-only', transactions: transactions.length });
      }
      if (method === 'POST' && path === '/api/mock/reset') {
        transactions.length = 0; requestIndex.clear();
        return reply(res, 200, { status: 'reset', environment: 'sandbox-only' });
      }
      if (method === 'GET' && path === '/api/mock/transactions') {
        return reply(res, 200, { transactions: transactions.map(t => ({ ...t })) });
      }
      if (method === 'POST' && path === '/api/mock/payments') {
        const b = await readJson(req);
        if (!b || typeof b !== 'object' || Array.isArray(b)) return reply(res, 400, { code: 'BAD_REQUEST' });
        const { requestId, amountCents, category = 'food', online = true, authValid = true, cardActive = true, deviceSupported = true } = b;
        if (typeof requestId !== 'string' || !/^[-a-zA-Z0-9_]{1,64}$/.test(requestId)
          || !Number.isSafeInteger(amountCents) || amountCents < 1 || amountCents > 10_000_000
          || !['food', 'grocery'].includes(category)
          || [online, authValid, cardActive, deviceSupported].some(value => typeof value !== 'boolean')) {
          return reply(res, 422, { code: 'INVALID_INPUT' });
        }
        const currentPayload = JSON.stringify({ amountCents, category, online, authValid, cardActive, deviceSupported });
        const previous = requestIndex.get(requestId);
        if (previous) {
          if (previous.payload !== currentPayload) return reply(res, 409, { code: 'REQUEST_ID_CONFLICT' });
          return reply(res, 200, { code: 'APPROVED', duplicate: true, transaction: { ...previous.transaction } });
        }
        if (!deviceSupported) return reply(res, 422, { code: 'UNSUPPORTED_DEVICE' });
        if (!online) return reply(res, 503, { code: 'OFFLINE' });
        if (!authValid) return reply(res, 401, { code: 'AUTH_EXPIRED' });
        if (!cardActive) return reply(res, 423, { code: 'CARD_LOCKED' });

        const transaction = {
          id: `mock-txn-${String(transactions.length + 1).padStart(4, '0')}`,
          requestId, amountCents,
          cashbackCents: Math.round(amountCents * (category === 'grocery' ? 5 : 2) / 100),
          status: 'approved', refunded: false
        };
        transactions.push(transaction);
        requestIndex.set(requestId, { payload: currentPayload, transaction });
        return reply(res, 201, { code: 'APPROVED', duplicate: false, transaction: { ...transaction } });
      }
      if (method === 'POST' && path === '/api/mock/refunds') {
        const b = await readJson(req);
        if (!b || typeof b.transactionId !== 'string') return reply(res, 422, { code: 'INVALID_INPUT' });
        const transaction = transactions.find(t => t.id === b.transactionId);
        if (!transaction) return reply(res, 404, { code: 'NOT_FOUND' });
        const duplicate = transaction.refunded;
        transaction.refunded = true;
        return reply(res, 200, { code: 'REFUNDED', duplicate, transaction: { ...transaction }, netCashbackCents: transactions.reduce((sum, t) => sum + (t.refunded ? 0 : t.cashbackCents), 0) });
      }
      return reply(res, 404, { code: 'NOT_FOUND' });
    } catch (err) {
      return reply(res, Number(err?.status || 400), { code: 'BAD_REQUEST', message: String(err?.message || 'Request could not be processed') });
    }
  });
}
