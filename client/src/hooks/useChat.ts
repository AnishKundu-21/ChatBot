import { useCallback, useEffect, useState } from "react";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface Memory {
  id: number;
  category: string;
  fact: string;
  updated_at: string;
}

export function useChat(userId: string) {
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newSessionBanner, setNewSessionBanner] = useState(false);
  const [clearMemoryBanner, setClearMemoryBanner] = useState(false);

  const fetchMemories = useCallback(async (uid: string) => {
    const res = await fetch(`/api/memories/${encodeURIComponent(uid)}`);
    if (!res.ok) return;
    const data = await res.json();
    setMemories(data.memories ?? []);
  }, []);

  const startSession = useCallback(
    async (uid: string, showBanner = false) => {
      const res = await fetch("/api/session/new", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid }),
      });
      if (!res.ok) throw new Error("Failed to start session");
      const data = await res.json();
      setSessionId(data.session_id);
      setMessages([]);
      setNewSessionBanner(showBanner);
      await fetchMemories(uid);
    },
    [fetchMemories]
  );

  useEffect(() => {
    if (userId) {
      startSession(userId, false).catch(console.error);
    }
  }, [userId, startSession]);

  const sendMessage = async (text: string) => {
    if (!sessionId || !text.trim()) return;

    setLoading(true);
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          session_id: sessionId,
          message: text,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed (${res.status})`);
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
      await fetchMemories(userId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const newSession = () => startSession(userId, true);

  const clearMemories = async () => {
    setError(null);
    setClearMemoryBanner(false);
    setNewSessionBanner(false);

    try {
      const res = await fetch(`/api/memories/${encodeURIComponent(userId)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to clear memories (${res.status})`);
      }

      setMemories([]);
      setClearMemoryBanner(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to clear memories");
    }
  };

  return {
    sessionId,
    messages,
    memories,
    loading,
    error,
    newSessionBanner,
    clearMemoryBanner,
    sendMessage,
    newSession,
    clearMemories,
    refreshMemories: () => fetchMemories(userId),
  };
}