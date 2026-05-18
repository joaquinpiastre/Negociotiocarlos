"use client";

import { useState, useEffect } from "react";
import { Tags, Plus, Trash2, Loader2, Check } from "lucide-react";

type Category = { id: string; name: string; _count: { products: number } };

export default function CategoriasPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/categorias");
      setCategories(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/categorias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok) {
        setNewName("");
        load();
      } else {
        const data = await res.json();
        setError(data.error ?? "Error al crear");
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, name: string, productCount: number) => {
    if (productCount > 0) {
      alert(`No se puede eliminar: "${name}" tiene ${productCount} productos.`);
      return;
    }
    if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;
    const res = await fetch(`/api/categorias/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const data = await res.json();
      alert(data.error ?? "No se pudo eliminar");
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-24 lg:pb-6">
      <div className="flex items-center gap-2">
        <Tags size={22} className="text-teal-700" />
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Categorías</h1>
          <p className="text-sm text-zinc-500">{categories.length} categorías registradas</p>
        </div>
      </div>

      {/* Crear */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-900">Nueva categoría</h2>
        {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && create()}
            placeholder="Nombre de la categoría..."
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
          />
          <button
            onClick={create}
            disabled={saving || !newName.trim()}
            className="flex items-center gap-1.5 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Agregar
          </button>
        </div>
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={22} className="animate-spin text-teal-700" />
          </div>
        ) : categories.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-400">Sin categorías.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {categories.map((cat) => (
              <div key={cat.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">{cat.name}</p>
                  <p className="text-xs text-zinc-400">{cat._count.products} productos</p>
                </div>
                <button
                  onClick={() => remove(cat.id, cat.name, cat._count.products)}
                  className="rounded-lg border border-zinc-200 p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
