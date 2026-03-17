
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { Poppins } from 'next/font/google';
import { TranslationProvider } from '@/hooks/use-translation';
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { VaultProvider } from '@/context/vault/VaultProvider';
import { Toaster } from "@/components/ui/toaster";
import { PWAInstallBanner } from '@/components/pwa-install-banner';
import { OnlineIndicator } from '@/components/online-indicator';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TranslationProvider>
      <html lang="es" suppressHydrationWarning>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="icon" href="/favicon.ico" sizes="any" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <meta name="theme-color" content="#3B82F6" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        </head>
        <body className={`${poppins.variable} font-body antialiased`}>
          <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
          >
            <VaultProvider>
              {children}
              <PWAInstallBanner />
              <OnlineIndicator />
              <Toaster />
            </VaultProvider>
          </NextThemesProvider>
        </body>
      </html>
    </TranslationProvider>
  );
}
