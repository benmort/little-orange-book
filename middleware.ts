/**
 * A shared password in front of everything, while the booklet is unlaunched —
 * see lib/site-gate.ts for why it works the way it does.
 *
 * With `SITE_PASSWORD` unset (the launched state) the work is one environment
 * read and a pass-through, and this file can be deleted outright once the gate
 * is retired for good.
 *
 * Edge runtime constraints: middleware runs on the Edge, so there is no
 * `node:crypto` and no `Buffer`. Base64 comes from `atob` and the digests from
 * Web Crypto (see lib/edge-crypto.ts), which is why the checks are async.
 */
import { NextResponse, type NextRequest } from "next/server";

import { isSiteGateEnabled, SITE_GATE_COOKIE, verifySiteGateToken } from "@/lib/site-gate";

/**
 * Everything except Next's build output and static asset requests. Static files
 * are excluded because they are the fonts and the cover media — gating them
 * would mean the password page could not render itself, and none of them carry
 * the copy the gate exists to keep private.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico|mp4|webm|pdf|txt|xml|webmanifest|woff|woff2|ttf|otf)$).*)",
  ],
};

/** Where an unauthenticated visitor is shown the password form. */
const SITE_GATE_PATH = "/enter";

/** Reachable without the password — otherwise there is no way in. */
const OPEN_PATHS = [/^\/enter$/, /^\/api\/site-access$/];

/**
 * `no-store` keeps any CDN or browser cache from holding a gate decision, and
 * `noindex` keeps a gated response out of search results even while it refuses.
 */
function privateHeaders(contentType?: string): Headers {
  const headers = new Headers({
    "cache-control": "no-store",
    "x-robots-tag": "noindex, nofollow",
  });
  if (contentType) headers.set("content-type", contentType);
  return headers;
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  if (!isSiteGateEnabled()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (OPEN_PATHS.some((pattern) => pattern.test(pathname))) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SITE_GATE_COOKIE)?.value;
  if (token && (await verifySiteGateToken(token))) {
    return NextResponse.next();
  }

  // An API route gets a machine-readable refusal. Rewriting it to an HTML page
  // would hand a fetch() a chunk of markup to choke on.
  if (pathname.startsWith("/api/")) {
    return new NextResponse(JSON.stringify({ error: "Site access required" }), {
      status: 401,
      headers: privateHeaders("application/json; charset=utf-8"),
    });
  }

  // Rewrite, not redirect: the address bar keeps the URL the visitor asked for,
  // so signing in and reloading lands them where they were going. It also means
  // no `?next=` parameter to validate, and therefore no open-redirect surface.
  const url = request.nextUrl.clone();
  url.pathname = SITE_GATE_PATH;
  url.search = "";

  const response = NextResponse.rewrite(url);
  privateHeaders().forEach((value, key) => response.headers.set(key, value));
  return response;
}
