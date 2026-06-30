import { Hono } from "hono";
import { v4 as uuidv4 } from "uuid";
import { chatCompletion } from "../llm/gemini.js";
import { buildChatSystemPrompt } from "../prompts/chat.js";
import { extractFacts } from "../memory/extractor.js";
import { retrieveMemories } from "../memory/retriever.js";
import {
  applyExtractedFacts,
  clearUserMemories,
  getActiveMemories,
  getSessionMessages,
  saveMessage,
} from "../memory/store.js";

export const chatRoutes = new Hono();

chatRoutes.post("/session/new", async (c) => {
  const body = await c.req.json<{ user_id: string }>();
  if (!body.user_id?.trim()) {
    return c.json({ error: "user_id is required" }, 400);
  }
  return c.json({ session_id: uuidv4() });
});

chatRoutes.get("/memories/:user_id", (c) => {
  const userId = c.req.param("user_id");
  const memories = getActiveMemories(userId);
  return c.json({
    memories: memories.map((m) => ({
      id: m.id,
      category: m.category,
      fact: m.fact,
      updated_at: m.updated_at,
    })),
  });
});

chatRoutes.delete("/memories/:user_id", (c) => {
  const userId = c.req.param("user_id")?.trim();
  if (!userId) {
    return c.json({ error: "user_id is required" }, 400);
  }
  const deleted = clearUserMemories(userId);
  return c.json({ deleted, memories: [] });
});

chatRoutes.post("/chat", async (c) => {
  try {
    const body = await c.req.json<{
      user_id: string;
      session_id: string;
      message: string;
    }>();

    const userId = body.user_id?.trim();
    const sessionId = body.session_id?.trim();
    const message = body.message?.trim();

    if (!userId || !sessionId || !message) {
      return c.json({ error: "user_id, session_id, and message are required" }, 400);
    }

    const memories = retrieveMemories(userId);
    const history = getSessionMessages(sessionId, userId);

    saveMessage(sessionId, userId, "user", message);

    const chatMessages = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    chatMessages.push({ role: "user" as const, content: message });

    const reply = await chatCompletion(
      buildChatSystemPrompt(memories),
      chatMessages,
      { temperature: 0.5 }
    );

    saveMessage(sessionId, userId, "assistant", reply);

    const extracted = await extractFacts(message, memories);
    applyExtractedFacts(userId, extracted);

    const updatedMemories = retrieveMemories(userId);

    return c.json({
      reply,
      memories_used: memories,
      memories_updated: updatedMemories,
      extracted,
    });
  } catch (err) {
    console.error("Chat error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to process message";
    return c.json({ error: message }, 500);
  }
});