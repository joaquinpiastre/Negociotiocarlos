"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ShoppingBag, Plus, Trash2, Loader2, CheckCircle, X, Search, ScanLine } from "lucide-react";

type Supplier = { id: string; name: string };
type Product = { id: string; name: string; costPrice: string; stock: string; category: { name: string } };
type PurchaseItem = { productId: string; name: string; quantity: number; costPrice: number };

type Purchase = {
  id: string;
  createdAt: string;
  supplier: { name: string };
  user: { name: string };
  notes: string | null;
  items: Array<{ quantity: string; costPrice: string; total: string; product: { name: string } }>;
};

const ars = (v: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v);

export default function ComprasPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const [productQuery, setProductQuery] = useState("");
  const [productResults, setProductResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [scanCode, setScanCode] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState("");
  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/proveedores").then((r) => r.json()).then(setSuppliers);
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/compras");
      const data = await res.json();
      setPurchases(data.purchases ?? []);
    } finally {
      setLoadingHistory(false);
    }
  };

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) { setProductResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/productos?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setProductResults(data.products ?? []);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleProductSearch = (value: string) => {
    setProductQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProducts(value), 300);
  };

  const scanBarcode = async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setScanLoading(true);
    setScanError("");
    try {
      const res = await fetch(`/api/products/barcode/${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const product: Product = await res.json();
        addItem(product);
      } else {
        setScanError(`"${trimmed}" no registrado`);
        setTimeout(() => setScanError(""), 3000);
      }
    } catch {
      setScanError("Error de conexión");
      setTimeout(() => setScanError(""), 3000);
    } finally {
      setScanLoading(false);
      setScanCode("");
      setTimeout(() => scanInputRef.current?.focus(), 80);
    }
  };

  const addItem = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) return prev.map((i) =>
        i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
      );
      return [...prev, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        costPrice: Number(product.costPrice),
      }];
    });
    setProductQuery("");
    setProductResults([]);
  };

  const updateItem = (productId: string, field: "quantity" | "costPrice", value: number) => {
    setItems((prev) => prev.map((i) =>
      i.productId === productId ? { ...i, [field]: Math.max(field === "quantity" ? 1 : 0, value) } : i,
    ));
  };

  const removeItem = (productId: string) => setItems((prev) => prev.filter((i) => i.productId !== productId));

  const totalCompra = items.reduce((sum, i) => sum + i.quantity * i.costPrice, 0);

  const submit = async () => {
    if (!supplierId || !items.length) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/compras", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplierId, items, notes }),
      });
      if (res.ok) {
        setSuccess(true);
        setItems([]);
        setNotes("");
        setSupplierId("");
        loadHistory();
        setTimeout(() => setSuccess(false), 4000);
      } else {
        const data = await res.json();
        setError(data.error ?? "Error al registrar la compra");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-24 lg:pb-6">
      <div className="flex items-center gap-2">
        <ShoppingBag size={22} className="text-teal-700" />
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Compras</h1>
          <p className="text-sm text-zinc-500">Registrá compras a proveedores y actualizá el stock automáticamente</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-4">
        <h2 className="font-semibold text-zinc-900">Nueva compra</h2>

        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-700">
            <CheckCircle size={18} />
            <span className="text-sm font-semibold">Compra registrada correctamente</span>
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            <X size={15} className="mt-0.5 shrink-0" />{error}
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Proveedor</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
          >
            <option value="">Seleccionar proveedor...</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Lector de código de barras</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <ScanLine size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500" />
              <input
                ref={scanInputRef}
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); scanBarcode(scanCode); } }}
                placeholder="Apuntá la pistola acá y escaneá..."
                autoComplete="off"
                className="w-full rounded-lg border border-teal-300 bg-teal-50 py-2 pl-9 pr-3 text-sm font-mono outline-none ring-teal-500 focus:ring-2 focus:bg-white"
              />
              {scanLoading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-teal-600" />}
            </div>
            <button
              onClick={() => scanBarcode(scanCode)}
              disabled={!scanCode.trim() || scanLoading}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-40"
            >
              Buscar
            </button>
          </div>
          {scanError && <p className="mt-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{scanError}</p>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Buscar por nombre</label>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={productQuery}
              onChange={(e) => handleProductSearch(e.target.value)}
              onBlur={() => setTimeout(() => setProductResults([]), 150)}
              placeholder="Buscar producto por nombre..."
              className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm outline-none ring-teal-500 focus:ring"
            />
            {searching && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-zinc-400" />}
          </div>
          {productResults.length > 0 && (
            <div className="mt-1 max-h-44 overflow-y-auto rounded-lg border border-zinc-200 shadow-md">
              {productResults.map((p) => (
                <button
                  key={p.id}
                  onMouseDown={() => addItem(p)}
                  className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-teal-50"
                >
                  <span className="font-medium text-zinc-900">{p.name}</span>
                  <span className="text-xs text-zinc-400">{p.category.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500">
                  <th className="px-3 py-2 text-left">Producto</th>
                  <th className="px-3 py-2 text-right">Cantidad</th>
                  <th className="px-3 py-2 text-right">Costo unit.</th>
                  <th className="px-3 py-2 text-right">Subtotal</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.productId} className="border-b border-zinc-100">
                    <td className="px-3 py-2 font-medium text-zinc-900">{item.name}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(item.productId, "quantity", Number(e.target.value))}
                        className="w-16 rounded border border-zinc-300 px-2 py-1 text-right text-sm"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={item.costPrice}
                        onChange={(e) => updateItem(item.productId, "costPrice", Number(e.target.value))}
                        className="w-24 rounded border border-zinc-300 px-2 py-1 text-right text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-semibold">
                      {ars(item.quantity * item.costPrice)}
                    </td>
                    <td className="px-3 py-2">
                      <button onClick={() => removeItem(item.productId)} className="text-zinc-300 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} className="px-3 py-2 text-right text-sm font-bold text-zinc-900">Total</td>
                  <td className="px-3 py-2 text-right font-bold text-teal-800">{ars(totalCompra)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Observaciones</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Opcional..."
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
          />
        </div>

        <button
          onClick={submit}
          disabled={loading || !supplierId || !items.length}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 py-3 font-bold text-white hover:bg-teal-900 disabled:opacity-50"
        >
          {loading ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : <><Plus size={16} /> Registrar compra</>}
        </button>
      </div>

      {/* Historial */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 font-semibold text-zinc-900">Historial de compras</h2>
        {loadingHistory ? (
          <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-teal-700" /></div>
        ) : purchases.length === 0 ? (
          <p className="py-4 text-center text-sm text-zinc-400">Sin compras registradas.</p>
        ) : (
          <div className="space-y-3">
            {purchases.map((p) => {
              const total = p.items.reduce((sum, i) => sum + Number(i.total), 0);
              return (
                <div key={p.id} className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{p.supplier.name}</p>
                      <p className="text-xs text-zinc-400">{p.user.name} · {new Date(p.createdAt).toLocaleDateString("es-AR")}</p>
                      {p.notes && <p className="mt-1 text-xs text-zinc-500 italic">{p.notes}</p>}
                    </div>
                    <span className="text-sm font-bold text-teal-800">{ars(total)}</span>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    {p.items.map((item, idx) => (
                      <p key={idx} className="text-xs text-zinc-500">
                        {item.product.name} · {Number(item.quantity)} u. · {ars(Number(item.costPrice))} c/u
                      </p>
                    ))}
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
