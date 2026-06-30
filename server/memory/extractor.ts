import { chatCompletion, parseJsonFromLLM } from "../llm/gemini.js";
import { EXTRACTION_SYSTEM_PROMPT } from "../prompts/extract.js";
import type { ExtractedFact } from "./store.js";

interface ExtractionResult {
  facts: ExtractedFact[];
}

export async function extractFacts(
  userMessage: string,
  existingMemories: string[]
): Promise<ExtractedFact[]> {
  const context =
    existingMemories.length > 0
      ? `Existing known facts:\n${existingMemories.join("\n")}\n\n`
      : "";

  const response = await chatCompletion(
    EXTRACTION_SYSTEM_PROMPT,
    [
      {
        role: "user",
        content: `${context}New user message:\n"${userMessage}"\n\nExtract durable facts.`,
      },
    ],
    { temperature: 0.1, maxTokens: 1024, jsonMode: true }
  );

  const parsed = parseJsonFromLLM<ExtractionResult>(response);
  return parsed.facts ?? [];
}