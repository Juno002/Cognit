// src/lib/client-crypto.ts
// AES-GCM + PBKDF2 implementation using Web Crypto API.

export type CipherPackage = ArrayBuffer;

const SALT_LEN = 16;
const IV_LEN = 12; // recommended for AES-GCM
const PBKDF2_ITER = 200_000;
const KEY_LEN = 256;


async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt.slice(), iterations: PBKDF2_ITER, hash: "SHA-256" },
    passKey,
    { name: "AES-GCM", length: KEY_LEN },
    false, // Key is not extractable
    ["encrypt", "decrypt"]
  );
}

export async function encryptVault(plainBuffer: ArrayBuffer, password: string): Promise<CipherPackage> {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
    const key = await deriveKey(password, salt);
    const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plainBuffer);
    
    // Package: salt (16) + iv (12) + ciphertext
    const combined = new Uint8Array(salt.length + iv.length + ciphertext.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(ciphertext), salt.length + iv.length);

    return combined.buffer;
}

export async function decryptVault(pkg: CipherPackage, password: string): Promise<ArrayBuffer | null> {
    const buffer = new Uint8Array(pkg);
    const salt = buffer.slice(0, SALT_LEN);
    const iv = buffer.slice(SALT_LEN, SALT_LEN + IV_LEN);
    const ciphertext = buffer.slice(SALT_LEN + IV_LEN);

    const key = await deriveKey(password, salt);
    
    try {
        const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
        return pt;
    } catch (_err) {
        return null;
    }
}
