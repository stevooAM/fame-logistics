"use client";

interface BatchActionBarProps {
  dirtyCount: number;
  onSaveAll: () => void;
  onCancelAll: () => void;
  isSaving: boolean;
}

export function BatchActionBar({
  dirtyCount,
  onSaveAll,
  onCancelAll,
  isSaving,
}: BatchActionBarProps) {
  if (dirtyCount === 0) return null;
  return (
    <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-md px-4 py-2">
      <span className="text-sm text-amber-800 font-medium">
        {dirtyCount} unsaved change(s)
      </span>
      <div className="flex gap-2">
        <button
          onClick={onCancelAll}
          disabled={isSaving}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          onClick={onSaveAll}
          disabled={isSaving}
          className="rounded-md px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
          style={{ backgroundColor: "#1F7A8C" }}
        >
          {isSaving ? "Saving..." : "Save All"}
        </button>
      </div>
    </div>
  );
}
