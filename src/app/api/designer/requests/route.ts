import { z } from "zod";
import { sanitizeDesign } from "@/lib/designer/design";
import { layoutDesign } from "@/lib/designer/layout";
import { estimate } from "@/lib/designer/pricing";
import { DbError, getSettings, rpc } from "@/lib/designer/store";
import { isService, validateCustomer } from "@/lib/designer/customer";

/**
 * Quotation requests from the designer.
 * POST stores the design with a price estimate computed here on the server
 * (never trusted from the browser). GET returns one request to the customer
 * who holds its reference and access key.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({ lang: z.enum(["en", "ar"]), design: z.unknown(), customer: z.unknown(), service: z.unknown().optional() });

export async function POST(req: Request) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  const { settings } = await getSettings();
  const design = sanitizeDesign(body.design, settings);
  if (!design) return Response.json({ error: "bad_request" }, { status: 400 });
  if (layoutDesign(design, settings.rules).issues.some((i) => i.level === "error")) return Response.json({ error: "invalid_design" }, { status: 400 });
  const { customer, errors } = validateCustomer(body.customer);
  if (Object.keys(errors).length) return Response.json({ error: "invalid_customer", fields: errors }, { status: 400 });
  const service = isService(body.service) ? body.service : undefined;
  const est = estimate(design, settings, service);
  try {
    const out = await rpc<{ ref: string; key: string }>("designer_submit", {
      p: { lang: body.lang, design, customer, service: service ?? null, estimate: { ...est, settingsUpdatedAt: settings.updatedAt } },
    });
    return Response.json(out);
  } catch (e) {
    const err = e instanceof DbError ? e : new DbError("db_error");
    return Response.json({ error: err.code }, { status: err.status });
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ref = url.searchParams.get("ref") ?? "";
  const key = url.searchParams.get("key") ?? "";
  if (!/^SBT-D-\d{8}-[A-F0-9]{6}$/.test(ref) || !/^[a-f0-9]{32}$/.test(key)) return Response.json({ error: "bad_request" }, { status: 400 });
  try {
    const out = await rpc<unknown>("designer_get_request", { p_ref: ref, p_key: key });
    if (!out) return Response.json({ error: "not_found" }, { status: 404 });
    return Response.json(out, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    const err = e instanceof DbError ? e : new DbError("db_error");
    return Response.json({ error: err.code }, { status: err.status });
  }
}
