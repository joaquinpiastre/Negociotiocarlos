"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Package, Plus, Pencil, Trash2, Loader2, X, Check, ChevronLeft, ChevronRight, Search, Info } from "lucide-react";

type Category = { id: string; name: string };
type Supplier = { id: string; name: string };

type Product = {
  id: string;
  name: string;
  barcode: string | null;
  brand: string | null;
  costPrice: string;
  ivaRate: string;
  internalTaxPercent: string;
  salePrice: string;
  stock: string;
  minStock: string;
  unitType: string;
  category: { id: string; name: string };
  supplier: { id: string; name: string } | null;
};

const emptyForm = {
  name: "",
  barcode: "",
  brand: "",
  baseCostPrice: "",
  ivaRate: "0",
  internalTaxPercent: "0",
  profitPercent: "",
  salePrice: "",
  stock: "",
  minStock: "1",
  unitType: "UNIDAD",
  categoryId: "",
  supplierId: "",
};

const ars = (v: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v);

function computeCostPrice(base: string, iva: string, internalTax: string): number {
  const b = Number(base) || 0;
  const ivaFactor = 1 + (Number(iva) || 0) / 100;
  const taxFactor = 1 + (Number(internalTax) || 0) / 100;
  return b * ivaFactor * taxFactor;
}

