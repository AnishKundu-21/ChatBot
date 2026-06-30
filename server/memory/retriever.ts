import { getActiveMemories } from "./store.js";

export function retrieveMemories(userId: string): string[] {
  const memories = getActiveMemories(userId);
  return memories.map((m) => m.fact);
}