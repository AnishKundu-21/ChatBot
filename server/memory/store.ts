import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "../../memory.db");

export interface Memory {
  id: number;
  user_id: string;
  category: string;
  fact: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
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

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS memories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    category TEXT NOT NULL,
    fact TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_memories_user_active ON memories(user_id, is_active);
  CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
`);

export function getActiveMemories(userId: string): Memory[] {
  return db
    .prepare(
      `SELECT * FROM memories WHERE user_id = ? AND is_active = 1 ORDER BY updated_at DESC`
    )
    .all(userId) as Memory[];
}

export function getSessionMessages(
  sessionId: string,
  userId: string
): ChatMessage[] {
  return db
    .prepare(
      `SELECT * FROM messages WHERE session_id = ? AND user_id = ? ORDER BY id ASC`
    )
    .all(sessionId, userId) as ChatMessage[];
}

export function saveMessage(
  sessionId: string,
  userId: string,
  role: "user" | "assistant",
  content: string
): void {
  db.prepare(
    `INSERT INTO messages (session_id, user_id, role, content) VALUES (?, ?, ?, ?)`
  ).run(sessionId, userId, role, content);
}

export function clearUserMemories(userId: string): number {
  const result = db
    .prepare(`DELETE FROM memories WHERE user_id = ?`)
    .run(userId);
  return result.changes;
}

export function applyExtractedFacts(
  userId: string,
  facts: ExtractedFact[]
): void {
  const supersede = db.prepare(
    `UPDATE memories SET is_active = 0, updated_at = datetime('now')
     WHERE user_id = ? AND category = ? AND is_active = 1`
  );
  const insert = db.prepare(
    `INSERT INTO memories (user_id, category, fact) VALUES (?, ?, ?)`
  );

  const apply = db.transaction((items: ExtractedFact[]) => {
    for (const item of items) {
      if (item.durability !== "durable") continue;

      if (item.action === "supersede") {
        supersede.run(userId, item.category);
      }

      insert.run(userId, item.category, item.fact);
    }
  });

  apply(facts);
}