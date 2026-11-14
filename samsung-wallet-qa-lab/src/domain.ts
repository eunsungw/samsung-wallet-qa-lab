/** Pure wallet business logic. Educational simulation only: no real payment processing. */
export type CardStatus = 'active' | 'locked' | 'expired';
export type Network = 'wifi' | '5g' | 'offline';
export type TransactionStatus = 'approved' | 'refunded';
export type DeclineCode = 'OFFLINE' | 'UNSUPPORTED_DEVICE' | 'AUTH_EXPIRED' | 'CARD_LOCKED' | 'CARD_EXPIRED' | 'INVALID_AMOUNT' | 'CARD_NOT_FOUND';
export interface DemoCard { id: string; label: string; last4: string; status: CardStatus; baseRateBps: number; }
export interface DeviceConfig { model: string; android: string; network: Network; supported: boolean; authValid: boolean; }
export interface Transaction { id: string; requestId: string; amountCents: number; merchant: string; category: string; cardId: string; cashbackCents: number; status: TransactionStatus; createdAt: string; }
export interface WalletData { cards: DemoCard[]; transactions: Transaction[]; }
export interface Purchase { requestId: string; amountCents: number; merchant: string; category: string; cardId: string; device: DeviceConfig; }
export interface Faults { duplicateCharge: boolean; cashbackCeiling: boolean; }
export type PaymentResult = { ok: true; transaction: Transaction; duplicate: boolean; wallet: WalletData } | { ok: false; code: DeclineCode; message: string; wallet: WalletData };
export const SEED_CARDS: DemoCard[] = [
  { id: 'galaxy', label: 'Galaxy Card · demo', last4: '4242', status: 'active', baseRateBps: 200 },
  { id: 'travel', label: 'Everyday Rewards · demo', last4: '8017', status: 'active', baseRateBps: 100 },
  { id: 'locked', label: 'Locked Card · demo', last4: '0005', status: 'locked', baseRateBps: 200 },
  { id: 'expired', label: 'Expired Card · demo', last4: '0006', status: 'expired', baseRateBps: 200 }
];
export const initialWallet = (): WalletData => ({ cards: SEED_CARDS.map(card => ({ ...card })), transactions: [] });
export const formatMoney = (cents: number): string => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
/** All monetary computations use integer cents; category bonus is a demo rule, not a Samsung offer. */
export function cashbackFor(amountCents: number, baseRateBps: number, category: string, faultyRounding = false): number {
  const rateBps = category === 'grocery' ? Math.max(baseRateBps, 500) : baseRateBps;
  const raw = amountCents * rateBps / 10000;
  return faultyRounding ? Math.ceil(raw) : Math.round(raw);
}
const decline = (wallet: WalletData, code: DeclineCode, message: string): PaymentResult => ({ ok: false, code, message, wallet });
export function charge(wallet: WalletData, p: Purchase, faults: Faults = { duplicateCharge: false, cashbackCeiling: false }, now = new Date()): PaymentResult {
  // One request ID must map to one charge, including if a user taps the pay button twice.
  const existing = wallet.transactions.find(tx => tx.requestId === p.requestId);
  if (existing && !faults.duplicateCharge) return { ok: true, wallet, transaction: existing, duplicate: true };
  if (!Number.isSafeInteger(p.amountCents) || p.amountCents <= 0 || p.amountCents > 10000000) return decline(wallet, 'INVALID_AMOUNT', 'Enter an amount between $0.01 and $100,000.00.');
  if (!p.device.supported) return decline(wallet, 'UNSUPPORTED_DEVICE', 'This demonstration device profile is unsupported.');
  if (p.device.network === 'offline') return decline(wallet, 'OFFLINE', 'Network unavailable. No charge was created.');
  if (!p.device.authValid) return decline(wallet, 'AUTH_EXPIRED', 'Authentication expired. Sign in again.');
  const card = wallet.cards.find(c => c.id === p.cardId);
  if (!card) return decline(wallet, 'CARD_NOT_FOUND', 'Selected card was not found.');
  if (card.status === 'locked') return decline(wallet, 'CARD_LOCKED', 'Card is locked.');
  if (card.status === 'expired') return decline(wallet, 'CARD_EXPIRED', 'Card has expired.');
  const tx: Transaction = {
    id: `txn-${p.requestId}-${wallet.transactions.length + 1}`, requestId: p.requestId,
    amountCents: p.amountCents, merchant: p.merchant, category: p.category,
    cardId: p.cardId, cashbackCents: cashbackFor(p.amountCents, card.baseRateBps, p.category, faults.cashbackCeiling),
    status: 'approved', createdAt: now.toISOString()
  };
  return { ok: true, duplicate: false, transaction: tx, wallet: { ...wallet, transactions: [tx, ...wallet.transactions] } };
}
export function refund(wallet: WalletData, transactionId: string): WalletData {
  const tx = wallet.transactions.find(t => t.id === transactionId);
  if (!tx || tx.status === 'refunded') return wallet;
  return { ...wallet, transactions: wallet.transactions.map(t => t.id === transactionId ? { ...t, status: 'refunded' } : t) };
}
export function earnedCashback(wallet: WalletData): number {
  return wallet.transactions.reduce((sum, t) => sum + (t.status === 'approved' ? t.cashbackCents : 0), 0);
}
/** Strict decimal input to cents; rejects fractional cents, exponent notation, and infinity. */
export function dollarsToCents(value: string): number | null {
  if (!/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ''] = value.trim().split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(cents) ? cents : null;
}
