/**
 * Robust Base64 encoding/decoding for both Node.js and Browser environments,
 * properly handling UTF-8 characters.
 */

export const encodeBase64 = (str: string): string => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  } else {
    // Browser environment
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    let binary = '';
    const bytes = new Uint8Array(data);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
};

export const decodeBase64 = (base64: string): string => {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(base64, 'base64').toString('utf-8');
  } else {
    // Browser environment
    const binary = window.atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder();
    return decoder.decode(bytes);
  }
};
