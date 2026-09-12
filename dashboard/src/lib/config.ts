export const CONFIG = {
  indexerUrl: process.env.NEXT_PUBLIC_INDEXER_URL ?? 'http://localhost:4000',
  contractId: process.env.NEXT_PUBLIC_WARDEN_CONTRACT_ID ?? 'CD25U7GYDNB7XUBEEN3OKZK2LY62ANSUJJPQ6SF2Y6DHQ5SQ3F7LSVUF',
  rpcUrl: process.env.NEXT_PUBLIC_WARDEN_RPC_URL ?? 'https://soroban-testnet.stellar.org',
  networkPassphrase:
    process.env.NEXT_PUBLIC_WARDEN_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015',
  referenceAssetDecimals: 7,
} as const;
