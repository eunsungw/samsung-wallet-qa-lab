import { createMockWalletServer } from '../mock-api/handler.mjs';

// The fake payment API listens on loopback only. Use `adb reverse` for Android testing.
const port = Number(process.env.MOCK_API_PORT || 4300);
createMockWalletServer().listen(port, '127.0.0.1', () => {
  console.log(`Synthetic Wallet QA API on http://127.0.0.1:${port}/api/mock/health`);
  console.log('LOCAL DEMO ONLY. No real card payments or permanent transaction records.');
});
