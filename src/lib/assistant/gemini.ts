/**
 * Minimal Google Gemini client (REST, server-side only) for the cabin
 * consultant. Returns the model's JSON answer, or null when Gemini blocked
 * the request or returned nothing usable.
 */

export type ChatTurn = { role: "user" | "assistant"; text: string };

export class GeminiError extends Error {
  constructor(public status: number) {
    super(`Gemini API error ${status}`);
  }
}

const API_BASE = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";

/** JSON schema of the reply, in Gemini's responseSchema format. */
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    reply: { type: "STRING" },
    product_codes: { type: "ARRAY", items: { type: "STRING" } },
    answered_from_catalogue: { type: "BOOLEAN" },
  },
  required: ["reply", "product_codes", "answered_from_catalogue"],
  propertyOrdering: ["reply", "product_codes", "answered_from_catalogue"],
};

type GeminiResponse = {
  promptFeedback?: { blockReason?: string };
  candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[];
};

export async function askGemini(opts: { apiKey: string; model: string; system: string; turns: ChatTurn[]; schema?: object; maxTokens?: number }): Promise<unknown | null> {
  const res = await fetch(`${API_BASE}/models/${encodeURIComponent(opts.model)}:generateContent`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": opts.apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: opts.system }] },
      contents: opts.turns.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.text }] })),
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: opts.schema ?? RESPONSE_SCHEMA,
        temperature: 0.3,
        maxOutputTokens: opts.maxTokens ?? 2048,
      },
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) throw new GeminiError(res.status);
  const data = (await res.json()) as GeminiResponse;
  if (data.promptFeedback?.blockReason) return null;
  const cand = data.candidates?.[0];
  if (!cand || (cand.finishReason && cand.finishReason !== "STOP")) return null;
  const text = (cand.content?.parts ?? [])
    .filter((p) => !p.thought && typeof p.text === "string")
    .map((p) => p.text)
    .join("");
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
