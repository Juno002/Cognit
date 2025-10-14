"use client";

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/pwa';

export default function RegisterSW() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
