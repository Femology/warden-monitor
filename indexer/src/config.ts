export const CONFIG = {
  contractId: process.env.WARDEN_CONTRACT_ID ?? 'CD5QU2E6LOKFAZFESIZSAA4IENH5SZHJVU4Y6532WNZSXPZDYRKEEVUW',
  rpcUrl: process.env.WARDEN_RPC_URL ?? 'https://soroban-testnet.stellar.org',
  networkPassphrase: process.env.WARDEN_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015',
  /** The ledger warden-contract was deployed at -- the indexer's starting point. */
  deployLedger: Number(process.env.WARDEN_DEPLOY_LEDGER ?? 4637276),
  pollIntervalMs: Number(process.env.WARDEN_POLL_INTERVAL_MS ?? 10_000),
  dbPath: process.env.DB_PATH ?? './warden-monitor.db',
  httpPort: Number(process.env.PORT ?? 4000),
} as const;
