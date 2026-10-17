import { cookies } from "next/headers";
import { ADMIN_COOKIE, rpc, withAdmin } from "@/lib/designer/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { current?: unknown; next?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const res = await withAdmin(req, (token) => rpc("admin_change_password", { p_token: token, p_old: String(body.current ?? "").slice(0, 200), p_new: String(body.next ?? "").slice(0, 200) }));
  if (res.ok) (await cookies()).delete(ADMIN_COOKIE);
  return res;
}
