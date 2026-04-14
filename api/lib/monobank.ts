/** Monobank StatementItem as described in the official API docs. */
export interface StatementItem {
  id: string;
  time: number; // unix timestamp
  description: string;
  mcc: number;
  originalMcc: number;
  hold: boolean;
  amount: number; // in smallest currency unit (kopecks for UAH)
  operationAmount: number;
  currencyCode: number;
  commissionRate: number;
  cashbackAmount: number;
  balance: number;
  comment?: string;
  receiptId?: string;
  invoiceId?: string;
  counterEdrpou?: string;
  counterIban?: string;
  counterName?: string;
}

/** Payload structure sent by Monobank webhook (type=StatementItem). */
export interface MonobankWebhookPayload {
  type: string;
  data?: {
    account?: string;
    statementItem?: StatementItem;
  };
}

/** Convert unix seconds to JS Date. */
export function unixToDate(unix: number): Date {
  return new Date(unix * 1000);
}

/** Convert kopecks to UAH (two-decimal numeric). */
export function kopecksToUah(kopecks: number): number {
  return kopecks / 100;
}
