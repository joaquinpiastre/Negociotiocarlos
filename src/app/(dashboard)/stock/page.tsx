"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

type Movement = {
  id: string;
  type: string;
  quantity: string;
  stockBefore: string;
  stockAfter: string;
  reason: string | null;
  createdAt: string;
  product: { name: string };
  user: { name: string };
};

const typeConfig: Record<string, { label: string; color: string; sign: string }> = {
  ENTRADA:    { label: "Entrada",    color: "bg-emerald-100 text-emerald-700", sign: "+" },
  SALIDA:     { label: "Salida",     color: "bg-red-100 text-red-700",         sign: "-" },
  AJUSTE:     { label: "Ajuste",     color: "bg-sky-100 text-sky-700",         sign: "±" },
  PERDIDA:    { label: "Pérdida",    color: "bg-amber-100 text-amber-700",     sign: "-" },
  DEVOLUCION: { label: "Devolución", color: "bg-violet-100 text-violet-700",   sign: "+" },
  VENCIMIENTO:{ label: "Vencimiento",color: "bg-zinc-100 text-zinc-600",       sign: "-" },
};

export default function StockPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [productFilter, setProductFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (typeFilter) params.set("type", typeFilter);
      if (productFilter) params.set("product", productFilter);
      const res = await fetch(`/api/stock/movimientos?${params}`);
      const data = await res.json();
      setMovements(data.movements ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, productFilter]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = () => {
    setProductFilter(searchInput);
    setPage(1);
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-6">
      <div className="flex items-center gap-2">
        <ClipboardList size={22} className="text-teal-700" />
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Control de stock</h1>
          <p className="text-sm text-zinc-500">Historial de movimientos · {total} registros</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(typeConfig).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
        <div className="flex flex-1 gap-2">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Buscar por producto..."
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
          />
          <button
            onClick={handleSearch}
            className="rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
          >
            Buscar
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-teal-700" />
          </div>
        ) : movements.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-400">No hay movimientos registrados.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3 text-left">Producto</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-right">Cantidad</th>
                  <th className="px-4 py-3 text-right">Antes</th>
                  <th className="px-4 py-3 text-right">Después</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Usuario</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">Motivo</th>
                  <th className="px-4 py-3 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const cfg = typeConfig[m.type] ?? { label: m.type, color: "bg-zinc-100 text-zinc-600", sign: "" };
                  return (
                    <tr key={m.id} className="border-b border-zinc-100 hover:bg-zinc-50">
                      <td className="px-4 py-3 font-medium text-zinc-900">{m.product.name}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-bold ${cfg.sign === "+" ? "text-emerald-600" : "text-red-600"}`}>
                        {cfg.sign}{Number(m.quantity)}
                      </td>
                      <td className="px-4 py-3 text-right text-zinc-500">{Number(m.stockBefore)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-zinc-900">{Number(m.stockAfter)}</td>
                      <td className="px-4 py-3 text-zinc-500 hidden md:table-cell">{m.user.name}</td>
                      <td className="px-4 py-3 text-zinc-400 hidden md:table-cell">{m.reason ?? "-"}</td>
                      <td className="px-4 py-3 text-right text-xs text-zinc-400">
                        {new Date(m.createdAt).toLocaleDateString("es-AR", {
                          day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-40"
          >
            <ChevronLeft size={14} /> Anterior
          </button>
          <span className="text-sm text-zinc-500">
            Página {page} de {pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="flex items-center gap-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm disabled:opacity-40"
          >
            Siguiente <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
