// =============================================================================
// MINDI — useEncryption Hook
// Manages the in-memory AES-GCM key lifecycle.
// Key derived on demand, wiped on logout.
// =============================================================================

'use client';

import { useState, useCallback } from 'react';
import {
  deriveEncryptionKey,
  clearEncryptionKey,
  encrypt,
  decrypt,
  shouldEncrypt,
} from '../lib/crypto/encrypt';
import type { NodeRegion } from '../../../../shared/types';

export function useEncryption() {
  const [keyReady, setKeyReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Call after login to derive and cache the key in memory
  const initKey = useCallback(async (password: string) => {
    try {
      await deriveEncryptionKey(password);
      setKeyReady(true);
      setError(null);
    } catch (err) {
      setError('Failed to initialize encryption key');
      throw err;
    }
  }, []);

  // Called on logout — clears in-memory key
  const clearKey = useCallback(() => {
    clearEncryptionKey();
    setKeyReady(false);
  }, []);

  // Encrypt content if the region requires it
  const encryptIfNeeded = useCallback(
    async (
      content: string,
      region: NodeRegion,
      encryptionEnabled: boolean,
      password: string
    ): Promise<{ content: string; isEncrypted: boolean }> => {
      if (!shouldEncrypt(region, encryptionEnabled)) {
        return { content, isEncrypted: false };
      }
      const key = await deriveEncryptionKey(password);
      const encrypted = await encrypt(content, key);
      return { content: encrypted, isEncrypted: true };
    },
    []
  );

  // Decrypt content if encrypted
  const decryptIfNeeded = useCallback(
    async (
      content: string,
      isEncrypted: boolean,
      password: string
    ): Promise<string> => {
      if (!isEncrypted) return content;
      const key = await deriveEncryptionKey(password);
      return decrypt(content, key);
    },
    []
  );

  return {
    keyReady,
    error,
    initKey,
    clearKey,
    encryptIfNeeded,
    decryptIfNeeded,
  };
}
