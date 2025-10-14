
// src/lib/client-crypto.ts
// AES-GCM + PBKDF2 implementation using Web Crypto API.
// Brutal y suficiente para proteger datos frente a curiosos con el teléfono desbloqueado.

export type CipherPackage = {
  version: 1;
  salt: string; // base64
  iv: string;   // base64
  iterations: number;
  ciphertext: string; // base64
};

function toBase64(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function fromBase64(s: string) {
  const bin = atob(s);
  const len = bin.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

async function generateSalt(bytes = 16) {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return toBase64(b.buffer);
}

async function deriveKey(password: string, saltB64: string, iterations = 200_000) {
  const enc = new TextEncoder();
  const passKey = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: fromBase64(saltB64), iterations, hash: "SHA-256" },
    passKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return key;
}

export async function encryptJSON(data: any, password: string, iterations = 200_000): Promise<CipherPackage> {
  const salt = await generateSalt(16);
  const key = await deriveKey(password, salt, iterations);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const plaintext = enc.encode(JSON.stringify(data));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return {
    version: 1,
    salt,
    iv: toBase64(iv.buffer),
    iterations,
    ciphertext: toBase64(ciphertext)
  };
}

export async function decryptJSON(pkg: CipherPackage, password: string) {
  const key = await deriveKey(password, pkg.salt, pkg.iterations);
  try {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromBase64(pkg.iv) }, key, fromBase64(pkg.ciphertext));
    const dec = new TextDecoder();
    return JSON.parse(dec.decode(pt));
  } catch (err) {
    throw new Error("Invalid password or corrupted data");
  }
}
