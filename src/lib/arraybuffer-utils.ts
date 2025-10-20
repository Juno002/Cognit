// src/lib/arraybuffer-utils.ts

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  // Guard clause to prevent execution on server
  if (typeof window === 'undefined') {
    return '';
  }

  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}


export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (typeof window === 'undefined') {
    // Return an empty ArrayBuffer or handle as an error on the server
    return new ArrayBuffer(0);
  }
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function sha256Base64(buffer: ArrayBuffer): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
      return '';
  }
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  return arrayBufferToBase64(hashBuffer);
}
