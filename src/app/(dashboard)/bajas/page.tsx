"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Trash2, Search, Loader2, Check, X, AlertTriangle, Clock } from "lucide-react";

type Product = {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  stock: string;
  unitType: string;
  category: { name: string };
};

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

const BAJA_TYPES = [
  { value: "VENCIMIENTO", label: "Vencido", color: "bg-orange-100 text-orange-700" },
  { value: "PERDIDA", label: "Dañado / Roto / Perdido", color: "bg-red-100 text-red-700" },
  { value: "AJUSTE", label: "Ajuste de stock", color: "bg-zinc-100 text-zinc-700" },
];

const TYPE_STYLES: Record<string, string> = {
  VENCIMIENTO: "bg-orange-100 text-orange-700",
  PERDIDA: "bg-red-100 text-red-700",
  AJUSTE: "bg-zinc-100 text-zinc-700",
};

const TYPE_LABELS: Record<string, string> = {
  VENCIMIENTO: "Vencido",
  PERDIDA: "Dañado / Perdido",
  AJUSTE: "Ajuste",
};

const ars = (v: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v);

const unitLabel = (u: string) => (u === "KG" ? "kg" : u === "LITRO" ? "L" : "u.");

export default function BajasPage() {
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [quantity, setQuantity] = useState("");
  const [bajaType, setBajaType] = useState("VENCIMIENTO");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [history, setHistory] = useState<Movement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const barcodeBuffer = useRef("");
  const barcodeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/stock/movimientos?type=PERDIDA&page=1");
      const perdida = await res.json();
      const res2 = await fetch("/api/stock/movimientos?type=VENCIMIENTO&page=1");
      const vencimiento = await res2.json();
      const res3 = await fetch("/api/stock/movimientos?type=AJUSTE&page=1");
      const ajuste = await res3.json();

      const all = [
        ...(perdida.movements ?? []),
        ...(vencimiento.movements ?? []),
        ...(ajuste.movements ?? []),
      ].sort(
        (a: Movement, b: Movement) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setHistory(all.slice(0, 30));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  // Barcode scanner detection (fast input = HID gun)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (e.key === "Enter") {
        const code = barcodeBuffer.current.trim();
        barcodeBuffer.current = "";
        clearTimeout(barcodeTimer.current);
        if (code.length >= 4) lookupBarcode(code);
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        clearTimeout(barcodeTimer.current);
        barcodeTimer.current = setTimeout(() => {
          barcodeBuffer.current = "";
        }, 80);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const lookupBarcode = async (code: string) => {
    try {
      const res = await fetch(`/api/products/barcode/${encodeURIComponent(code)}`);
      if (res.ok) {
        const product = await res.json();
        selectProduct(product);
      }
    } catch {}
  };

  useEffect(() => {
    clearTimeout(searchDebounce.current);
    if (!search.trim()) { setSearchResults([]); setShowDropdown(false); return; }
    searchDebounce.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(`/api/productos?search=${encodeURIComponent(search)}&page=1`);
        const data = await res.json();
        setSearchResults(data.products?.slice(0, 6) ?? []);
        setShowDropdown(true);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [search]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectProduct = (p: Product) => {
    setSelectedProduct(p);
    setSearch("");
    setShowDropdown(false);
    setError("");
  };

  const clearProduct = () => {
    setSelectedProduct(null);
    setQuantity("");
    setError("");
  };

  const submit = async () => {
    if (!selectedProduct) { setError("Seleccioná un producto"); return; }
    const qty = Number(quantity);
    if (!qty || qty <= 0) { setError("Ingresá una cantidad válida"); return; }
    if (qty > Number(selectedProduct.stock)) {
      setError(`Stock insuficiente. Disponible: ${Number(selectedProduct.stock)} ${unitLabel(selectedProduct.unitType)}`);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/stock/movimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          type: bajaType,
          quantity: qty,
          reason: notes.trim() || TYPE_LABELS[bajaType],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSuccess(
          `Baja registrada. Stock de "${selectedProduct.name}": ${Number(selectedProduct.stock)} → ${data.newStock} ${unitLabel(selectedProduct.unitType)}`,
        );
        setSelectedProduct(null);
        setQuantity("");
        setNotes("");
        setBajaType("VENCIMIENTO");
        loadHistory();
      } else {
        const d = await res.json();
        setError(d.error ?? "Error al registrar");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Trash2 size={22} className="text-red-600" />
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Bajas de stock</h1>
          <p className="text-sm text-zinc-500">Vencidos, dañados y ajustes — no se cuentan como venta</p>
        </div>
      </div>

      {/* Formulario */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-4">
        <h2 className="font-semibold text-zinc-900">Registrar baja</h2>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            <AlertTriangle size={14} className="shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            <Check size={14} className="shrink-0" />
            {success}
          </div>
        )}

        {/* Búsqueda de producto */}
        {!selectedProduct ? (
          <div ref={dropdownRef} className="relative">
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Producto <span className="font-normal text-zinc-400">(buscá por nombre o escaneá el código)</span>
            </label>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nombre del producto..."
                className="w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-4 text-sm outline-none ring-teal-500 focus:ring"
              />
              {searchLoading && (
                <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-zinc-400" />
              )}
            </div>
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-10 mt-1 w-full rounded-xl border border-zinc-200 bg-white shadow-lg overflow-hidden">
                {searchResults.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => selectProduct(p)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-zinc-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{p.name}</p>
                      <p className="text-xs text-zinc-400">{p.category.name}{p.brand ? ` · ${p.brand}` : ""}</p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${Number(p.stock) === 0 ? "bg-red-100 text-red-700" : "bg-teal-100 text-teal-700"}`}>
                      {Number(p.stock)} {unitLabel(p.unitType)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-teal-200 bg-teal-50 px-4 py-3">
            <div>
              <p className="font-semibold text-zinc-900">{selectedProduct.name}</p>
              <p className="text-xs text-zinc-500">
                {selectedProduct.category.name}
                {selectedProduct.brand ? ` · ${selectedProduct.brand}` : ""}
                {selectedProduct.barcode ? ` · #${selectedProduct.barcode}` : ""}
              </p>
              <p className="mt-0.5 text-sm font-medium text-teal-700">
                Stock actual: {Number(selectedProduct.stock)} {unitLabel(selectedProduct.unitType)}
              </p>
            </div>
            <button onClick={clearProduct} className="rounded-lg p-1.5 text-zinc-400 hover:bg-white hover:text-zinc-600">
              <X size={16} />
            </button>
          </div>
        )}

        {/* Motivo de baja */}
        <div>
          <label className="mb-2 block text-xs font-medium text-zinc-600">Motivo de la baja</label>
          <div className="flex flex-wrap gap-2">
            {BAJA_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setBajaType(t.value)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  bajaType === t.value
                    ? "border-teal-400 bg-teal-800 text-white"
                    : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {/* Cantidad */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Cantidad a dar de baja
              {selectedProduct && (
                <span className="ml-1 font-normal text-zinc-400">
                  (máx. {Number(selectedProduct.stock)} {unitLabel(selectedProduct.unitType)})
                </span>
              )}
            </label>
            <input
              type="number"
              min={1}
              step={selectedProduct?.unitType === "KG" || selectedProduct?.unitType === "LITRO" ? "0.001" : "1"}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              Notas <span className="font-normal text-zinc-400">(opcional)</span>
            </label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: vencimiento 05/2025, caja rota..."
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={submit}
            disabled={saving || !selectedProduct}
            className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Registrar baja
          </button>
        </div>
      </div>

      {/* Historial */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-100">
          <Clock size={16} className="text-zinc-400" />
          <h2 className="font-semibold text-zinc-900">Historial de bajas</h2>
        </div>

        {historyLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={20} className="animate-spin text-teal-700" />
          </div>
        ) : history.length === 0 ? (
          <p className="py-10 text-center text-sm text-zinc-400">Sin bajas registradas.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {history.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-zinc-900">{m.product.name}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_STYLES[m.type] ?? "bg-zinc-100 text-zinc-600"}`}>
                      {TYPE_LABELS[m.type] ?? m.type}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {m.user.name} · {new Date(m.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    {m.reason && ` · ${m.reason}`}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-red-600">−{Number(m.quantity)}</p>
                  <p className="text-xs text-zinc-400">{Number(m.stockBefore)} → {Number(m.stockAfter)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
