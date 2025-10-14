
"use client";

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('✅ Service Worker registrado:', registration.scope);
    } catch (error) {
      console.error('❌ Error al registrar Service Worker:', error);
    }
  };

  window.addEventListener('load', register);
}
