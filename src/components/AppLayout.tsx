
"use client";

import { useEffect, type ReactNode } from 'react';
import Script from 'next/script';
import { ThemeProvider } from "next-themes";
import { useTranslation } from '@/hooks/use-translation.tsx';
import { Toaster } from "@/components/ui/toaster"
import { PWAInstallBanner } from '@/components/pwa-install-banner';
import { OnlineIndicator } from '@/components/online-indicator';

interface AppLayoutProps {
  children: ReactNode;
  poppinsClassName: string;
}

export default function AppLayout({ children, poppinsClassName }: AppLayoutProps) {
  const { locale, t } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = t('metadata_title');
    const appNameMeta = document.querySelector('meta[name="application-name"]');
    if (appNameMeta) appNameMeta.setAttribute('content', t('metadata_title'));
    const appleTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
    if (appleTitleMeta) appleTitleMeta.setAttribute('content', t('metadata_title'));
    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) descriptionMeta.setAttribute('content', t('metadata_description'));
  }, [locale, t]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head />
      <body className={poppinsClassName}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <PWAInstallBanner />
          <OnlineIndicator />
        </ThemeProvider>
        <Script id="service-worker-registration">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(registration => {
                  console.log('SW registered: ', registration);
                }).catch(registrationError => {
                  console.log('SW registration failed: ', registrationError);
                });
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
