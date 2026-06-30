const API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

interface GeminiPart {
  text?: string;
}

interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
  finishReason?: string;
}

interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: { message?: string; code?: number };
}

function extractText(data: GeminiResponse): string {
  const parts = data.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p) => p.text ?? "")
    .join("")
    .trim();
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(
  model: string,
  apiKey: string,
  body: Record<string, unknown>,
  attempt = 0
): Promise<GeminiResponse> {
  const url = `${API_BASE}/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as GeminiResponse;

  if (response.status === 429 && attempt < 3) {
    const delay = Math.min(2000 * 2 ** attempt, 10000);
    await sleep(delay);
    return callGemini(model, apiKey, body, attempt + 1);
  }

  if (!response.ok) {
    const detail = data.error?.message ?? JSON.stringify(data);
    throw new Error(`Gemini API error (${response.status}): ${detail}`);
  }

  return data;
}

export async function chatCompletion(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
  options?: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL ?? "gemini-2.0-flash";

  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set in .env — get one free at https://aistudio.google.com/apikey"
    );
  }

  const body: Record<string, unknown> = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature: options?.temperature ?? 0.3,
      maxOutputTokens: options?.maxTokens ?? 1024,
      ...(options?.jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };

  const data = await callGemini(model, apiKey, body);
  const text = extractText(data);

  if (!text) {
    const reason = data.candidates?.[0]?.finishReason ?? "unknown";
    throw new Error(
      `Gemini returned an empty response (model: ${model}, finish_reason: ${reason})`
    );
  }

  return text;
}

export function parseJsonFromLLM<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : text.trim();

  try {
    return JSON.parse(candidate) as T;
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      return JSON.parse(candidate.slice(start, end + 1)) as T;
    }
    throw new Error(`Failed to parse JSON from LLM response: ${text}`);
  }
}