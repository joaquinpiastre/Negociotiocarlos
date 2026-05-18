"use client";

import { useState, useCallback } from "react";
import { BarcodeScanner } from "@/components/scanner/barcode-scanner";
import {
  Camera,
  Package,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  Loader2,
  ScanLine,
} from "lucide-react";

type Mode = "SALIDA" | "ENTRADA";

interface Product {
  id: string;
  name: string;
  barcode: string | null;
  salePrice: string;
  costPrice: string;
  stock: string;
  unitType: string;
  category: { name: string };
}

type ScanState = "idle" | "loading" | "found" | "not_found" | "success" | "error";

export default function ScannerPage() {
  const [mode, setMode] = useState<Mode>("SALIDA");
  const [scanActive, setScanActive] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [message, setMessage] = useState("");
  const [lastBarcode, setLastBarcode] = useState("");

  const handleScan = useCallback(
    async (barcode: string) => {
      if (barcode === lastBarcode && scanState === "found") return;
      setLastBarcode(barcode);
      setScanState("loading");
      setProduct(null);

      try {
        const res = await fetch(`/api/products/barcode/${encodeURIComponent(barcode)}`);
        if (res.ok) {
          const data: Product = await res.json();
          setProduct(data);
          setQuantity(1);
          setScanState("found");
        } else {
          setScanState("not_found");
          setMessage(`Codigo "${barcode}" no registrado en el sistema.`);
        }
      } catch {
        setScanState("error");
        setMessage("Error de conexion. Verifica la red.");
      }
    },
    [lastBarcode, scanState],
  );

  const handleConfirm = async () => {
    if (!product) return;
    setScanState("loading");

    try {
      const res = await fetch("/api/stock/movimiento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          type: mode,
          quantity,
          reason:
            mode === "SALIDA" ? "Venta rapida por scanner" : "Entrada por scanner",
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setScanState("success");
        setMessage(
          mode === "ENTRADA"
            ? `+${quantity} ${product.unitType.toLowerCase()} agregadas a "${product.name}". Stock nuevo: ${data.newStock}`
            : `${quantity} ${product.unitType.toLowerCase()} descontadas de "${product.name}". Stock nuevo: ${data.newStock}`,
        );
        setProduct(null);
        setLastBarcode("");
        setTimeout(() => {
          setScanState("idle");
          setMessage("");
        }, 3000);
      } else {
        const err = await res.json();
        setScanState("error");
        setMessage(err.error ?? "Error al registrar el movimiento.");
      }
    } catch {
      setScanState("error");
      setMessage("Error de conexion.");
    }
  };

  const handleReset = () => {
    setProduct(null);
    setScanState("idle");
    setMessage("");
    setLastBarcode("");
  };

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-24 lg:pb-6">
      <div className="flex items-center gap-2">
        <ScanLine size={22} className="text-teal-700" />
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Scanner</h1>
          <p className="text-sm text-zinc-500">Escanea codigos de barra con la camara</p>
        </div>
      </div>

      {/* Mode selector */}
      <div className="flex rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => { setMode("SALIDA"); handleReset(); }}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
            mode === "SALIDA" ? "bg-teal-800 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Venta / Salida
        </button>
        <button
          onClick={() => { setMode("ENTRADA"); handleReset(); }}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
            mode === "ENTRADA" ? "bg-green-700 text-white shadow-sm" : "text-zinc-600 hover:text-zinc-900"
          }`}
        >
          Entrada de stock
        </button>
      </div>

      {/* Camera section */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium text-zinc-600">
            {mode === "SALIDA"
              ? "Escanea para descontar stock"
              : "Escanea para agregar stock"}
          </p>
          <button
            onClick={() => setScanActive(!scanActive)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
              scanActive
                ? "bg-red-50 text-red-700 hover:bg-red-100"
                : "bg-teal-800 text-white hover:bg-teal-900"
            }`}
          >
            <Camera size={14} />
            {scanActive ? "Detener" : "Activar camara"}
          </button>
        </div>

        <BarcodeScanner onScan={handleScan} active={scanActive} />

        {!scanActive && (
          <p className="mt-3 text-center text-xs text-zinc-400">
            Presiona &quot;Activar camara&quot; y apunta al codigo de barras del producto
          </p>
        )}
      </div>

      {/* Loading */}
      {scanState === "loading" && (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <Loader2 size={20} className="animate-spin text-teal-700" />
          <span className="text-sm text-zinc-600">Buscando producto...</span>
        </div>
      )}

      {/* Product found */}
      {scanState === "found" && product && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50">
              <Package size={22} className="text-teal-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-zinc-900 leading-tight">{product.name}</h3>
              <p className="text-sm text-zinc-500">{product.category.name}</p>
              <p className="mt-0.5 text-base font-semibold text-teal-800">
                ${Number(product.salePrice).toFixed(2)}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-zinc-400">Stock</p>
              <p
                className={`text-2xl font-bold ${
                  Number(product.stock) <= 5 ? "text-red-600" : "text-zinc-900"
                }`}
              >
                {Number(product.stock)}
              </p>
              <p className="text-xs text-zinc-400">{product.unitType.toLowerCase()}</p>
            </div>
          </div>

          {/* Quantity control */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">
              Cantidad a {mode === "ENTRADA" ? "agregar" : "descontar"}
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100"
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-24 rounded-xl border border-zinc-300 px-3 py-2.5 text-center text-xl font-bold outline-none ring-teal-500 focus:ring-2"
              />
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-300 hover:bg-zinc-50 active:bg-zinc-100"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleReset}
              className="flex-1 rounded-xl border border-zinc-300 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 rounded-xl py-3 text-sm font-bold text-white transition-colors ${
                mode === "ENTRADA"
                  ? "bg-green-700 hover:bg-green-800"
                  : "bg-teal-800 hover:bg-teal-900"
              }`}
            >
              {mode === "ENTRADA"
                ? `+ Agregar ${quantity}`
                : `- Vender ${quantity}`}
            </button>
          </div>
        </div>
      )}

      {/* Not found */}
      {scanState === "not_found" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-2">
            <XCircle size={18} className="mt-0.5 shrink-0 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">{message}</p>
          </div>
          <button
            onClick={handleReset}
            className="mt-3 w-full rounded-lg border border-amber-300 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
          >
            Escanear otro producto
          </button>
        </div>
      )}

      {/* Success */}
      {scanState === "success" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle size={18} className="mt-0.5 shrink-0 text-green-600" />
            <p className="text-sm font-medium text-green-800">{message}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {scanState === "error" && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-start gap-2">
            <XCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
            <p className="text-sm font-medium text-red-800">{message}</p>
          </div>
          <button
            onClick={handleReset}
            className="mt-3 w-full rounded-lg border border-red-300 py-2 text-sm font-medium text-red-900 hover:bg-red-100"
          >
            Intentar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}
