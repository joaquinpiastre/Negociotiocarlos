"use client";

import { Printer, Share2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function RemitoActions({ remitoNumber }: { remitoNumber: string }) {
  const router = useRouter();

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Remito #${remitoNumber}`,
          text: `Remito de compra #${remitoNumber}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      alert("Enlace copiado al portapapeles");
    }
  };

  const canShare = typeof navigator !== "undefined" && !!navigator.share;

  return (
    <>
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
      >
        <ArrowLeft size={16} /> Volver
      </button>
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-900"
      >
        <Printer size={16} />
        {canShare ? "Imprimir" : "Imprimir / Descargar PDF"}
      </button>
      {canShare && (
        <button
          onClick={handleShare}
          className="flex items-center gap-2 rounded-xl border border-teal-300 bg-teal-50 px-4 py-2.5 text-sm font-medium text-teal-800 shadow-sm hover:bg-teal-100"
        >
          <Share2 size={16} /> Compartir
        </button>
      )}
      {!canShare && (
        <button
          onClick={handleShare}
          className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
        >
          <Share2 size={16} /> Copiar enlace
        </button>
      )}
    </>
  );
}
