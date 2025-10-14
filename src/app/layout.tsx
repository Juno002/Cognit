
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Poppins } from 'next/font/google';
import { TranslationProvider } from '@/hooks/use-translation.tsx';
import AppLayout from '@/components/AppLayout';
import RegisterSW from '@/components/RegisterSW';
import { VaultProvider } from '@/context/vault/VaultProvider';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Cognit λ',
  description: 'Open-source CBT & ERP Journal App, 100% private and offline-first.',
  manifest: '/manifest.json',
  applicationName: 'Cognit λ',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Cognit λ',
  },
  icons: {
    shortcut: '/favicon.ico',
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', type: 'image/png' },
      { url: '/icons/apple-touch-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
  }
};

export const viewport: Viewport = {
  themeColor: '#111a24',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TranslationProvider>
      <VaultProvider>
        <AppLayout poppinsClassName={`${poppins.variable} font-body antialiased`}>
          <RegisterSW />
          {children}
        </AppLayout>
      </VaultProvider>
    </TranslationProvider>
  );
}
