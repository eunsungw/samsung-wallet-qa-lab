import { initialWallet, type WalletData } from './domain.js';
export interface LabLog { time: string; level: 'INFO' | 'WARN' | 'ERROR'; event: string; traceId: string; details: string; }
export interface QAResult { status: 'not-run' | 'pass' | 'fail'; notes: string; }
export interface SavedState { wallet: WalletData; logs: LabLog[]; qaResults: Record<string, QAResult>; }
const KEY = 'wallet-qa-lab-v1';
export function defaultState(): SavedState { return { wallet: initialWallet(), logs: [], qaResults: {} }; }
export function load(): SavedState {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null') as SavedState | null;
    if (parsed && Array.isArray(parsed.wallet?.cards) && Array.isArray(parsed.wallet?.transactions) && Array.isArray(parsed.logs) && parsed.qaResults) return parsed;
  } catch { /* corrupted local state: reset safely */ }
  return defaultState();
}
export function save(state: SavedState): void {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private browsing or full storage */ }
}
