const API_URL = "https://openrouter.ai/api/v1/chat/completions";

type MessageContent =
  | string
  | null
  | Array<{ type?: string; text?: string }>;

interface OpenRouterMessage {
  content?: MessageContent;
  reasoning?: string | null;
  refusal?: string | null;
}

interface OpenRouterChoice {
  message?: OpenRouterMessage;
  finish_reason?: string | null;
}

interface OpenRouterResponse {
  choices?: OpenRouterChoice[];
  error?: { message?: string };
}

function extractMessageContent(message: OpenRouterMessage | undefined): string {
  if (!message) return "";

  const { content } = message;
  if (typeof content === "string" && content.trim()) {
    return content.trim();
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part) => (typeof part.text === "string" ? part.text : ""))
      .join("")
      .trim();
    if (text) return text;
  }

  if (typeof message.refusal === "string" && message.refusal.trim()) {
    return message.refusal.trim();
  }

  return "";
}

async function callOpenRouter(body: Record<string, unknown>): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set in .env");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "Memory Chatbot",
    },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as OpenRouterResponse;

  if (!response.ok) {
    const detail = data.error?.message ?? JSON.stringify(data);
    throw new Error(`OpenRouter API error (${response.status}): ${detail}`);
  }

  return data;
}

export async function chatCompletion(
  systemPrompt: string,
  messages: { role: "user" | "assistant"; content: string }[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const model = process.env.OPENROUTER_MODEL;
  if (!model) {
    throw new Error("OPENROUTER_MODEL is not set in .env");
  }

  const baseMaxTokens = options?.maxTokens ?? 1024;
  const attempts = [
    {
      max_tokens: baseMaxTokens,
      reasoning: { effort: "none" },
    },
    {
      max_tokens: Math.max(baseMaxTokens * 2, 2048),
      reasoning: { effort: "minimal", exclude: true },
    },
  ];

  let lastFinishReason: string | undefined;

  for (const attempt of attempts) {
    const data = await callOpenRouter({
      model,
      temperature: options?.temperature ?? 0.3,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      ...attempt,
    });

    const choice = data.choices?.[0];
    lastFinishReason = choice?.finish_reason ?? undefined;
    const content = extractMessageContent(choice?.message);

    if (content) {
      return content;
    }
  }

  throw new Error(
    `OpenRouter returned an empty response (model: ${model}, finish_reason: ${lastFinishReason ?? "unknown"}). ` +
      `Reasoning models like gpt-oss-120b:free often hit this — try OPENROUTER_MODEL=openrouter/free or google/gemma-4-26b-a4b-it:free in .env.`
  );
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