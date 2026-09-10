export const CONFIG = {
  indexerUrl: process.env.NEXT_PUBLIC_INDEXER_URL ?? 'http://localhost:4000',
  contractId: process.env.NEXT_PUBLIC_WARDEN_CONTRACT_ID ?? 'CBFQ752LFNC57U4KWDAEKNU43PLBWJ7M2B4ZRYUMCWL62JHJNUYJVMB5',
  rpcUrl: process.env.NEXT_PUBLIC_WARDEN_RPC_URL ?? 'https://soroban-testnet.stellar.org',
  networkPassphrase:
    process.env.NEXT_PUBLIC_WARDEN_NETWORK_PASSPHRASE ?? 'Test SDF Network ; September 2015',
  referenceAssetDecimals: 7,
} as const;
