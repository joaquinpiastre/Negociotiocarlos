"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Loader2, DollarSign, TrendingDown, CheckCircle,
  Plus, X, Check, FileText, ChevronDown, ChevronUp,
} from "lucide-react";

type PurchaseItem = {
  id: string;
  quantity: string;
  costPrice: string;
  total: string;
  product: { name: string; brand: string | null; unitType: string };
};

type Purchase = {
  id: string;
  purchasedAt: string;
  notes: string | null;
  total: number;
  user: { name: string };
  items: PurchaseItem[];
};

type Payment = {
  id: string;
  amount: string;
  method: string;
  notes: string | null;
  paidAt: string;
};

type AccountData = {
  supplier: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    cuit: string | null;
    notes: string | null;
  };
  purchases: Purchase[];
  payments: Payment[];
  totals: { totalPurchased: number; totalPaid: number; balance: number };
};

const METHODS = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "MERCADO_PAGO", label: "Mercado Pago" },
  { value: "TARJETA", label: "Tarjeta" },
];

const METHOD_LABELS: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TRANSFERENCIA: "Transferencia",
  MERCADO_PAGO: "Mercado Pago",
  TARJETA: "Tarjeta",
};

const ars = (v: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v);

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

export default function SupplierAccountPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPurchase, setExpandedPurchase] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"compras" | "pagos">("compras");

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "EFECTIVO", notes: "", paidAt: "" });
  const [saving, setSaving] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/proveedores/${id}`);
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const savePayment = async () => {
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      setPaymentError("Ingresá un monto válido");
      return;
    }
    setSaving(true);
    setPaymentError("");
    try {
      const res = await fetch(`/api/proveedores/${id}/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(paymentForm.amount),
          method: paymentForm.method,
          notes: paymentForm.notes || undefined,
          paidAt: paymentForm.paidAt || undefined,
        }),
      });
      if (res.ok) {
        setShowPaymentForm(false);
        setPaymentForm({ amount: "", method: "EFECTIVO", notes: "", paidAt: "" });
        load();
      } else {
        const d = await res.json();
        setPaymentError(d.error ?? "Error al guardar");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={22} className="animate-spin text-teal-700" />
      </div>
    );
  }

  if (!data) {
    return <p className="py-10 text-center text-sm text-zinc-400">Proveedor no encontrado.</p>;
  }

  const { supplier, purchases, payments, totals } = data;
  const balance = totals.balance;

  return (
    <div className="space-y-5 pb-24 lg:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/proveedores")}
          className="rounded-lg border border-zinc-200 p-2 text-zinc-500 hover:bg-zinc-50"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-zinc-900 truncate">{supplier.name}</h1>
          <div className="flex flex-wrap gap-x-3 text-xs text-zinc-500">
            {supplier.cuit && <span>CUIT: {supplier.cuit}</span>}
            {supplier.phone && <span>{supplier.phone}</span>}
            {supplier.email && <span>{supplier.email}</span>}
          </div>
        </div>
      </div>

      {/* Balance cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-zinc-100 p-2">
              <DollarSign size={16} className="text-zinc-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-zinc-900">{ars(totals.totalPurchased)}</p>
          <p className="text-xs font-semibold text-zinc-600">Total comprado</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-lg bg-emerald-50 p-2">
              <CheckCircle size={16} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-xl font-bold text-zinc-900">{ars(totals.totalPaid)}</p>
          <p className="text-xs font-semibold text-zinc-600">Total pagado</p>
        </div>
        <div className={`rounded-2xl border p-4 shadow-sm ${balance > 0 ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
          <div className="flex items-center gap-2 mb-2">
            <div className={`rounded-lg p-2 ${balance > 0 ? "bg-red-100" : "bg-emerald-100"}`}>
              <TrendingDown size={16} className={balance > 0 ? "text-red-600" : "text-emerald-600"} />
            </div>
          </div>
          <p className={`text-xl font-bold ${balance > 0 ? "text-red-700" : "text-emerald-700"}`}>{ars(Math.abs(balance))}</p>
          <p className={`text-xs font-semibold ${balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
            {balance > 0 ? "Saldo pendiente" : balance < 0 ? "Saldo a favor" : "Sin deuda"}
          </p>
        </div>
      </div>

      {/* Registrar pago */}
      {!showPaymentForm ? (
        <button
          onClick={() => setShowPaymentForm(true)}
          className="flex items-center gap-2 rounded-xl border border-teal-300 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800 hover:bg-teal-100 w-full justify-center"
        >
          <Plus size={16} /> Registrar pago
        </button>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-zinc-900">Registrar pago</h2>
            <button onClick={() => setShowPaymentForm(false)} className="text-zinc-400 hover:text-zinc-600">
              <X size={18} />
            </button>
          </div>
          {paymentError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{paymentError}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Monto *</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Forma de pago</label>
              <select
                value={paymentForm.method}
                onChange={(e) => setPaymentForm((f) => ({ ...f, method: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Fecha del pago</label>
              <input
                type="date"
                value={paymentForm.paidAt}
                onChange={(e) => setPaymentForm((f) => ({ ...f, paidAt: e.target.value }))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Notas</label>
              <input
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Opcional..."
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowPaymentForm(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50">
              Cancelar
            </button>
            <button
              onClick={savePayment}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-teal-800 px-4 py-2 text-sm font-medium text-white hover:bg-teal-900 disabled:opacity-60"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Guardar pago
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-zinc-200 bg-white p-1 shadow-sm">
        <button
          onClick={() => setActiveTab("compras")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${activeTab === "compras" ? "bg-teal-800 text-white" : "text-zinc-600 hover:bg-zinc-50"}`}
        >
          Compras ({purchases.length})
        </button>
        <button
          onClick={() => setActiveTab("pagos")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${activeTab === "pagos" ? "bg-teal-800 text-white" : "text-zinc-600 hover:bg-zinc-50"}`}
        >
          Pagos ({payments.length})
        </button>
      </div>

      {/* Compras tab */}
      {activeTab === "compras" && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          {purchases.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-400">Sin compras registradas.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {purchases.map((p) => (
                <div key={p.id}>
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-zinc-50"
                    onClick={() => setExpandedPurchase(expandedPurchase === p.id ? null : p.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900">{fmt(p.purchasedAt)}</p>
                      <p className="text-xs text-zinc-500">
                        {p.items.length} {p.items.length === 1 ? "item" : "items"} · {p.user.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-zinc-900">{ars(p.total)}</p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`/remito/${p.id}`, "_blank");
                        }}
                        className="flex items-center gap-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                        title="Ver remito"
                      >
                        <FileText size={13} /> Remito
                      </button>
                      {expandedPurchase === p.id ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
                    </div>
                  </div>
                  {expandedPurchase === p.id && (
                    <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-zinc-400">
                            <th className="text-left pb-1.5 font-medium">Producto</th>
                            <th className="text-right pb-1.5 font-medium">Cant.</th>
                            <th className="text-right pb-1.5 font-medium">P. unitario</th>
                            <th className="text-right pb-1.5 font-medium">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200">
                          {p.items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-1.5 text-zinc-700">
                                {item.product.name}
                                {item.product.brand && <span className="text-zinc-400"> · {item.product.brand}</span>}
                              </td>
                              <td className="py-1.5 text-right text-zinc-700">{Number(item.quantity)}</td>
                              <td className="py-1.5 text-right text-zinc-700">{ars(Number(item.costPrice))}</td>
                              <td className="py-1.5 text-right font-semibold text-zinc-900">{ars(Number(item.total))}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan={3} className="pt-2 text-right text-xs font-semibold text-zinc-600">Total</td>
                            <td className="pt-2 text-right text-sm font-bold text-zinc-900">{ars(p.total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                      {p.notes && <p className="mt-2 text-xs text-zinc-400">Nota: {p.notes}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagos tab */}
      {activeTab === "pagos" && (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
          {payments.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-400">Sin pagos registrados.</p>
          ) : (
            <div className="divide-y divide-zinc-100">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{fmt(p.paidAt)}</p>
                    <p className="text-xs text-zinc-500">
                      {METHOD_LABELS[p.method] ?? p.method}
                      {p.notes && ` · ${p.notes}`}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-emerald-700">{ars(Number(p.amount))}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
