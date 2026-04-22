
"use client";

let registrationStarted = false;

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  if (registrationStarted) return;
  registrationStarted = true;

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

  if (document.readyState === 'complete') {
    void register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}
