interface Props {
  userId: string;
  onChange: (id: string) => void;
}

export function UserSelector({ userId, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor="user-id" className="text-sm font-medium text-slate-600">
        User ID
      </label>
      <input
        id="user-id"
        type="text"
        value={userId}
        onChange={(e) => onChange(e.target.value.trim())}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        placeholder="maya"
      />
    </div>
  );
}