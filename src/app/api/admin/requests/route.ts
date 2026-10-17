import { z } from "zod";
import { rpc, withAdmin } from "@/lib/designer/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return withAdmin(req, (token) => rpc<unknown[]>("admin_list_requests", { p_token: token, p_limit: 300 }));
}

const Line = z.object({ label: z.string().max(200), qty: z.number().min(0).max(100000), unit: z.number().min(0).max(100_000_000), amount: z.number().min(0).max(1_000_000_000) });
const Patch = z.object({
  ref: z.string().regex(/^SBT-D-\d{8}-[A-F0-9]{6}$/),
  status: z.enum(["new", "reviewing", "quoted", "approved", "rejected", "closed"]).optional(),
  adminNotes: z.string().max(4000).optional(),
  approved: z
    .object({
      lines: z.array(Line).min(1).max(60),
      subtotal: z.number().min(0),
      vatRate: z.number().min(0).max(1),
      vat: z.number().min(0),
      total: z.number().min(0),
      deliveryTime: z.string().max(300).optional(),
      paymentTerms: z.string().max(600).optional(),
      validityDays: z.number().int().min(1).max(365).optional(),
      notes: z.string().max(2000).optional(),
      approvedBy: z.string().max(80).optional(),
    })
    .nullable()
    .optional(),
});

export async function PATCH(req: Request) {
  let p: z.infer<typeof Patch>;
  try {
    p = Patch.parse(await req.json());
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  if (p.approved) {
    // Recompute the totals so a mistyped figure cannot end up on an approved quotation.
    const sub = Math.round(p.approved.lines.reduce((a, l) => a + l.amount, 0) * 100) / 100;
    const vat = Math.round(sub * p.approved.vatRate * 100) / 100;
    p.approved = { ...p.approved, subtotal: sub, vat, total: Math.round((sub + vat) * 100) / 100 };
  }
  const { ref, ...patch } = p;
  return withAdmin(req, (token) => rpc("admin_update_request", { p_token: token, p_ref: ref, p_patch: patch }));
}
