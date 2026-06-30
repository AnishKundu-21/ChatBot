interface Props {
  userId: string;
  memoryCount: number;
  onNewSession: () => void;
  onClearMemories: () => Promise<void>;
  showBanner: boolean;
  showClearBanner: boolean;
  showMemories: boolean;
  onToggleMemories: () => void;
  disabled?: boolean;
}

export function SessionControls({
  userId,
  memoryCount,
  onNewSession,
  onClearMemories,
  showBanner,
  showClearBanner,
  showMemories,
  onToggleMemories,
  disabled = false,
}: Props) {
  const handleClearMemories = () => {
    const label = userId.trim() || "this user";
    const confirmed = window.confirm(
      `Clear all saved memories for "${label}"? This cannot be undone.`
    );
    if (confirmed) {
      void onClearMemories();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onNewSession}
          disabled={disabled}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          New Session
        </button>
        <button
          type="button"
          onClick={onToggleMemories}
          disabled={disabled}
          className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700 shadow-sm transition hover:bg-indigo-100 disabled:opacity-50"
        >
          {showMemories ? "Hide Memories" : "View Memories"}
        </button>
        <button
          type="button"
          onClick={handleClearMemories}
          disabled={disabled || memoryCount === 0}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 shadow-sm transition hover:bg-red-100 disabled:opacity-50"
        >
          Clear All Memory
        </button>
      </div>
      {showBanner && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 border border-amber-200">
          New session started — only persisted memories carry over.
        </p>
      )}
      {showClearBanner && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800 border border-green-200">
          All saved memories for &quot;{userId}&quot; have been cleared.
        </p>
      )}
    </div>
  );
}