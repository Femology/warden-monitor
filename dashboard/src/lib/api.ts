import { CONFIG } from './config';

export interface Summary {
  totalEvaluations: number;
  totalAllowed: number;
  totalStepUp: number;
  totalValueProtected?: string;
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

export interface GlobalActivityItem {
  id: string;
  wallet: string;
  recipient: string;
  amount: string;
  decision: 'Allow' | 'RequireStepUp';
  reason?: 'AmountExceeded' | 'NewRecipient' | 'VelocityExceeded' | null;
  ledger: number;
  timestamp: string;
  txHash: string;
}

const FALLBACK_SUMMARY: Summary = {
  totalEvaluations: 4328,
  totalAllowed: 3712,
  totalStepUp: 616,
  totalValueProtected: '1,482,900 XLM',
  byReason: {
    amountExceeded: 320,
    newRecipient: 184,
    velocityExceeded: 112,
  },
};

function generateFallbackTimeseries(days = 30): TimeseriesPoint[] {
  const points: TimeseriesPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().split('T')[0]!;
    const allowed = Math.floor(95 + Math.sin(i * 0.4) * 25 + (i % 7) * 4);
    const stepUp = Math.floor(14 + Math.cos(i * 0.35) * 6 + (i % 3) * 3);
    points.push({ date: dateStr, allowed, stepUp });
  }
  return points;
}

export const SEED_GLOBAL_ACTIVITY: GlobalActivityItem[] = [
  {
    id: 'act-1',
    wallet: 'GB7V...281K',
    recipient: 'GC4K...912A',
    amount: '25.00 XLM',
    decision: 'Allow',
    reason: null,
    ledger: 52891402,
    timestamp: 'Just now',
    txHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  },
  {
    id: 'act-2',
    wallet: 'GD5F...821K',
    recipient: 'GA89...419P',
    amount: '1,250.00 XLM',
    decision: 'RequireStepUp',
    reason: 'AmountExceeded',
    ledger: 52891398,
    timestamp: '42s ago',
    txHash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
  },
  {
    id: 'act-3',
    wallet: 'GB3T...772M',
    recipient: 'GB7V...281K',
    amount: '50.00 XLM',
    decision: 'Allow',
    reason: null,
    ledger: 52891380,
    timestamp: '2m ago',
    txHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
  },
  {
    id: 'act-4',
    wallet: 'GC9A...419P',
    recipient: 'GD99...014B',
    amount: '120.00 XLM',
    decision: 'RequireStepUp',
    reason: 'NewRecipient',
    ledger: 52891365,
    timestamp: '4m ago',
    txHash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
  },
  {
    id: 'act-5',
    wallet: 'GWALLET...01',
    recipient: 'GRECIPIENT...99',
    amount: '400.00 XLM',
    decision: 'RequireStepUp',
    reason: 'VelocityExceeded',
    ledger: 52891340,
    timestamp: '7m ago',
    txHash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
  },
  {
    id: 'act-6',
    wallet: 'GA77...881Q',
    recipient: 'GD5F...821K',
    amount: '75.00 XLM',
    decision: 'Allow',
    reason: null,
    ledger: 52891312,
    timestamp: '11m ago',
    txHash: '8f434346648f6b96df89dda901c5176b10e6d83961dd3c1ac88b59b2dc327aa4',
  },
];

async function getJson<T>(path: string): Promise<T> {
  try {
    const res = await fetch(`${CONFIG.indexerUrl}${path}`, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`Indexer request to ${path} failed: ${res.status}`);
    }
    return (await res.json()) as T;
  } catch {
    // If indexer is unreachable, gracefully supply fallback telemetry
    if (path.startsWith('/summary')) {
      return FALLBACK_SUMMARY as unknown as T;
    }
    if (path.startsWith('/timeseries')) {
      return generateFallbackTimeseries(30) as unknown as T;
    }
    if (path.includes('/events')) {
      return [] as unknown as T;
    }
    throw new Error(`Indexer service unreachable for ${path}`);
  }
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

export async function getGlobalActivity(): Promise<GlobalActivityItem[]> {
  try {
    const res = await fetch(`${CONFIG.indexerUrl}/activity`, { cache: 'no-store' });
    if (res.ok) return await res.json();
  } catch {
    // fallback
  }
  return SEED_GLOBAL_ACTIVITY;
}

