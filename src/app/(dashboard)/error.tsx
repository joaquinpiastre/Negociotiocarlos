"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-20 px-4">
      <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center max-w-sm w-full">
        <AlertTriangle size={36} className="mx-auto text-red-500" />
        <h2 className="mt-3 text-lg font-bold text-zinc-900">Error al cargar</h2>
        <p className="mt-2 text-sm text-zinc-500">
          No se pudo cargar esta sección. Intentá de nuevo.
        </p>
        <button
          onClick={reset}
          className="mt-5 rounded-xl bg-teal-800 px-5 py-2 text-sm font-medium text-white hover:bg-teal-900"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
