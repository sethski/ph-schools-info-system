// =============================================================================
// MINDI — Client-Side Encryption
// AES-256-GCM with PBKDF2 key derivation.
// Sensitive node content is encrypted BEFORE leaving the browser.
// Firebase only ever stores ciphertext for personal/sensitive regions.
//
// Key derivation: PBKDF2(password, salt, 310000 iterations, SHA-256)
// Encryption: AES-256-GCM with random 96-bit IV per operation
// =============================================================================

const PBKDF2_ITERATIONS = 310_000; // OWASP 2024 recommendation
const KEY_LENGTH = 256; // bits
const SALT = process.env.NEXT_PUBLIC_ENCRYPTION_SALT!;

// In-memory key cache — cleared on logout
let cachedKey: CryptoKey | null = null;

/**
 * Derives an AES-GCM key from the user's password.
 * Called once on login; key held in memory only — never persisted.
 */
export async function deriveEncryptionKey(password: string): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  const encoder = new TextEncoder();
  const saltBuffer = encoder.encode(SALT);

  // Import raw password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive the AES-GCM key
  cachedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false, // non-extractable
    ['encrypt', 'decrypt']
  );

  return cachedKey;
}

/**
 * Clears the in-memory key on logout.
 * Must be called in the logout flow — Trust Covenant requirement.
 */
export function clearEncryptionKey(): void {
  cachedKey = null;
}

/**
 * Encrypts plaintext string using AES-256-GCM.
 * Returns a base64-encoded string: IV (12 bytes) + ciphertext
 */
export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(plaintext)
  );

  // Prepend IV to ciphertext for storage
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a base64-encoded AES-GCM ciphertext.
 * Expects format: IV (12 bytes) + ciphertext
 */
export async function decrypt(encoded: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );

  return new TextDecoder().decode(plaintext);
}

/**
 * Returns true if a node's region should always be encrypted.
 * Personal region is always encrypted regardless of user settings.
 */
export function shouldEncrypt(
  region: string,
  encryptionEnabled: boolean
): boolean {
  if (region === 'personal') return true;
  return encryptionEnabled;
}
