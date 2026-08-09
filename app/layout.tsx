import './globals.css';
import type { Metadata } from 'next';
import { Inter, Lora } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const lora = Lora({ subsets: ['latin'], variable: '--font-serif', display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL('https://kamalagencies.com'),
  title: {
    default: 'Kamal Agencies | Pharmaceuticals & Healthcare Products',
    template: '%s | Kamal Agencies',
  },
  description:
    'Kamal Agencies — Wholesale Distributor of Pharmaceuticals & Healthcare Products since 1996. Browse companies, products, and applicable discounts.',
  keywords: [
    'Kamal Agencies',
    'pharmaceutical distributor',
    'wholesale medicines',
    'Ranchi pharma',
    'healthcare products',
  ],
  openGraph: {
    title: 'Kamal Agencies | Pharmaceuticals & Healthcare Products',
    description:
      'Wholesale Distributor of Pharmaceuticals & Healthcare Products since 1996.',
    type: 'website',
    siteName: 'Kamal Agencies',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0c6e9e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
