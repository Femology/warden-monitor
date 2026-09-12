export const CONFIG = {
  indexerUrl: process.env.NEXT_PUBLIC_INDEXER_URL ?? 'http://localhost:4000',
  contractId: process.env.NEXT_PUBLIC_WARDEN_CONTRACT_ID ?? 'CD5QU2E6LOKFAZFESIZSAA4IENH5SZHJVU4Y6532WNZSXPZDYRKEEVUW',
  rpcUrl: process.env.NEXT_PUBLIC_WARDEN_RPC_URL ?? 'https://soroban-testnet.stellar.org',
  networkPassphrase:
    process.env.NEXT_PUBLIC_WARDEN_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015',
  referenceAssetDecimals: 7,
} as const;
