import { Plus } from "lucide-react";

export function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center">
      <p className="text-sm text-gray-600">Aún no hay trabajos.</p>
      <button
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50 active:scale-[0.99] transition"
      >
        <Plus size={16} /> Crear el primero
      </button>
    </div>
  );
}
