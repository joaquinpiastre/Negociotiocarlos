import Link from "next/link";
import { ScanLine, ShoppingCart, Package, Activity } from "lucide-react";
import type { EmployeeDashboardData } from "@/lib/admin-dashboard";

const ars = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

const movementMeta: Record<string, { label: string; color: string; sign: string }> = {
  ENTRADA:    { label: "Entrada",    color: "text-emerald-700", sign: "+" },
  SALIDA:     { label: "Salida",     color: "text-red-600",     sign: "-" },
  AJUSTE:     { label: "Ajuste",     color: "text-sky-700",     sign: "±" },
  PERDIDA:    { label: "Perdida",    color: "text-amber-600",   sign: "-" },
  DEVOLUCION: { label: "Devolucion", color: "text-violet-700",  sign: "+" },
  VENCIMIENTO:{ label: "Vencimiento",color: "text-zinc-500",    sign: "-" },
};

interface Props {
  userName: string;
  data: EmployeeDashboardData;
}

export function EmployeeDashboard({ userName, data }: Props) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos dias" : hour < 20 ? "Buenas tardes" : "Buenas noches";
  const time = new Date().toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      {/* Greeting banner */}
      <div className="rounded-2xl bg-gradient-to-br from-teal-800 to-teal-900 p-5 text-white shadow-sm">
        <p className="text-sm text-teal-200">
          {greeting} · {time}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{userName}</h1>
        <p className="mt-2 text-sm text-teal-100">
          {data.todaySalesCount > 0
            ? `Hoy llevas ${data.todaySalesCount} venta${data.todaySalesCount !== 1 ? "s" : ""} · ${ars(data.todaySalesTotal)}`
            : "Aun no hay ventas registradas hoy."}
        </p>
      </div>

      {/* Quick actions */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Acciones rapidas
        </p>
        <div className="grid grid-cols-3 gap-3">
          <QuickAction
            href="/scanner"
            icon={ScanLine}
            label="Scanner"
            className="bg-teal-800 hover:bg-teal-900"
          />
          <QuickAction
            href="/ventas"
            icon={ShoppingCart}
            label="Ventas"
            className="bg-sky-700 hover:bg-sky-800"
          />
          <QuickAction
            href="/productos"
            icon={Package}
            label="Productos"
            className="bg-zinc-700 hover:bg-zinc-800"
          />
        </div>
      </section>

      {/* Today's movements */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <Activity size={15} className="text-zinc-400" />
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Mis movimientos de hoy
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {data.todayMovements.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-zinc-400">No registraste movimientos hoy.</p>
              <p className="mt-1 text-xs text-zinc-300">
                Los movimientos del scanner apareceran aqui.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {data.todayMovements.map((move) => {
                const meta = movementMeta[move.type] ?? {
                  label: move.type,
                  color: "text-zinc-600",
                  sign: "",
                };
                return (
                  <div
                    key={move.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {move.product.name}
                      </p>
                      <p className={`text-xs font-medium ${meta.color}`}>{meta.label}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`text-sm font-bold ${meta.color}`}>
                        {meta.sign}
                        {Number(move.quantity)}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {new Date(move.createdAt).toLocaleTimeString("es-AR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  className,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  className: string;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-2 rounded-2xl p-4 text-white shadow-sm transition-opacity active:opacity-80 ${className}`}
    >
      <Icon size={24} />
      <span className="text-sm font-bold">{label}</span>
    </Link>
  );
}
