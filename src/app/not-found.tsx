import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm text-center max-w-sm w-full">
        <p className="text-6xl font-bold text-teal-700">404</p>
        <h1 className="mt-3 text-xl font-bold text-zinc-900">Página no encontrada</h1>
        <p className="mt-2 text-sm text-zinc-500">
          La página que buscás no existe o fue movida.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-block rounded-xl bg-teal-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-teal-900"
        >
          Ir al dashboard
        </Link>
      </div>
    </div>
  );
}
