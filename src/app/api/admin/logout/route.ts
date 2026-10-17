import { cookies } from "next/headers";
import { ADMIN_COOKIE, adminToken, sameOrigin } from "@/lib/designer/admin";
import { rpc } from "@/lib/designer/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return Response.json({ error: "forbidden" }, { status: 403 });
  const token = await adminToken();
  if (token) await rpc("admin_logout", { p_token: token }).catch(() => null);
  (await cookies()).delete(ADMIN_COOKIE);
  return Response.json({ ok: true });
}
