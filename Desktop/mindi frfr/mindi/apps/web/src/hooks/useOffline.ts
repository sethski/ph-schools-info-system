// =============================================================================
// MINDI Phase 1 — useOffline Hook
// Detects online/offline state. Registers service worker for PWA caching.
// Offline: serve cached graph from IndexedDB + local vector search.
// =============================================================================
'use client';

import { useState, useEffect } from 'react';

export function useOffline() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);

    // Register service worker for PWA offline caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(reg => console.info('[Mindi] SW registered:', reg.scope))
        .catch(err => console.warn('[Mindi] SW registration failed:', err));
    }

    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return { isOnline };
}
