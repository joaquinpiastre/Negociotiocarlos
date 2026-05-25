"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Truck, Plus, Pencil, Trash2, Loader2, X, Check, ArrowRight, TrendingDown } from "lucide-react";

type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  cuit: string | null;
  notes: string | null;
  _count: { products: number; purchaseOps: number };
  totalPurchased: number;
  totalPaid: number;
  balance: number;
};

const emptyForm = { name: "", phone: "", email: "", address: "", cuit: "", notes: "" };

const ars = (v: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v);

export default function ProveedoresPage() {
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/proveedores");
      setSuppliers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(emptyForm); setEditId(null); setError(""); setShowForm(true); };
  const openEdit = (s: Supplier) => {
    setForm({ name: s.name, phone: s.phone ?? "", email: s.email ?? "", address: s.address ?? "", cuit: s.cuit ?? "", notes: s.notes ?? "" });
    setEditId(s.id);
    setError("");
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) { setError("Nombre requerido"); return; }
    setSaving(true);
    setError("");
    try {
      const url = editId ? `/api/proveedores/${editId}` : "/api/proveedores";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowForm(false);
        setEditId(null);
        load();
      } else {
        const data = await res.json();
        setError(data.error ?? "Error al guardar");
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("¿Eliminar este proveedor?")) return;
    const res = await fetch(`/api/proveedores/${id}`, { method: "DELETE" });
    if (res.ok) load();
    else {
      const data = await res.json();
      alert(data.error ?? "No se pudo eliminar");
    }
  };

  const totalDeuda = suppliers.reduce((sum, s) => sum + Math.max(0, s.balance), 0);

  return (
    <div className="space-y-4 pb-24 lg:pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck size={22} className="text-teal-700" />
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Proveedores</h1>
            <p className="text-sm text-zinc-500">{suppliers.length} proveedores registrados</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
        >
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* Resumen de deuda total */}
      {!loading && totalDeuda > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <TrendingDown size={18} className="text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-800">Deuda total con proveedores</p>
            <p className="text-xs text-red-600">{ars(totalDeuda)} pendiente de pago</p>
          </div>
        </div>
      )}

      {/* Formulario */}
      {showForm && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">{editId ? "Editar proveedor" : "Nuevo proveedor"}</h2>
            <button onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-zinc-600"><X size={18} /></button>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="grid gap-3 md:grid-cols-2">
            {[
              { name: "name", label: "Nombre *", placeholder: "Distribuidora..." },
              { name: "cuit", label: "CUIT", placeholder: "30-12345678-9" },
              { name: "phone", label: "Teléfono", placeholder: "+54 299..." },
              { name: "email", label: "Email", placeholder: "ventas@..." },
              { name: "address", label: "Dirección", placeholder: "Calle 123..." },
            ].map(({ name, label, placeholder }) => (
              <div key={name}>
                <label className="mb-1 block text-xs font-medium text-zinc-600">{label}</label>
                <input
                  value={form[name as keyof typeof form]}
                  onChange={(e) => setForm((f) => ({ ...f, [name]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
                />
              </div>
            ))}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Notas</label>
              <input
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Opcional..."
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
              Cancelar
            </button>
            <button onClick={save} disabled={saving} className="flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Lista */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-teal-700" /></div>
        ) : suppliers.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-400">Sin proveedores. Agregá el primero.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {suppliers.map((s) => {
              const hasDebt = s.balance > 0;
              return (
                <div key={s.id} className="flex items-start justify-between px-4 py-4 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-zinc-900">{s.name}</p>
                      {hasDebt && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                          Debe {ars(s.balance)}
                        </span>
                      )}
                      {!hasDebt && s.totalPurchased > 0 && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          Al dia
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-zinc-500">
                      {s.cuit && <span>CUIT: {s.cuit}</span>}
                      {s.phone && <span>{s.phone}</span>}
                      {s.email && <span>{s.email}</span>}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-zinc-400">
                      <span>{s._count.purchaseOps} compras</span>
                      {s.totalPurchased > 0 && <span>Comprado: {ars(s.totalPurchased)}</span>}
                      {s.totalPaid > 0 && <span>Pagado: {ars(s.totalPaid)}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => router.push(`/proveedores/${s.id}`)}
                      className="flex items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-100"
                    >
                      Ver cuenta <ArrowRight size={12} />
                    </button>
                    <button onClick={() => openEdit(s)} className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => remove(s.id)} className="rounded-lg border border-zinc-200 p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
