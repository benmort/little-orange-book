import {
  createSiteGateToken,
  isSiteGateEnabled,
  siteGateClearCookie,
  siteGateSetCookie,
  verifySitePassword,
} from "@/lib/site-gate";

/**
 * Sign in and out of the password gate — see lib/site-gate.ts for the mechanism
 * and middleware.ts for where the session is enforced.
 *
 * POST takes the shared password and, on a match, sets the signed session
 * cookie. DELETE clears it, so a shared laptop can be signed out without going
 * near developer tools.
 *
 * This route is one of the two the middleware lets through unauthenticated, for
 * the obvious reason that it is how you authenticate. It therefore answers a
 * hostile caller directly: the password compare is constant-time, the response
 * says only whether the password was right, and no reply names an environment
 * variable or reports configuration state.
 *
 * There is no rate limit. On serverless functions an in-memory counter is
 * per-instance and trivially sidestepped by concurrency, so it would read as a
 * control while providing close to none. The protection is the entropy of the
 * shared password.
 */

// The gate decision depends on a cookie and an env var, so it can never be
// prerendered or cached.
export const dynamic = "force-dynamic";

function headers(): Headers {
  return new Headers({
    "cache-control": "no-store",
    "x-robots-tag": "noindex, nofollow",
    "content-type": "application/json; charset=utf-8",
  });
}

function json(body: unknown, status: number, setCookie?: string): Response {
  const h = headers();
  if (setCookie) h.set("set-cookie", setCookie);
  return new Response(JSON.stringify(body), { status, headers: h });
}

export async function POST(request: Request): Promise<Response> {
  // Reported as a wrong password rather than as configuration state: a stranger
  // learns nothing about how this deployment is set up.
  if (!isSiteGateEnabled()) {
    return json({ error: "That password is not right.", field: "password" }, 401);
  }

  let supplied = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    if (typeof body.password === "string") supplied = body.password;
  } catch {
    return json({ error: "Expected a JSON body." }, 400);
  }

  if (!(await verifySitePassword(supplied))) {
    return json({ error: "That password is not right.", field: "password" }, 401);
  }

  return json({ ok: true }, 200, siteGateSetCookie(await createSiteGateToken()));
}

export async function DELETE(): Promise<Response> {
  return json({ ok: true }, 200, siteGateClearCookie());
}
