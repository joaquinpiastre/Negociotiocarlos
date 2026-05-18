"use client";

import { useState, useEffect } from "react";
import { Users, Plus, Pencil, X, Check, Loader2, ToggleLeft, ToggleRight } from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt: string;
};

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  CAJERO: "Cajero",
  REPOSITOR: "Repositor",
};

const emptyForm = { name: "", email: "", password: "", role: "CAJERO" };

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/usuarios");
      if (res.ok) setUsers(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm(emptyForm); setEditId(null); setError(""); setShowForm(true); };
  const openEdit = (u: User) => {
    setForm({ name: u.name, email: u.email, password: "", role: u.role });
    setEditId(u.id);
    setError("");
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name || !form.email) { setError("Nombre y email son requeridos"); return; }
    if (!editId && !form.password) { setError("La contraseña es requerida para nuevos usuarios"); return; }
    setSaving(true);
    setError("");
    try {
      const url = editId ? `/api/usuarios/${editId}` : "/api/usuarios";
      const method = editId ? "PUT" : "POST";
      const body: Record<string, string> = { name: form.name, email: form.email, role: form.role };
      if (form.password) body.password = form.password;
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
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

  const toggleActive = async (u: User) => {
    await fetch(`/api/usuarios/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    load();
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={22} className="text-teal-700" />
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Usuarios</h1>
            <p className="text-sm text-zinc-500">{users.length} usuarios registrados</p>
          </div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
        >
          <Plus size={16} /> Nuevo
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">{editId ? "Editar usuario" : "Nuevo usuario"}</h2>
            <button onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-zinc-600"><X size={18} /></button>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Nombre *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                {editId ? "Nueva contraseña (dejar vacío para no cambiar)" : "Contraseña *"}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Rol</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              >
                <option value="CAJERO">Cajero</option>
                <option value="REPOSITOR">Repositor</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
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
        ) : (
          <div className="divide-y divide-zinc-100">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-900">{u.name}</p>
                    {!u.active && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">Inactivo</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400">{u.email}</p>
                  <span className="mt-0.5 inline-block rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                    {roleLabels[u.role] ?? u.role}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-1 ml-3">
                  <button
                    onClick={() => toggleActive(u)}
                    className={`rounded-lg border p-2 transition-colors ${
                      u.active
                        ? "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                        : "border-zinc-200 text-zinc-400 hover:bg-zinc-50"
                    }`}
                    title={u.active ? "Desactivar usuario" : "Activar usuario"}
                  >
                    {u.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                  <button onClick={() => openEdit(u)} className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50">
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
