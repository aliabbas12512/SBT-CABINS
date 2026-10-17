import { getSettings, dbEnabled } from "@/lib/designer/store";
import { provider } from "@/lib/assistant/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public designer configuration (rules, rates, specs, templates) + feature flags. */
export async function GET() {
  const { settings, source } = await getSettings();
  return Response.json({ settings, source, db: dbEnabled(), ai: provider() !== null }, { headers: { "cache-control": "no-store" } });
}
