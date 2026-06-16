import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'trace',
  description: 'Proof-of-work project management for engineering teams',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