export default function ProductosPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const totalCostPrice = computeCostPrice(form.baseCostPrice, form.ivaRate, form.internalTaxPercent);
  const recommendedSalePrice = form.profitPercent
    ? totalCostPrice * (1 + Number(form.profitPercent) / 100)
    : null;

  const load = async (q: string, p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/productos?search=${encodeURIComponent(q)}&page=${p}`);
      const data = await res.json();
      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/categorias").then((r) => r.json()),
      fetch("/api/proveedores").then((r) => r.json()),
    ]).then(([cats, sups]) => {
      setCategories(cats);
      setSuppliers(sups);
    });
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      load(search, 1);
    }, 300);
  }, [search]);

  useEffect(() => {
    load(search, page);
  }, [page]);

  const openNew = () => {
    setForm({ ...emptyForm, categoryId: categories[0]?.id ?? "" });
    setEditId(null);
    setError("");
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    const ivaRate = Number(p.ivaRate) || 0;
    const internalTaxPercent = Number(p.internalTaxPercent) || 0;
    const costPrice = Number(p.costPrice) || 0;
    const divisor = (1 + ivaRate / 100) * (1 + internalTaxPercent / 100);
    const baseCostPrice = divisor > 0 ? costPrice / divisor : costPrice;

    setForm({
      name: p.name,
      barcode: p.barcode ?? "",
      brand: p.brand ?? "",
      baseCostPrice: baseCostPrice > 0 ? String(Math.round(baseCostPrice * 100) / 100) : "",
      ivaRate: String(ivaRate),
      internalTaxPercent: String(internalTaxPercent),
      profitPercent: "",
      salePrice: String(p.salePrice),
      stock: String(p.stock),
      minStock: String(p.minStock),
      unitType: p.unitType,
      categoryId: p.category.id,
      supplierId: p.supplier?.id ?? "",
    });
    setEditId(p.id);
    setError("");
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) { setError("El nombre es requerido"); return; }
    if (!form.categoryId) { setError("Seleccioná una categoría"); return; }
    if (!form.baseCostPrice || !form.salePrice) { setError("Precio de costo y venta son requeridos"); return; }
    setSaving(true);
    setError("");
    try {
      const url = editId ? `/api/productos/${editId}` : "/api/productos";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          barcode: form.barcode.trim() || null,
          brand: form.brand.trim() || null,
          costPrice: totalCostPrice,
          ivaRate: Number(form.ivaRate),
          internalTaxPercent: Number(form.internalTaxPercent),
          salePrice: Number(form.salePrice),
          stock: Number(form.stock || 0),
          minStock: Number(form.minStock || 1),
          unitType: form.unitType,
          categoryId: form.categoryId,
          supplierId: form.supplierId || null,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setEditId(null);
        load(search, page);
      } else {
        const data = await res.json();
        setError(data.error ?? "Error al guardar");
      }
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar "${name}"? El producto quedará inactivo.`)) return;
    await fetch(`/api/productos/${id}`, { method: "DELETE" });
    load(search, page);
  };

  const set = (key: keyof typeof emptyForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="space-y-4 pb-24 lg:pb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={22} className="text-teal-700" />
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Productos</h1>
            <p className="text-sm text-zinc-500">{total} productos activos</p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={openNew}
            className="flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900"
          >
            <Plus size={16} /> Nuevo
          </button>
        )}
      </div>

      {/* Formulario (solo admin) */}
      {showForm && isAdmin && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">{editId ? "Editar producto" : "Nuevo producto"}</h2>
            <button onClick={() => setShowForm(false)} className="text-zinc-400 hover:text-zinc-600">
              <X size={18} />
            </button>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

          {/* Datos generales */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="mb-1 block text-xs font-medium text-zinc-600">Nombre *</label>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Nombre del producto"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Marca</label>
              <input
                value={form.brand}
                onChange={(e) => set("brand", e.target.value)}
                placeholder="Marca"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Código de barras</label>
              <input
                value={form.barcode}
                onChange={(e) => set("barcode", e.target.value)}
                placeholder="7790001234567"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Categoría *</label>
              <select
                value={form.categoryId}
                onChange={(e) => set("categoryId", e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              >
                <option value="">— seleccionar —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Proveedor</label>
              <select
                value={form.supplierId}
                onChange={(e) => set("supplierId", e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              >
                <option value="">— sin proveedor —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sección de precios */}
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Estructura de precios</p>

            <div className="grid gap-3 sm:grid-cols-3">
              {/* Precio de costo sin IVA */}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Precio de costo sin IVA *</label>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.baseCostPrice}
                  onChange={(e) => set("baseCostPrice", e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
                />
              </div>

              {/* IVA */}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">IVA</label>
                <select
                  value={form.ivaRate}
                  onChange={(e) => set("ivaRate", e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
                >
                  <option value="0">Sin IVA (0%)</option>
                  <option value="10.5">10,5%</option>
                  <option value="21">21%</option>
                </select>
              </div>

              {/* Impuestos internos */}
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Impuestos internos (%)</label>
                <input
                  type="number"
                  min={0}
                  max={999}
                  step="0.01"
                  value={form.internalTaxPercent}
                  onChange={(e) => set("internalTaxPercent", e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
                />
              </div>
            </div>

            {/* Costo total calculado */}
            {form.baseCostPrice && (
              <div className="flex items-center gap-2 rounded-lg bg-white border border-zinc-200 px-3 py-2">
                <Info size={14} className="text-teal-600 shrink-0" />
                <p className="text-xs text-zinc-600">
                  Precio de costo total (con impuestos):{" "}
                  <span className="font-bold text-zinc-900">{ars(totalCostPrice)}</span>
                </p>
              </div>
            )}

            {/* Calculadora de ganancia */}
            <div className="grid gap-3 sm:grid-cols-2 border-t border-zinc-200 pt-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Ganancia (%)</label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.profitPercent}
                  onChange={(e) => set("profitPercent", e.target.value)}
                  placeholder="30"
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Precio sugerido</label>
                <div className="flex h-9 items-center rounded-lg border border-dashed border-zinc-300 bg-zinc-100 px-3 text-sm text-zinc-500">
                  {recommendedSalePrice != null && form.baseCostPrice
                    ? ars(recommendedSalePrice)
                    : "—"}
                </div>
              </div>
            </div>

            {/* Precio de venta final */}
            <div className="border-t border-zinc-200 pt-3">
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                Precio de venta *{" "}
                <span className="font-normal text-zinc-400">(el que vos decidís)</span>
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.salePrice}
                onChange={(e) => set("salePrice", e.target.value)}
                placeholder="0.00"
                className="w-full rounded-lg border border-teal-400 bg-white px-3 py-2 text-sm font-medium outline-none ring-teal-500 focus:ring"
              />
            </div>
          </div>

          {/* Stock */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Stock actual</label>
              <input
                type="number"
                min={0}
                step="1"
                value={form.stock}
                onChange={(e) => set("stock", e.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Stock mínimo</label>
              <input
                type="number"
                min={0}
                step="1"
                value={form.minStock}
                onChange={(e) => set("minStock", e.target.value)}
                placeholder="1"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Unidad</label>
              <select
                value={form.unitType}
                onChange={(e) => set("unitType", e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              >
                <option value="UNIDAD">Unidad</option>
                <option value="KG">Kilogramo</option>
                <option value="LITRO">Litro</option>
                <option value="METRO">Metro</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Guardar
            </button>
          </div>
        </div>
      )}

      {/* Búsqueda */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, código o marca..."
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm outline-none ring-teal-500 focus:ring"
        />
      </div>

      {/* Lista */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 size={22} className="animate-spin text-teal-700" />
          </div>
        ) : products.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-400">
            {search ? "Sin resultados para esa búsqueda." : "Sin productos. Agregá el primero."}
          </p>
        ) : (
          <>
            <div className="divide-y divide-zinc-100">
              {products.map((p) => {
                const stock = Number(p.stock);
                const minStock = Number(p.minStock);
                const stockOk = stock > minStock;
                const stockLow = stock > 0 && stock <= minStock;
                const stockOut = stock === 0;
                return (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-zinc-900">{p.name}</p>
                        {p.brand && (
                          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">{p.brand}</span>
                        )}
                        {stockOut && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Sin stock</span>
                        )}
                        {stockLow && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Stock bajo</span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-zinc-500">
                        <span>{p.category.name}</span>
                        {p.barcode && <span>#{p.barcode}</span>}
                        {p.supplier && <span>{p.supplier.name}</span>}
                      </div>
                    </div>
                    <div className="shrink-0 text-right hidden sm:block">
                      <p className="text-sm font-bold text-zinc-800">{ars(Number(p.salePrice))}</p>
                      {isAdmin && (
                        <p className="text-xs text-zinc-400">costo {ars(Number(p.costPrice))}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-bold ${stockOk ? "text-teal-700" : stockLow ? "text-amber-600" : "text-red-600"}`}>
                        {stock} {p.unitType === "KG" ? "kg" : p.unitType === "LITRO" ? "L" : "u."}
                      </p>
                      <p className="text-xs text-zinc-400">mín. {minStock}</p>
                    </div>
                    {isAdmin && (
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                          title="Editar"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => remove(p.id, p.name)}
                          className="rounded-lg border border-zinc-200 p-2 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                          title="Eliminar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-100 px-4 py-3">
                <p className="text-xs text-zinc-500">
                  Página {page} de {pages} · {total} productos
                </p>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 disabled:opacity-40 hover:bg-zinc-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page === pages}
                    className="rounded-lg border border-zinc-200 p-1.5 text-zinc-500 disabled:opacity-40 hover:bg-zinc-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
