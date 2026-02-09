/**
 * 🏺 THE HIDDEN FORGE (Phase I)
 * These rituals handle the generation and management of the Master Encryption Key.
 */
import { get, set, del } from 'idb-keyval';

// 📜 Ritual 1: Generate a new 256-bit Golden Key (AES-GCM)
export async function generateMasterKey(): Promise<CryptoKey> {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, // Must be extractable so we can "wrap" it later
    ["encrypt", "decrypt"]
  );
}

// 📜 Ritual 2: Transform the Key into a portable format (JSON Web Key)
// This allows us to move the key into a "Wrapped" state for storage.
export async function exportKeyToJSON(key: CryptoKey): Promise<JsonWebKey> {
  return await window.crypto.subtle.exportKey("jwk", key);
}

// 📜 Ritual 3: Re-manifest a Key from its JSON form
export async function importKeyFromJSON(jwk: JsonWebKey): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

// 📜 Ritual 4: The Core Seal (Encryption)
export async function encryptData(
  key: CryptoKey, 
  plainText: string,
  ivToUse?: Uint8Array
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const iv = ivToUse || window.crypto.getRandomValues(new Uint8Array(12));

  // 📜 We define the algorithm parameters as a specific constant
  // This helps TypeScript understand the 'iv' is exactly what it wants.
  const algorithm: AesGcmParams = {
    name: "AES-GCM",
    iv: iv as BufferSource
  };

  const ciphertext = await window.crypto.subtle.encrypt(
    algorithm,
    key,
    data
  );

  return { 
    ciphertext, 
    iv 
  };
}

// 📜 Ritual 5: The Opening of the Jars (Decryption)
export async function decryptData(
  key: CryptoKey, 
  ciphertext: ArrayBuffer, 
  iv: Uint8Array
): Promise<string> {
  
  // We explicitly cast the parameters to AesGcmParams
  const decryptedContent = await window.crypto.subtle.decrypt(
    { 
      name: "AES-GCM", 
      iv: iv as Uint8Array 
    } as AesGcmParams,
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedContent);
}

// 📜 Ritual 6: Turn a Password into a "Shielding Key" (PBKDF2)
export async function deriveWrappingKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);

  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    passwordData,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // 🛡️ THE FINAL BANISHING: We use 'as any' to tell the compiler
  // that we take full spiritual responsibility for the salt's type.
  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any, 
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-KW", length: 256 },
    false,
    ["wrapKey", "unwrapKey"]
  );
}

// 📜 Ritual 7: Put the Golden Key inside the Sarcophagus (Wrap)
export async function wrapMasterKey(
  masterKey: CryptoKey,
  wrappingKey: CryptoKey
): Promise<ArrayBuffer> {
  return await window.crypto.subtle.wrapKey(
    "raw", // Changed from "jwk" to "raw"
    masterKey,
    wrappingKey,
    "AES-KW"
  );
}

// 📜 Ritual 8: Take the Golden Key out of the Sarcophagus (Unwrap)
export async function unwrapMasterKey(
  wrappedKey: ArrayBuffer,
  wrappingKey: CryptoKey
): Promise<CryptoKey> {
  return await window.crypto.subtle.unwrapKey(
    "raw", // Changed from "jwk" to "raw"
    wrappedKey,
    wrappingKey,
    "AES-KW",
    { name: "AES-GCM" }, // This tells the browser the raw bytes are an AES-GCM key
    true,
    ["encrypt", "decrypt"]
  );
}
// 📜 Ritual 9: Buffer to Base64 (Binary to Firestore-Friendly Text)
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// 📜 Ritual 10: Base64 to Buffer (Text back to Binary for Decryption)
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
// 📜 Ritual 11: Store the Wrapped Key in the "Hidden Drawer"
export async function saveWrappedKeyLocally(wrappedKey: ArrayBuffer): Promise<void> {
  await set('thoth_wrapped_master_key', wrappedKey);
}

// 📜 Ritual 12: Retrieve the Wrapped Key from the Drawer
export async function getWrappedKeyLocally(): Promise<ArrayBuffer | undefined> {
  return await get('thoth_wrapped_master_key');
}

// 📜 Ritual 13: Banish the Key (Security Wipe)
export async function clearLocalKey(): Promise<void> {
  await del('thoth_wrapped_master_key');
}
// 📜 Ritual 14: The Great Unsealing (String/Buffer to Master Key)
export async function unwrapKeyFromPhrase(
  phrase: string,
  wrappedMasterKeyBuffer: ArrayBuffer,
  saltBuffer: ArrayBuffer
): Promise<CryptoKey> {
  // 1. Re-derive the Wrapping Key from the phrase using the stored salt
  // Note: Ritual 6 expects Uint8Array, so we cast the saltBuffer
  const wrappingKey = await deriveWrappingKey(phrase, new Uint8Array(saltBuffer));

  // 2. Use that Wrapping Key to open the Sarcophagus
  return await unwrapMasterKey(wrappedMasterKeyBuffer, wrappingKey);
}