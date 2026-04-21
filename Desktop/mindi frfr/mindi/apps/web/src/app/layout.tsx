import type { Metadata, Viewport } from 'next';
import { Syne, DM_Sans } from 'next/font/google';
import './globals.css';
import AmbientBackground from '../components/AmbientBackground';

const syne   = Syne({ subsets: ['latin'], variable: '--font-syne', display: 'swap', weight: ['400','600','700','800'] });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans', display: 'swap', weight: ['300','400','500','600'] });

export const metadata: Metadata = {
  title: 'Mindi — Your Adaptive AI Companion',
  description: 'A loyal extension of your mind. Mindi learns how you think, write, and create.',
  manifest: '/manifest.json',
  icons: { apple: '/icons/icon-192.png' },
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Mindi' },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`}>
      <body className="bg-[#0a0a0f] text-white antialiased font-sans min-h-screen">
        <AmbientBackground />
        {children}
      </body>
    </html>
  );
}
