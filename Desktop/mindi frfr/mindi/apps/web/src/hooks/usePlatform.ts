// =============================================================================
// MINDI — usePlatform Hook
// Detects runtime environment: web, desktop (Electron), mobile (Capacitor).
// Used to gate platform-specific features and UI adaptations.
// =============================================================================

'use client';

import { useState, useEffect } from 'react';

export type Platform = 'web' | 'desktop' | 'mobile';

export interface PlatformInfo {
  platform: Platform;
  isDesktop: boolean;
  isMobile: boolean;
  isWeb: boolean;
  isCapacitor: boolean;
  isElectron: boolean;
  // Feature support
  supportsFileDialog: boolean;
  supportsHaptics: boolean;
  supportsVoice: boolean;
}

export function usePlatform(): PlatformInfo {
  const [info, setInfo] = useState<PlatformInfo>({
    platform: 'web',
    isDesktop: false,
    isMobile: false,
    isWeb: true,
    isCapacitor: false,
    isElectron: false,
    supportsFileDialog: false,
    supportsHaptics: false,
    supportsVoice: false,
  });

  useEffect(() => {
    const isElectron = typeof window !== 'undefined' &&
      'mindiDesktop' in window &&
      (window as unknown as { mindiDesktop: { isDesktop: boolean } }).mindiDesktop?.isDesktop === true;

    const isCapacitor = typeof window !== 'undefined' &&
      'Capacitor' in window &&
      (window as unknown as { Capacitor: { isNativePlatform: () => boolean } }).Capacitor?.isNativePlatform();

    const isMobileViewport = typeof window !== 'undefined' &&
      window.matchMedia('(max-width: 768px)').matches;

    const platform: Platform = isElectron ? 'desktop' : isCapacitor ? 'mobile' : 'web';

    const supportsVoice = typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

    setInfo({
      platform,
      isDesktop: isElectron,
      isMobile: isCapacitor || isMobileViewport,
      isWeb: !isElectron && !isCapacitor,
      isCapacitor: !!isCapacitor,
      isElectron,
      supportsFileDialog: isElectron,
      supportsHaptics: !!isCapacitor,
      supportsVoice,
    });
  }, []);

  return info;
}
