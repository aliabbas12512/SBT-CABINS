import { normalizeSettings } from "@/lib/designer/config";
import { rpc, withAdmin } from "@/lib/designer/admin";
import { clearSettingsCache } from "@/lib/designer/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Saves the rate card, rules, specifications and templates (validated). */
export async function PUT(req: Request) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const { updatedAt: _ignored, ...data } = normalizeSettings(raw);
  void _ignored;
  return withAdmin(req, async (token) => {
    const saved = await rpc<unknown>("admin_save_settings", { p_token: token, p_data: data });
    clearSettingsCache();
    return { settings: normalizeSettings(saved) };
  });
}
