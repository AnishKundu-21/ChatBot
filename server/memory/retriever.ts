import { getActiveMemories } from "./store.js";

export async function retrieveMemories(userId: string): Promise<string[]> {
  const memories = await getActiveMemories(userId);
  return memories.map((m) => m.fact);
}