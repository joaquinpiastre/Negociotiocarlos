import type { AdminDashboardData } from "@/lib/admin-dashboard";
import { SalesChart } from "./sales-chart";
import {
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Users,
  ShoppingCart,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from "lucide-react";

const ars = (value: number) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(value);

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const { kpis, lowStockProducts, recentSales, topProducts, chartData } = data;

  const today = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm capitalize text-zinc-500">{today}</p>
      </div>

      {/* === Finanzas === */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Finanzas
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Valor del inventario"
            value={ars(kpis.stockValue)}
            subtitle="Capital invertido en stock"
            icon={Wallet}
            accent="teal"
          />
          <KpiCard
            title="Ventas de hoy"
            value={ars(kpis.todayIncome)}
            subtitle={`${kpis.todaySalesCount} transacciones`}
            icon={ShoppingCart}
            accent="sky"
          />
          <KpiCard
            title="Ventas del mes"
            value={ars(kpis.monthIncome)}
            subtitle={`${kpis.monthSalesCount} transacciones`}
            icon={DollarSign}
            accent="emerald"
            trend={kpis.monthGrowth !== 0 ? kpis.monthGrowth : undefined}
          />
          <KpiCard
            title="Ganancia del mes"
            value={ars(kpis.monthProfit)}
            subtitle="Ingresos menos costo de productos"
            icon={TrendingUp}
            accent="violet"
          />
        </div>
      </section>

      {/* === Operaciones === */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">
          Operaciones
        </p>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Productos activos"
            value={kpis.productsCount.toLocaleString("es-AR")}
            subtitle="En el catalogo"
            icon={Package}
            accent="zinc"
          />
          <KpiCard
            title="Stock bajo"
            value={kpis.lowStockCount.toLocaleString("es-AR")}
            subtitle="Requieren reposicion"
            icon={AlertTriangle}
            accent={kpis.lowStockCount > 0 ? "amber" : "zinc"}
          />
          <KpiCard
            title="Empleados activos"
            value={kpis.usersCount.toLocaleString("es-AR")}
            subtitle="Usuarios en el sistema"
            icon={Users}
            accent="zinc"
          />
          <KpiCard
            title="Movimientos hoy"
            value={kpis.todayMovementsCount.toLocaleString("es-AR")}
            subtitle="Entradas y salidas registradas"
            icon={Activity}
            accent="zinc"
          />
        </div>
      </section>

      {/* === Grafico + Top productos === */}
      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 xl:col-span-2">
          <h3 className="mb-1 font-semibold text-zinc-900">Ventas ultimos 7 dias</h3>
          <p className="mb-4 text-xs text-zinc-400">Ingresos diarios en ARS</p>
          <SalesChart data={chartData} />
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-1 font-semibold text-zinc-900">Top productos del mes</h3>
          <p className="mb-4 text-xs text-zinc-400">Por unidades vendidas</p>
          {topProducts.length === 0 ? (
            <p className="text-sm text-zinc-400">Sin ventas registradas este mes.</p>
          ) : (
            <ol className="space-y-3">
              {topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">{p.name}</p>
                    <p className="text-xs text-zinc-400">{p.category}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-zinc-800">{p.quantity} u.</p>
                    <p className="text-xs text-zinc-400">{ars(p.total)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>

      {/* === Stock bajo + Ultimas ventas === */}
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-zinc-900">Stock bajo</h3>
              <p className="text-xs text-zinc-400">Productos por debajo del minimo</p>
            </div>
            {kpis.lowStockCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                {kpis.lowStockCount} alertas
              </span>
            )}
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              Todo el stock esta en orden.
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.map((p) => {
                const pct = (Number(p.stock) / Math.max(Number(p.minStock), 1)) * 100;
                const critical = Number(p.stock) === 0;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${
                      critical ? "bg-red-50" : "bg-amber-50"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-zinc-900">{p.name}</p>
                      <p className="text-xs text-zinc-500">{p.category.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-bold ${
                          critical ? "text-red-600" : "text-amber-700"
                        }`}
                      >
                        {Number(p.stock)} actual
                      </p>
                      <p className="text-xs text-zinc-400">min. {Number(p.minStock)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="mb-4">
            <h3 className="font-semibold text-zinc-900">Ultimas ventas</h3>
            <p className="text-xs text-zinc-400">Transacciones mas recientes</p>
          </div>
          {recentSales.length === 0 ? (
            <p className="text-sm text-zinc-400">No hay ventas registradas.</p>
          ) : (
            <div className="space-y-2">
              {recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {sale.items[0]?.product.name ?? "Venta"}
                      {sale.items.length > 1 && (
                        <span className="font-normal text-zinc-400">
                          {" "}
                          +{sale.items.length - 1} más
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-zinc-500">{sale.user.name}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-zinc-900">{ars(Number(sale.total))}</p>
                    <p className="text-xs text-zinc-400">
                      {new Date(sale.createdAt).toLocaleTimeString("es-AR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

type Accent = "teal" | "sky" | "emerald" | "violet" | "amber" | "zinc";

const accentStyles: Record<Accent, { icon: string; bg: string; border: string }> = {
  teal:    { icon: "text-teal-700",   bg: "bg-teal-50",    border: "border-zinc-200" },
  sky:     { icon: "text-sky-700",    bg: "bg-sky-50",     border: "border-zinc-200" },
  emerald: { icon: "text-emerald-700",bg: "bg-emerald-50", border: "border-zinc-200" },
  violet:  { icon: "text-violet-700", bg: "bg-violet-50",  border: "border-zinc-200" },
  amber:   { icon: "text-amber-600",  bg: "bg-amber-50",   border: "border-amber-200" },
  zinc:    { icon: "text-zinc-600",   bg: "bg-zinc-100",   border: "border-zinc-200" },
};

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  trend,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  accent: Accent;
  trend?: number;
}) {
  const s = accentStyles[accent];
  return (
    <div className={`rounded-2xl border ${s.border} bg-white p-5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${s.bg}`}>
          <Icon size={20} className={s.icon} />
        </div>
        {trend !== undefined && (
          <div
            className={`flex items-center gap-0.5 text-xs font-bold ${
              trend >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {trend >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-zinc-600">{title}</p>
      <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>
    </div>
  );
}
