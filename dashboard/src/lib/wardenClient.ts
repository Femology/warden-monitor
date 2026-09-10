import { WardenClient } from 'warden-sdk';
import { CONFIG } from './config';

/**
 * Live reads only -- getPolicy/getVelocity here are always current, never
 * served from the indexer's cache. The wallet drill-down page reads through
 * this on every load, deliberately separate from the historical /wallet/:
 * address/events endpoint served by the indexer.
 */
export const wardenClient = new WardenClient({
  contractId: CONFIG.contractId,
  rpcUrl: CONFIG.rpcUrl,
  networkPassphrase: CONFIG.networkPassphrase,
  referenceAssetDecimals: CONFIG.referenceAssetDecimals,
});
