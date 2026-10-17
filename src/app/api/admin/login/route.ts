import { cookies } from "next/headers";
import { ADMIN_COOKIE, fail, sameOrigin } from "@/lib/designer/admin";
import { dbEnabled, rpc } from "@/lib/designer/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  return Response.json({ db: dbEnabled(), loggedIn: Boolean(token) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "forbidden" }, { status: 403 });
  let password = "";
  try {
    password = String(((await req.json()) as { password?: unknown }).password ?? "").slice(0, 200);
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  try {
    const token = await rpc<string | null>("admin_login", { p_password: password });
    if (!token) return Response.json({ error: "invalid_password" }, { status: 401 });
    (await cookies()).set(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 12 * 60 * 60,
    });
    return Response.json({ ok: true });
  } catch (e) {
    return fail(e);
  }
}
