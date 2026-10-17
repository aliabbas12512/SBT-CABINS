import type { Service } from "./pricing";

/** Contact details a customer gives with a quotation request. */
export type Customer = { name: string; company?: string; phone: string; email?: string; location?: string; notes?: string };

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, n) : "");

export type CustomerErrors = Partial<Record<keyof Customer, "required" | "invalid">>;

export function validateCustomer(raw: unknown): { customer: Customer; errors: CustomerErrors } {
  const o = (raw ?? {}) as Record<string, unknown>;
  const customer: Customer = {
    name: clip(o.name, 80),
    company: clip(o.company, 80) || undefined,
    phone: clip(o.phone, 24),
    email: clip(o.email, 120) || undefined,
    location: clip(o.location, 120) || undefined,
    notes: typeof o.notes === "string" ? o.notes.replace(/[<>]/g, " ").trim().slice(0, 1000) || undefined : undefined,
  };
  const errors: CustomerErrors = {};
  if (!customer.name) errors.name = "required";
  if (!customer.phone) errors.phone = "required";
  else if (!/^\+?[\d\s-]{7,20}$/.test(customer.phone)) errors.phone = "invalid";
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email)) errors.email = "invalid";
  return { customer, errors };
}

export const isService = (v: unknown): v is Service => v === "delivery" || v === "installation" || v === "both" || v === "none";
