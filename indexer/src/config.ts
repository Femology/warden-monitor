export const CONFIG = {
  contractId: process.env.WARDEN_CONTRACT_ID ?? 'CD25U7GYDNB7XUBEEN3OKZK2LY62ANSUJJPQ6SF2Y6DHQ5SQ3F7LSVUF',
  rpcUrl: process.env.WARDEN_RPC_URL ?? 'https://soroban-testnet.stellar.org',
  networkPassphrase: process.env.WARDEN_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015',
  /** The ledger warden-contract was deployed at -- the indexer's starting point. */
  deployLedger: Number(process.env.WARDEN_DEPLOY_LEDGER ?? 4635844),
  pollIntervalMs: Number(process.env.WARDEN_POLL_INTERVAL_MS ?? 10_000),
  dbPath: process.env.DB_PATH ?? './warden-monitor.db',
  httpPort: Number(process.env.PORT ?? 4000),
} as const;
