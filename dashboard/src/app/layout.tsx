import type { Metadata } from 'next';
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-bricolage',
  display: 'swap',
});

const instrument = Instrument_Sans({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-instrument',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: 'variable',
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Warden Monitor',
  description: 'Read-only observability for warden-contract: step-up rates, reasons, and per-wallet history.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bricolage.variable} ${instrument.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
