/**
 * Which AI provider the server uses: Google Gemini (GEMINI_API_KEY) or
 * Anthropic Claude (ANTHROPIC_API_KEY). When both keys are set, Claude is
 * used unless AI_PROVIDER=gemini. Returns null when no key is configured.
 */
export type Provider = "gemini" | "anthropic";

export function provider(): Provider | null {
  const gemini = Boolean(process.env.GEMINI_API_KEY);
  const anthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const wanted = process.env.AI_PROVIDER?.toLowerCase();
  if (wanted === "gemini" && gemini) return "gemini";
  if ((wanted === "anthropic" || wanted === "claude") && anthropic) return "anthropic";
  return anthropic ? "anthropic" : gemini ? "gemini" : null;
}
