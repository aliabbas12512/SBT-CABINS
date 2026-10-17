import { DEFAULT_SETTINGS, normalizeSettings, type DesignerSettings } from "./config";

/**
 * Server-side access to the Supabase database (REST RPC). The URL and key
 * come from server environment variables and never reach the browser.
 * Without them the designer runs on the bundled defaults.
 */

const URL_ = process.env.SUPABASE_URL?.replace(/\/+$/, "");
const KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

export const dbEnabled = () => Boolean(URL_ && KEY);

export class DbError extends Error {
  constructor(
    public code: string,
    public status = 500,
  ) {
    super(code);
  }
}

export async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!URL_ || !KEY) throw new DbError("no_db", 503);
  let res: Response;
  try {
    res = await fetch(`${URL_}/rest/v1/rpc/${fn}`, {
      method: "POST",
      headers: { apikey: KEY, authorization: `Bearer ${KEY}`, "content-type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new DbError("db_unreachable", 503);
  }
  if (!res.ok) {
    let msg = "db_error";
    try {
      const j = (await res.json()) as { message?: string };
      if (j.message && /^[a-z_]{3,40}$/.test(j.message)) msg = j.message;
    } catch {
      /* ignore */
    }
    const status = msg === "unauthorized" ? 401 : msg === "rate_limited" || msg === "locked" ? 429 : msg === "not_found" ? 404 : res.status >= 500 ? 502 : 400;
    throw new DbError(msg, status);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

let cache: { at: number; value: DesignerSettings } | null = null;

/** Current settings: database when configured (cached 30 s), else bundled defaults. */
export async function getSettings(fresh = false): Promise<{ settings: DesignerSettings; source: "db" | "defaults" }> {
  if (!dbEnabled()) return { settings: DEFAULT_SETTINGS, source: "defaults" };
  if (!fresh && cache && Date.now() - cache.at < 30_000) return { settings: cache.value, source: "db" };
  try {
    const raw = await rpc<unknown>("designer_get_settings");
    const value = normalizeSettings(raw);
    cache = { at: Date.now(), value };
    return { settings: value, source: "db" };
  } catch {
    return { settings: cache?.value ?? DEFAULT_SETTINGS, source: cache ? "db" : "defaults" };
  }
}

export function clearSettingsCache() {
  cache = null;
}
