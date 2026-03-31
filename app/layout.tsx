import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SMM Panelim - Otomatik Teslimat',
  description: 'Hızlı ve Güvenilir SMM Hizmetleri',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
