/**
 * Crypto helpers for the two runtimes this app authenticates in.
 *
 * `middleware.ts` runs on the Edge, where there is no `node:crypto` and no
 * `Buffer`; the route handler runs on Node. Everything here is Web Crypto plus
 * `atob`/`btoa`, which both runtimes have, so one implementation serves both and
 * the constant-time compare is not copied between them.
 *
 * Ported from the No Room for Racism campaign site, which runs the same gate.
 */

/**
 * SHA-256 of a UTF-8 string, via Web Crypto — the Edge runtime has no node:crypto.
 *
 * The `<ArrayBuffer>` parameter is load-bearing: bare `Uint8Array` widens to
 * `Uint8Array<ArrayBufferLike>`, which TypeScript will not accept as a
 * `BufferSource` because it might be backed by a `SharedArrayBuffer`.
 */
export async function sha256(value: string): Promise<Uint8Array<ArrayBuffer>> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return new Uint8Array(digest);
}

/**
 * Constant-time compare, because `===` is not one. String equality bails at the
 * first differing byte, so the time it takes to fail measures how much of the
 * secret the caller already has — enough to walk a password out one character at
 * a time over many requests.
 *
 * Hashing first makes both operands exactly 32 bytes, so the loop count cannot
 * leak the real password's length. XOR-accumulating and only testing at the end
 * means every byte is always examined, whatever the inputs.
 */
export async function secretsMatch(supplied: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256(supplied), sha256(expected)]);

  let difference = 0;
  for (let i = 0; i < a.length; i += 1) {
    difference |= a[i] ^ b[i];
  }
  return difference === 0;
}

/**
 * base64url, not base64: the output goes in a cookie value, where `+`, `/` and
 * `=` are either reserved or invite re-encoding bugs on the way through a proxy.
 */
function toBase64Url(binary: string): string {
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** One character per byte — `btoa`'s input is latin1, not UTF-16. */
function binaryFromBytes(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

export function base64UrlFromBytes(bytes: Uint8Array): string {
  return toBase64Url(binaryFromBytes(bytes));
}

export function base64UrlFromText(value: string): string {
  return base64UrlFromBytes(new TextEncoder().encode(value));
}

/**
 * Returns null rather than throwing for malformed input. A hostile caller
 * controls the cookie this decodes, and an uncaught throw in middleware is a 500
 * where the honest answer is "your session is not valid".
 */
export function textFromBase64Url(value: string): string | null {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  // atob rejects an unpadded string whose length is not a multiple of 4.
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  try {
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return null;
  }
}

/** Lowercase hex, for the session nonce. */
export function randomHex(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
