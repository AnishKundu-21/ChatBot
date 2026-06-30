import type { Memory } from "../hooks/useChat";

interface Props {
  memories: Memory[];
}

export function MemoriesPanel({ memories }: Props) {
  return (
    <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-indigo-900">
        Persisted Memories
      </h3>
      {memories.length === 0 ? (
        <p className="text-sm text-indigo-600/70">No memories stored yet.</p>
      ) : (
        <ul className="space-y-2">
          {memories.map((m) => (
            <li
              key={m.id}
              className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
            >
              <span className="mr-2 inline-block rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-700">
                {m.category}
              </span>
              {m.fact}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}