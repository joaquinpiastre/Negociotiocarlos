"use client";

import { useEffect } from "react";

export default function GlobalError({
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm text-center max-w-sm w-full">
        <p className="text-5xl font-bold text-red-500">!</p>
        <h1 className="mt-3 text-xl font-bold text-zinc-900">Algo salió mal</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Ocurrió un error inesperado. Podés intentar recargar la página.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-teal-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-900"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
