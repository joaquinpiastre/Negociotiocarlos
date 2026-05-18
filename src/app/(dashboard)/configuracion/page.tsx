"use client";

import { useState, useEffect } from "react";
import { Cog, Loader2, Check } from "lucide-react";

type Settings = {
  id: string;
  businessName: string;
  location: string;
  phone: string | null;
  currency: string;
  suggestedProfitPercent: string;
  globalMinStock: string;
  receiptHeader: string | null;
};

export default function ConfiguracionPage() {
  const [settings, setSettings] = useState<Partial<Settings>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/configuracion")
      .then((r) => r.json())
      .then((data) => {
        if (data) setSettings(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (key: keyof Settings, value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: settings.businessName ?? "Tio Carlos",
          location: settings.location ?? "Chos Malal",
          phone: settings.phone || null,
          currency: settings.currency ?? "ARS",
          suggestedProfitPercent: Number(settings.suggestedProfitPercent ?? 30),
          globalMinStock: Number(settings.globalMinStock ?? 3),
          receiptHeader: settings.receiptHeader || null,
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error ?? "Error al guardar");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-teal-700" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pb-24 lg:pb-6">
      <div className="flex items-center gap-2">
        <Cog size={22} className="text-teal-700" />
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Configuración</h1>
          <p className="text-sm text-zinc-500">Datos generales del negocio</p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm space-y-4">
        {saved && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-green-700">
            <Check size={16} />
            <span className="text-sm font-semibold">Configuración guardada</span>
          </div>
        )}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        {[
          { key: "businessName", label: "Nombre del negocio", placeholder: "Tio Carlos" },
          { key: "location", label: "Ubicación", placeholder: "Chos Malal, Neuquén" },
          { key: "phone", label: "Teléfono", placeholder: "+54 2948..." },
          { key: "currency", label: "Moneda", placeholder: "ARS" },
          { key: "receiptHeader", label: "Encabezado de comprobante", placeholder: "Gracias por tu compra..." },
        ].map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="mb-1 block text-sm font-medium text-zinc-700">{label}</label>
            <input
              value={String(settings[key as keyof Settings] ?? "")}
              onChange={(e) => set(key as keyof Settings, e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
            />
          </div>
        ))}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">% Ganancia sugerida</label>
            <input
              type="number"
              min={0}
              max={1000}
              value={String(settings.suggestedProfitPercent ?? "")}
              onChange={(e) => set("suggestedProfitPercent", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Stock mínimo global</label>
            <input
              type="number"
              min={0}
              value={String(settings.globalMinStock ?? "")}
              onChange={(e) => set("globalMinStock", e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:ring"
            />
          </div>
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-800 py-3 font-bold text-white hover:bg-teal-900 disabled:opacity-60"
        >
          {saving ? <><Loader2 size={16} className="animate-spin" /> Guardando...</> : <><Check size={16} /> Guardar cambios</>}
        </button>
      </div>
    </div>
  );
}
