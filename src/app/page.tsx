
"use client";

import React from 'react';
import Journal from '@/components/Journal';
import { SetupVault } from '@/components/auth/SetupVault';
import { UnlockModal } from '@/components/auth/UnlockModal';
import { useVault } from '@/context/vault/VaultProvider';
import { registerServiceWorker } from '@/lib/pwa';

export default function Home() {
    const { locked, hasVault } = useVault();
    
    // Register PWA Service Worker
    if (typeof window !== 'undefined') {
      registerServiceWorker();
    }
    
    if (!hasVault) {
        return <SetupVault />;
    }
    
    if (locked) {
        return <UnlockModal />;
    }

    return (
        <Journal />
    );
}
