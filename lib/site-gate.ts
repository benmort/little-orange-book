/**
 * The site-wide password gate, while the booklet is unlaunched.
 *
 * Same mechanism as the No Room for Racism campaign site — a styled password
 * form and a signed cookie, not a browser basic-auth dialog — and it reads the
 * same `SITE_PASSWORD` variable, so one shared password covers both.
 *
 * ## The gate is opt-in, and that is deliberate
 *
 * `SITE_PASSWORD` set turns the gate on. Unset means the site is public, which
 * is how it ships at launch: you open the booklet by deleting one environment
 * variable, not by editing code. The trade-off is real and worth naming — a typo
 * in the variable name on Vercel leaves the site readable rather than shut. It is
 * accepted because the alternative (fail closed) means a missing variable takes
 * the *public* campaign site down at exactly the moment it matters most.
 *
 * ## No second secret
 *
 * The cookie is signed with a key derived from `SITE_PASSWORD` itself rather than
 * a separate signing secret. One value to manage instead of two, and rotating the
 * password invalidates every live session for free. The cookie never carries the
 * password — only an HMAC over the expiry and a nonce.
 *
 * ## The password is never in this repo
 *
 * This repository is public. `SITE_PASSWORD` belongs in `.env.local` (git-ignored)
 * and in the Vercel project's environment variables, and nowhere else.
 */
import {
  base64UrlFromBytes,
  base64UrlFromText,
  randomHex,
  secretsMatch,
  sha256,
  textFromBase64Url,
} from "./edge-crypto";

export const SITE_GATE_COOKIE = "lob_site_access";

export const SITE_GATE_SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

/**
 * Domain separation on the key derivation. The HMAC key is not the raw password,
 * so a cookie minted here cannot be replayed against the other site that signs
 * with the same shared password.
 */
const KEY_DOMAIN = "lob-site-gate:v1:";

/**
 * Trimmed, because the common way this variable gets set is a paste into the
 * Vercel dashboard and a stray space would lock everyone out of a gate whose
 * password looks correct. A whitespace-only value counts as unset.
 *
 * No minimum-length check: a length rule that silently *disables* a security
 * control when the password is too short is worse than no rule.
 */
export function sitePassword(): string | null {
  const trimmed = (process.env.SITE_PASSWORD ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function isSiteGateEnabled(): boolean {
  return sitePassword() !== null;
}

interface SessionPayload {
  /** Epoch milliseconds. */
  exp: number;
  /** Makes two sessions issued in the same millisecond different tokens. */
  nonce: string;
}

async function signPayload(payload: string, password: string): Promise<string> {
  const keyMaterial = await sha256(`${KEY_DOMAIN}${password}`);
  const key = await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return base64UrlFromBytes(new Uint8Array(signature));
}

/** Throws when the gate is off — callers check `isSiteGateEnabled()` first. */
export async function createSiteGateToken(nowMs: number = Date.now()): Promise<string> {
  const password = sitePassword();
  if (!password) {
    throw new Error("SITE_PASSWORD must be set before a site-access session can be issued");
  }

  const payload: SessionPayload = {
    exp: nowMs + SITE_GATE_SESSION_MAX_AGE_SECONDS * 1000,
    nonce: randomHex(8),
  };
  const encoded = base64UrlFromText(JSON.stringify(payload));
  return `${encoded}.${await signPayload(encoded, password)}`;
}

/**
 * Signature first, then expiry. Verifying the signature before parsing the
 * payload means untrusted JSON never reaches `JSON.parse` unauthenticated.
 */
export async function verifySiteGateToken(
  token: string,
  nowMs: number = Date.now(),
): Promise<boolean> {
  const password = sitePassword();
  if (!password) return false;

  // Split on the LAST dot: neither the signature nor a base64url payload can
  // contain one, but this stays correct if the payload format ever grows.
  const separatorIndex = token.lastIndexOf(".");
  if (separatorIndex <= 0) return false;

  const encoded = token.slice(0, separatorIndex);
  const suppliedSignature = token.slice(separatorIndex + 1);
  if (!suppliedSignature) return false;

  const expectedSignature = await signPayload(encoded, password);
  if (!(await secretsMatch(suppliedSignature, expectedSignature))) return false;

  const json = textFromBase64Url(encoded);
  if (json === null) return false;

  try {
    const parsed = JSON.parse(json) as Partial<SessionPayload>;
    return typeof parsed.exp === "number" && parsed.exp > nowMs;
  } catch {
    return false;
  }
}

export async function verifySitePassword(supplied: string): Promise<boolean> {
  const password = sitePassword();
  if (!password) return false;
  return secretsMatch(supplied, password);
}

/**
 * Hand-rolled rather than pulled from a cookie library: this has to be callable
 * from Edge middleware, and `cookie` is not a dependency of this repo.
 *
 * `HttpOnly` keeps the session out of reach of any script on the page, `Lax`
 * still sends it on a top-level navigation (so a shared link works on the first
 * click), and `Secure` is omitted in development because localhost is not HTTPS.
 */
function serialiseCookie(value: string, maxAgeSeconds: number): string {
  return [
    `${SITE_GATE_COOKIE}=${value}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
    process.env.NODE_ENV === "production" ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");
}

export function siteGateSetCookie(token: string): string {
  return serialiseCookie(token, SITE_GATE_SESSION_MAX_AGE_SECONDS);
}

export function siteGateClearCookie(): string {
  return serialiseCookie("", 0);
}
