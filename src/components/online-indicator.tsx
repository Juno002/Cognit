'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { Wifi, WifiOff, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

export function OnlineIndicator() {
  const { isOnline, wasOffline } = useOnlineStatus();
  const { t } = useTranslation();

  if (isOnline && !wasOffline) return null;

  return (
    <div className="fixed bottom-20 left-1/2 z-40 -translate-x-1/2 animate-in slide-in-from-bottom-3">
      {!isOnline ? (
        <div className="flex items-center gap-2 rounded-full bg-yellow-500/90 px-4 py-2 text-sm font-semibold text-yellow-900 shadow-lg backdrop-blur-sm">
          <WifiOff className="h-4 w-4" />
          {t('offline_mode')}
        </div>
      ) : wasOffline ? (
        <div className="flex items-center gap-2 rounded-full bg-green-500/90 px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-sm">
          <CheckCircle className="h-4 w-4" />
          {t('connected_mode')}
        </div>
      ) : null}
    </div>
  );
}
