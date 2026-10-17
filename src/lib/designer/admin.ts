import { cookies } from "next/headers";
import { DbError, rpc } from "./store";

export const ADMIN_COOKIE = "sbt_admin";

/** Rejects cross-site requests (the cookie is SameSite=Strict as well). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.method === "GET";
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

export async function adminToken(): Promise<string | null> {
  const v = (await cookies()).get(ADMIN_COOKIE)?.value;
  return v && /^[a-f0-9]{64}$/.test(v) ? v : null;
}

export function fail(e: unknown) {
  const err = e instanceof DbError ? e : new DbError("internal");
  return Response.json({ error: err.code }, { status: err.status });
}

/** Runs an admin RPC with the session token from the cookie. */
export async function withAdmin<T>(req: Request, run: (token: string) => Promise<T>): Promise<Response> {
  if (!sameOrigin(req)) return Response.json({ error: "forbidden" }, { status: 403 });
  const token = await adminToken();
  if (!token) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const out = await run(token);
    return Response.json(out ?? { ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return fail(e);
  }
}

export { rpc };
