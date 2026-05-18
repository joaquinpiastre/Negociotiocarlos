"use client";

import { useState, useCallback, useRef } from "react";
import {
  Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle,
  Loader2, Camera, X,
} from "lucide-react";
import { BarcodeScanner } from "@/components/scanner/barcode-scanner";

type CartItem = {
  productId: string;
  name: string;
  salePrice: number;
  quantity: number;
  stock: number;
};

type Product = {
  id: string;
  name: string;
  salePrice: string;
  stock: string;
  unitType: string;
  barcode: string | null;
  category: { name: string };
};

type PaymentMethod = "EFECTIVO" | "TRANSFERENCIA" | "MERCADO_PAGO" | "TARJETA";

const paymentLabels: Record<PaymentMethod, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  MERCADO_PAGO: "Mercado Pago",
  TARJETA: "Tarjeta",
};

const ars = (v: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(v);

export default function VentasPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("EFECTIVO");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [scanActive, setScanActive] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchProducts = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/productos?search=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.products ?? []);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProducts(value), 300);
  };

  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= Number(product.stock)) return prev;
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      if (Number(product.stock) <= 0) return prev;
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          salePrice: Number(product.salePrice),
          quantity: 1,
          stock: Number(product.stock),
        },
      ];
    });
    setQuery("");
    setResults([]);
  }, []);

  const handleScan = useCallback(
    async (barcode: string) => {
      try {
        const res = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`);
        if (res.ok) {
          const product: Product = await res.json();
          addToCart(product);
          setScanActive(false);
        } else {
          setError(`Código "${barcode}" no registrado.`);
          setTimeout(() => setError(""), 3000);
        }
      } catch {
        setError("Error de conexión.");
        setTimeout(() => setError(""), 3000);
      }
    },
    [addToCart],
  );

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.productId !== productId) return i;
        const newQty = i.quantity + delta;
        if (newQty <= 0 || newQty > i.stock) return i;
        return { ...i, quantity: newQty };
      }),
    );
  };

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const subtotal = cart.reduce((sum, i) => sum + i.salePrice * i.quantity, 0);
  const total = Math.max(0, subtotal - discount);

  const confirmSale = async () => {
    if (!cart.length) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/ventas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.salePrice,
          })),
          discount,
          paymentMethod,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setCart([]);
        setDiscount(0);
        setTimeout(() => setSuccess(false), 4000);
      } else {
        const data = await res.json();
        setError(data.error ?? "Error al registrar la venta");
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 pb-28 lg:pb-6">
      <div className="flex items-center gap-2">
        <ShoppingCart size={22} className="text-teal-700" />
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Ventas (POS)</h1>
          <p className="text-sm text-zinc-500">Registrá ventas y descontá stock automáticamente</p>
        </div>
      </div>

      {/* Busqueda */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="Buscar producto por nombre o código..."
              className="w-full rounded-lg border border-zinc-300 py-2.5 pl-9 pr-3 text-sm outline-none ring-teal-500 focus:ring"
            />
            {searching && (
              <Loader2
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-zinc-400"
              />
            )}
          </div>
          <button
            onClick={() => setScanActive(!scanActive)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              scanActive
                ? "bg-red-50 text-red-700"
                : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
            }`}
          >
            <Camera size={16} />
            <span className="hidden sm:inline">{scanActive ? "Cerrar" : "Escanear"}</span>
          </button>
        </div>

        {scanActive && (
          <div className="mt-3">
            <BarcodeScanner onScan={handleScan} active={scanActive} />
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-zinc-200 shadow-md">
            {results.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-teal-50"
              >
                <div>
                  <span className="font-medium text-zinc-900">{p.name}</span>
                  <span className="ml-2 text-xs text-zinc-400">{p.category.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-semibold text-teal-800">{ars(Number(p.salePrice))}</span>
                  <span className="ml-2 text-xs text-zinc-400">stock: {Number(p.stock)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Carrito */}
      {cart.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          <div className="divide-y divide-zinc-100">
            {cart.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-zinc-900">{item.name}</p>
                  <p className="text-xs text-zinc-400">{ars(item.salePrice)} c/u</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateQty(item.productId, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-300 hover:bg-zinc-50"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.productId, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-300 hover:bg-zinc-50"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <span className="w-20 shrink-0 text-right text-sm font-bold text-zinc-900">
                  {ars(item.salePrice * item.quantity)}
                </span>
                <button
                  onClick={() => removeItem(item.productId)}
                  className="shrink-0 text-zinc-300 hover:text-red-500"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {cart.length === 0 && !success && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white py-10 text-center text-sm text-zinc-400">
          El carrito está vacío. Buscá o escaneá un producto.
        </div>
      )}

      {/* Resumen y pago */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-4">
        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-700">
            <CheckCircle size={18} />
            <span className="text-sm font-semibold">Venta registrada correctamente</span>
          </div>
        )}

        {cart.length > 0 && (
          <>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-zinc-600">
                <span>Subtotal</span>
                <span>{ars(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600">Descuento ($)</span>
                <input
                  type="number"
                  min={0}
                  max={subtotal}
                  value={discount || ""}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-28 rounded border border-zinc-300 px-2 py-1 text-right text-sm outline-none ring-teal-500 focus:ring"
                />
              </div>
              <div className="flex justify-between border-t border-zinc-200 pt-2 text-base font-bold text-zinc-900">
                <span>Total</span>
                <span className="text-teal-800">{ars(total)}</span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Medio de pago
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(paymentLabels) as PaymentMethod[]).map((pm) => (
                  <button
                    key={pm}
                    onClick={() => setPaymentMethod(pm)}
                    className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                      paymentMethod === pm
                        ? "border-teal-600 bg-teal-50 text-teal-800"
                        : "border-zinc-300 text-zinc-600 hover:bg-zinc-50"
                    }`}
                  >
                    {paymentLabels[pm]}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                <X size={15} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={confirmSale}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 py-3 font-bold text-white hover:bg-teal-900 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Procesando...
                </>
              ) : (
                <>Confirmar venta · {ars(total)}</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
