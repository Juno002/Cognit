
"use client";

import React, { useEffect } from 'react';
import Journal from '@/components/Journal';
import { SetupVault } from '@/components/auth/SetupVault';
import { UnlockModal } from '@/components/auth/UnlockModal';
import { useVault } from '@/context/vault/VaultProvider';
import { registerServiceWorker } from '@/lib/pwa';
import { JournalProvider } from '@/hooks/use-cbt-journal';

export default function Home() {
    const { locked, hasVault } = useVault();
    
    useEffect(() => {
      registerServiceWorker();
    }, []);
    
    if (!hasVault) {
        return <SetupVault />;
    }
    
    if (locked) {
        return <UnlockModal />;
    }

    return (
        <JournalProvider>
            <Journal />
        </JournalProvider>
    );
}
