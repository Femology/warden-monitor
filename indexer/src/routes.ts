import { createServer, type Server } from 'node:http';
import type { DatabaseSync } from 'node:sqlite';
import { getSummary, getTimeseries, getWalletEvents } from './queries.js';

function json(res: import('node:http').ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(body));
}

/**
 * Read-only, no exceptions: GET /summary, GET /timeseries, GET
 * /wallet/:address/events. No endpoint here accepts a write, a policy
 * change, or anything resembling an override -- this service has no path
 * back into warden-contract, anywhere, in any component.
 */
export function createHttpServer(db: DatabaseSync): Server {
  return createServer((req, res) => {
    if (req.method !== 'GET') {
      json(res, 405, { error: 'This service is read-only. Only GET is supported.' });
      return;
    }

    const url = new URL(req.url ?? '/', 'http://localhost');

    if (url.pathname === '/summary') {
      json(res, 200, getSummary(db));
      return;
    }

    if (url.pathname === '/timeseries') {
      const days = Number(url.searchParams.get('days') ?? '30');
      json(res, 200, getTimeseries(db, Number.isFinite(days) && days > 0 ? days : 30));
      return;
    }

    const walletMatch = url.pathname.match(/^\/wallet\/([^/]+)\/events$/);
    if (walletMatch) {
      const wallet = decodeURIComponent(walletMatch[1] as string);
      const limit = Number(url.searchParams.get('limit') ?? '50');
      json(res, 200, getWalletEvents(db, wallet, Number.isFinite(limit) && limit > 0 ? limit : 50));
      return;
    }

    json(res, 404, { error: 'Not found.' });
  });
}
