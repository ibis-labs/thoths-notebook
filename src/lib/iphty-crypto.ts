/**
 * 🔮 IPHTY LINK — THE CIPHER OF TWIN FLAMES
 *
 * Implements ECDH P-256 key exchange for scribe-to-scribe channels.
 *
 * Each scribe holds two keys:
 *   — PUBLIC KEY:  shared openly; others use it to co-derive the shared secret
 *   — PRIVATE KEY: sealed under the scribe's master vault key
 *
 * When two scribes link, ECDH allows each to independently derive
 * the SAME shared AES-GCM key — without it ever crossing the void.
 * This is the magic: the secret is computed, never transmitted.
 */

import { encryptData, decryptData, base64ToBuffer, bufferToBase64 } from './crypto';

// ─── Ritual 1: Forge a fresh ECDH key pair for a new Iphty scribe ────────────
export async function generateIphtyKeyPair(): Promise<CryptoKeyPair> {
  return window.crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,          // extractable — we need to export/wrap the private key
    ['deriveKey']
  );
}

// ─── Ritual 2: Export the public key as a portable JSON string ───────────────
export async function exportIphtyPublicKey(publicKey: CryptoKey): Promise<string> {
  const jwk = await window.crypto.subtle.exportKey('jwk', publicKey);
  return JSON.stringify(jwk);
}

// ─── Ritual 3: Reconstruct a public key from its stored JSON form ─────────────
export async function importIphtyPublicKey(publicKeyJson: string): Promise<CryptoKey> {
  const jwk = JSON.parse(publicKeyJson) as JsonWebKey;
  return window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false, // public key need not be extractable once imported
    []     // no usages — public keys are used only as params in deriveKey
  );
}

// ─── Ritual 4: Seal the private key inside the scribe's master vault ──────────
export async function wrapIphtyPrivateKey(
  privateKey: CryptoKey,
  masterKey: CryptoKey
): Promise<{ wrappedKey: string; iv: string }> {
  const jwk = await window.crypto.subtle.exportKey('jwk', privateKey);
  const { ciphertext, iv } = await encryptData(masterKey, JSON.stringify(jwk));
  return {
    wrappedKey: bufferToBase64(ciphertext),
    iv: bufferToBase64(iv.buffer as ArrayBuffer),
  };
}

// ─── Ritual 5: Unseal the private key from the master vault ──────────────────
export async function unwrapIphtyPrivateKey(
  wrappedKey: string,
  ivB64: string,
  masterKey: CryptoKey
): Promise<CryptoKey> {
  const cipherBuf = base64ToBuffer(wrappedKey);
  const iv = new Uint8Array(base64ToBuffer(ivB64));
  const jwkString = await decryptData(masterKey, cipherBuf, iv);
  const jwk = JSON.parse(jwkString) as JsonWebKey;
  return window.crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey']
  );
}

// ─── Ritual 6: The Twin-Flame Convergence ─────────────────────────────────────
/**
 * Derive the shared conversation key from two ECDH keys.
 *
 * Both scribes run this independently — Alice uses (alicePrivate, bobPublic)
 * and Bob uses (bobPrivate, alicePublic) — and they arrive at the identical key.
 * The shared secret never travels across the network. This is pure ECDH magic.
 */
export async function deriveSharedConversationKey(
  myPrivateKey: CryptoKey,
  theirPublicKey: CryptoKey
): Promise<CryptoKey> {
  return window.crypto.subtle.deriveKey(
    { name: 'ECDH', public: theirPublicKey },
    myPrivateKey,
    { name: 'AES-GCM', length: 256 },
    false,              // not extractable — lives only in memory
    ['encrypt', 'decrypt']
  );
}
