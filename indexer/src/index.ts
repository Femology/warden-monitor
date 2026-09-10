import { rpc } from '@stellar/stellar-sdk';
import { CONFIG } from './config.js';
import { openDb } from './db.js';
import { pollOnce, startPolling } from './poller.js';
import { createHttpServer } from './routes.js';

const db = openDb(CONFIG.dbPath);
const server = new rpc.Server(CONFIG.rpcUrl);

pollOnce(db, server).catch((error) => {
  console.error('[warden-monitor] initial poll failed, will retry on the next interval:', error);
});
startPolling(db, server);

const httpServer = createHttpServer(db);
httpServer.listen(CONFIG.httpPort, () => {
  console.log(`[warden-monitor] indexer API listening on :${CONFIG.httpPort}`);
});
