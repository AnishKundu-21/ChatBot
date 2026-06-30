import { ObjectId } from "mongodb";
import { getDb } from "./db.js";

export interface Memory {
  id: string;
  user_id: string;
  category: string;
  fact: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface ExtractedFact {
  category: string;
  fact: string;
  durability: "durable" | "transient";
  action: "add" | "supersede";
}

interface MemoryDoc {
  _id: ObjectId;
  user_id: string;
  category: string;
  fact: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

interface MessageDoc {
  _id: ObjectId;
  session_id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: Date;
}

function toMemory(doc: MemoryDoc): Memory {
  return {
    id: doc._id.toHexString(),
    user_id: doc.user_id,
    category: doc.category,
    fact: doc.fact,
    is_active: doc.is_active,
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
  };
}

function toMessage(doc: MessageDoc): ChatMessage {
  return {
    id: doc._id.toHexString(),
    session_id: doc.session_id,
    user_id: doc.user_id,
    role: doc.role,
    content: doc.content,
    created_at: doc.created_at.toISOString(),
  };
}

export async function getActiveMemories(userId: string): Promise<Memory[]> {
  const docs = await getDb()
    .collection<MemoryDoc>("memories")
    .find({ user_id: userId, is_active: true })
    .sort({ updated_at: -1 })
    .toArray();

  const seen = new Set<string>();
  const deduped: MemoryDoc[] = [];

  for (const doc of docs) {
    const key = memoryKey(doc.category, doc.fact);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(doc);
  }

  return deduped.map(toMemory);
}

export async function getSessionMessages(
  sessionId: string,
  userId: string
): Promise<ChatMessage[]> {
  const docs = await getDb()
    .collection<MessageDoc>("messages")
    .find({ session_id: sessionId, user_id: userId })
    .sort({ created_at: 1 })
    .toArray();

  return docs.map(toMessage);
}

export async function saveMessage(
  sessionId: string,
  userId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  await getDb().collection<MessageDoc>("messages").insertOne({
    session_id: sessionId,
    user_id: userId,
    role,
    content,
    created_at: new Date(),
  });
}

export async function clearUserMemories(userId: string): Promise<number> {
  const result = await getDb()
    .collection("memories")
    .deleteMany({ user_id: userId });
  return result.deletedCount;
}

function normalizeFact(fact: string): string {
  return fact.toLowerCase().trim().replace(/\s+/g, " ");
}

function memoryKey(category: string, fact: string): string {
  return `${category}::${normalizeFact(fact)}`;
}

export async function applyExtractedFacts(
  userId: string,
  facts: ExtractedFact[]
): Promise<void> {
  const durableFacts = facts.filter((f) => f.durability === "durable");
  if (durableFacts.length === 0) return;

  const memories = getDb().collection<MemoryDoc>("memories");
  const now = new Date();

  const activeDocs = await memories
    .find({ user_id: userId, is_active: true })
    .toArray();

  const activeKeys = new Set(
    activeDocs.map((m) => memoryKey(m.category, m.fact))
  );

  for (const item of durableFacts) {
    if (item.action === "supersede") {
      await memories.updateMany(
        { user_id: userId, category: item.category, is_active: true },
        { $set: { is_active: false, updated_at: now } }
      );

      for (const key of activeKeys) {
        if (key.startsWith(`${item.category}::`)) {
          activeKeys.delete(key);
        }
      }
    }

    const key = memoryKey(item.category, item.fact);
    if (activeKeys.has(key)) {
      continue;
    }

    await memories.insertOne({
      user_id: userId,
      category: item.category,
      fact: item.fact,
      is_active: true,
      created_at: now,
      updated_at: now,
    });

    activeKeys.add(key);
  }
}