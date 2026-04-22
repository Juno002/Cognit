"use client";

import React from 'react';
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { TranslationProvider } from '@/hooks/use-translation';
import { VaultProvider } from '@/context/vault/VaultProvider';
import { Toaster } from "@/components/ui/toaster";
import { PWAInstallBanner } from '@/components/pwa-install-banner';
import { OnlineIndicator } from '@/components/online-indicator';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TranslationProvider>
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
    </TranslationProvider>
  );
}
