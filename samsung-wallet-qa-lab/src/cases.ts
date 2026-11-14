export interface ManualCase { id: string; area: string; priority: 'P0' | 'P1' | 'P2'; title: string; steps: string[]; expected: string; }
export const CASES: ManualCase[] = [
  { id: 'WAL-001', area: 'Payments', priority: 'P0', title: 'Successful purchase with active card', steps: ['Use active Galaxy demo card', 'Choose Demo Coffee, amount 10.01', 'Tap Process payment'], expected: 'Exactly one approved transaction, $10.01 charge, $0.20 cash back' },
  { id: 'WAL-002', area: 'Payments', priority: 'P0', title: 'Prevent double charge on repeat request', steps: ['Tap Run duplicate-tap experiment', 'Observe two requests with the same idempotency key'], expected: 'Only one transaction is created; second attempt is deduplicated' },
  { id: 'WAL-003', area: 'Connectivity', priority: 'P0', title: 'Offline purchase fails safely', steps: ['Set network to Offline', 'Try a $12.00 purchase'], expected: 'Payment declined as OFFLINE, with no new transaction or cashback' },
  { id: 'WAL-004', area: 'Authentication', priority: 'P0', title: 'Expired session blocks payment', steps: ['Turn off Valid authentication', 'Try $12.00 purchase'], expected: 'AUTH_EXPIRED shown, no transaction or cashback' },
  { id: 'WAL-005', area: 'Cards', priority: 'P1', title: 'Locked card cannot be charged', steps: ['Select Locked Card', 'Process a $12.00 purchase'], expected: 'CARD_LOCKED shown, no charge' },
  { id: 'WAL-006', area: 'Compatibility', priority: 'P1', title: 'Unsupported device has clear fallback', steps: ['Select Unsupported profile', 'Process payment'], expected: 'UNSUPPORTED_DEVICE shown; no charge' },
  { id: 'WAL-007', area: 'Cash Back', priority: 'P1', title: 'Bonus grocery cash back calculation', steps: ['Use Galaxy demo card', 'Select Grocery merchant', 'Purchase $19.99'], expected: 'Approved charge, $1.00 cashback using 5% simulated bonus rate' },
  { id: 'WAL-008', area: 'Returns', priority: 'P1', title: 'Refund reverses rewards once', steps: ['Make a successful purchase', 'Refund its transaction', 'Try refunding again'], expected: 'Status refunded; cash back excludes refunded purchase; no extra reversal' },
  { id: 'WAL-009', area: 'Input', priority: 'P1', title: 'Reject invalid amounts', steps: ['Try 0, -5 and 1.999 separately'], expected: 'Invalid amount is rejected; history unchanged' },
  { id: 'WAL-010', area: 'Observability', priority: 'P2', title: 'Traceable errors without card secrets', steps: ['Cause an offline payment decline', 'Inspect event log and download JSON'], expected: 'Event, timestamp, and trace ID present; no complete card number or token' }
];
