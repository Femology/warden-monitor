import { CONFIG } from './config';

export interface Summary {
  totalEvaluations: number;
  totalAllowed: number;
  totalStepUp: number;
  byReason: { amountExceeded: number; newRecipient: number; velocityExceeded: number };
}

export interface TimeseriesPoint {
  date: string;
  allowed: number;
  stepUp: number;
}

export interface WalletEvent {
  recipient: string | null;
  amount: string | null;
  decision: 'Allow' | 'RequireStepUp';
  reason: string | null;
  timestamp: string;
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${CONFIG.indexerUrl}${path}`, { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Indexer request to ${path} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function getSummary(): Promise<Summary> {
  return getJson<Summary>('/summary');
}

export function getTimeseries(days = 30): Promise<TimeseriesPoint[]> {
  return getJson<TimeseriesPoint[]>(`/timeseries?days=${days}`);
}

export function getWalletEvents(wallet: string, limit = 50): Promise<WalletEvent[]> {
  return getJson<WalletEvent[]>(`/wallet/${encodeURIComponent(wallet)}/events?limit=${limit}`);
}
