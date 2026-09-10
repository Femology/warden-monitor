'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { WalletDrilldown } from '@/components/WalletDrilldown';

export default function WalletPage() {
  const params = useParams<{ address: string }>();
  const address = decodeURIComponent(params.address);

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-6 py-16">
      <Link href="/" className="text-sm text-mist-400 underline decoration-edge underline-offset-2 hover:text-mist-100">
        Back to summary
      </Link>
      <h1 className="address-mono break-all font-display text-2xl font-semibold text-mist-100">
        {address}
      </h1>
      <WalletDrilldown wallet={address} />
    </main>
  );
}
