import { useState } from "react";
import { ChatWindow } from "./components/ChatWindow";
import { MemoriesPanel } from "./components/MemoriesPanel";
import { MessageInput } from "./components/MessageInput";
import { SessionControls } from "./components/SessionControls";
import { UserSelector } from "./components/UserSelector";
import { useChat } from "./hooks/useChat";

export default function App() {
  const [userId, setUserId] = useState("maya");
  const [showMemories, setShowMemories] = useState(false);

  const {
    messages,
    memories,
    loading,
    error,
    newSessionBanner,
    clearMemoryBanner,
    sendMessage,
    newSession,
    clearMemories,
  } = useChat(userId);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 p-4 md:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Memory Chatbot</h1>
          <p className="text-sm text-slate-500">
            Persistent per-user memory across sessions
          </p>
        </div>
        <UserSelector userId={userId} onChange={setUserId} />
      </header>

      <SessionControls
        userId={userId}
        memoryCount={memories.length}
        onNewSession={newSession}
        onClearMemories={clearMemories}
        showBanner={newSessionBanner}
        showClearBanner={clearMemoryBanner}
        showMemories={showMemories}
        onToggleMemories={() => setShowMemories((v) => !v)}
        disabled={loading}
      />

      {showMemories && <MemoriesPanel memories={memories} />}

      <ChatWindow messages={messages} loading={loading} />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 border border-red-200">
          {error}
        </p>
      )}

      <MessageInput onSend={sendMessage} disabled={loading} />
    </div>
  );
}