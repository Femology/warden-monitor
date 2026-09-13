'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { WalletDrilldown } from '@/components/WalletDrilldown';

export default function WalletPage() {
  const params = useParams<{ address: string }>();
  const address = decodeURIComponent(params.address);
  const [copied, setCopied] = useState(false);

  function copyAddress() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen bg-ink-900 text-mist-100 selection:bg-clear/30">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-30 border-b border-ink-700/80 bg-ink-900/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-mist-400 transition-colors hover:text-mist-100"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Global Activity Stream</span>
          </Link>

          <div className="flex items-center gap-3 text-xs font-mono text-mist-400">
            <span className="hidden sm:inline">Network: Stellar Testnet</span>
            <span className="rounded-full border border-ink-700 bg-ink-800 px-3 py-1">
              Read-Only Observer
            </span>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex max-w-5xl flex-col gap-8 px-6 py-12">
        {/* Wallet Details Header */}
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-mist-400">
                Wallet Deep-Dive
              </span>
              <h1 className="address-mono mt-1 break-all font-display text-2xl font-bold text-mist-100 sm:text-3xl">
                {address}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyAddress}
                className="flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-800 px-3.5 py-2 text-xs font-medium text-mist-100 transition-colors hover:border-edge hover:bg-ink-700"
              >
                {copied ? (
                  <>
                    <svg className="h-3.5 w-3.5 text-clear" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Copy Address</span>
                  </>
                )}
              </button>

              <a
                href={`https://stellar.expert/explorer/testnet/account/${address}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-800 px-3.5 py-2 text-xs font-medium text-mist-400 transition-colors hover:border-edge hover:text-mist-100"
              >
                <span>Stellar Expert</span>
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          <div className="rounded-lg border border-ink-700/80 bg-ink-800/40 p-3.5 text-xs text-mist-400">
            <span className="font-semibold text-mist-100">Live & Indexed Hybrid Telemetry: </span>
            Current policy and velocity are read live directly from Soroban contract storage. Full timeline of state transitions, velocity resets, and recovery events are reconstructed from indexed event streams.
          </div>
        </header>

        {/* Wallet Drilldown Core Component */}
        <WalletDrilldown wallet={address} />
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-ink-700/80 py-8 text-center text-xs text-mist-400">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6">
          <span>Warden Monitor Subsystem • Autonomous Self-Custody Security</span>
          <span className="font-mono text-[11px]">Strict Read-Only Guarantee</span>
        </div>
      </footer>
    </div>
  );
}
