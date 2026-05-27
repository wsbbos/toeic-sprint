// src/utils/crypto.js

/**
 * Gets the cryptography provider dynamically across browser and server/Node environments
 * @returns {Crypto} The crypto instance
 */
function getCrypto() {
  if (typeof window !== 'undefined' && window.crypto) {
    return window.crypto;
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    return globalThis.crypto;
  }
  throw new Error("Crypto API not supported in this environment");
}

/**
 * Generates a random 16-byte hexadecimal salt
 * @returns {string} Hex representation of the salt
 */
export function generateSalt() {
  const crypto = getCrypto();
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computes a secure SHA-256 salted hash of a password
 * @param {string} password Plaintext password
 * @param {string} salt Hex salt
 * @returns {Promise<string>} Hex SHA-256 hash
 */
export async function hashPassword(password, salt) {
  const crypto = getCrypto();
  const saltedMsg = salt + ":" + password;
  const msgBuffer = new TextEncoder().encode(saltedMsg);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

