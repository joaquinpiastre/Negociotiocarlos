import { prisma } from "@/lib/prisma";
import { BarChart3 } from "lucide-react";

const ars = (v: number) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(v);

export default async function ReportesPage() {
  const now = new Date();
  const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 6); startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    todaySales, weekSales, monthSales,
    topProductsRaw, allActiveProducts,
    monthSaleItems, purchaseItemsMonth,
  ] = await Promise.all([
    prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { createdAt: { gte: startOfToday } } }),
    prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { createdAt: { gte: startOfWeek } } }),
    prisma.sale.aggregate({ _sum: { total: true }, _count: true, where: { createdAt: { gte: startOfMonth } } }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, total: true },
      where: { sale: { createdAt: { gte: startOfMonth } } },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    prisma.product.findMany({
      where: { active: true },
      select: { id: true, name: true, stock: true, minStock: true, costPrice: true, salePrice: true, category: { select: { name: true } } },
      orderBy: { stock: "asc" },
    }),
    prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: startOfMonth } } },
      select: { quantity: true, total: true, unitCost: true },
    }),
    prisma.purchaseItem.findMany({
      where: { purchase: { createdAt: { gte: startOfMonth } } },
      select: { total: true },
    }),
  ]);

  const productIds = topProductsRaw.map((i) => i.productId);
  const productDetails = productIds.length
    ? await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true, name: true, category: { select: { name: true } } },
      })
    : [];

  const topProducts = topProductsRaw.map((item) => {
    const p = productDetails.find((d) => d.id === item.productId);
    return {
      name: p?.name ?? "—",
      category: p?.category.name ?? "",
      quantity: Number(item._sum.quantity ?? 0),
      total: Number(item._sum.total ?? 0),
    };
  });

  const lowStock = allActiveProducts
    .filter((p) => Number(p.stock) <= Number(p.minStock))
    .slice(0, 10);

  const stockValue = allActiveProducts.reduce((sum, p) => sum + Number(p.stock) * Number(p.costPrice), 0);
  const potentialRevenue = allActiveProducts.reduce((sum, p) => sum + Number(p.stock) * Number(p.salePrice), 0);

  const monthProfit = monthSaleItems.reduce(
    (sum, i) => sum + Number(i.total) - Number(i.quantity) * Number(i.unitCost),
    0,
  );
  const monthPurchaseTotal = purchaseItemsMonth.reduce((sum, i) => sum + Number(i.total), 0);

  return (
    <div className="space-y-6 pb-6">
      <div className="flex items-center gap-2">
        <BarChart3 size={22} className="text-teal-700" />
        <div>
          <h1 className="text-xl font-bold text-zinc-900">Reportes</h1>
          <p className="text-sm text-zinc-500">
            {now.toLocaleDateString("es-AR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Ventas */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Ventas</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard title="Hoy" value={ars(Number(todaySales._sum.total ?? 0))} sub={`${todaySales._count} transacciones`} />
          <StatCard title="Últimos 7 días" value={ars(Number(weekSales._sum.total ?? 0))} sub={`${weekSales._count} transacciones`} />
          <StatCard title="Este mes" value={ars(Number(monthSales._sum.total ?? 0))} sub={`${monthSales._count} transacciones`} />
        </div>
      </section>

      {/* Finanzas */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-400">Finanzas del mes</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard title="Ganancia bruta" value={ars(monthProfit)} sub="Ingresos menos costo" accent="emerald" />
          <StatCard title="Compras" value={ars(monthPurchaseTotal)} sub="Total invertido en stock" accent="amber" />
          <StatCard title="Valor del inventario" value={ars(stockValue)} sub={`Venta potencial: ${ars(potentialRevenue)}`} />
        </div>
      </section>

      {/* Top productos + Stock bajo */}
      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-1 font-semibold text-zinc-900">Top productos del mes</h3>
          <p className="mb-4 text-xs text-zinc-400">Por unidades vendidas</p>
          {topProducts.length === 0 ? (
            <p className="text-sm text-zinc-400">Sin ventas este mes.</p>
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

        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <h3 className="mb-1 font-semibold text-zinc-900">Stock bajo / agotado</h3>
          <p className="mb-4 text-xs text-zinc-400">Productos por debajo del mínimo</p>
          {lowStock.length === 0 ? (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              Todo el stock está en orden.
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.map((p) => {
                const critical = Number(p.stock) === 0;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between rounded-xl px-4 py-2.5 ${
                      critical ? "bg-red-50" : "bg-amber-50"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{p.name}</p>
                      <p className="text-xs text-zinc-500">{p.category.name}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${critical ? "text-red-600" : "text-amber-700"}`}>
                        {Number(p.stock)} actual
                      </p>
                      <p className="text-xs text-zinc-400">mín. {Number(p.minStock)}</p>
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

function StatCard({
  title, value, sub, accent = "teal",
}: {
  title: string; value: string; sub: string; accent?: "teal" | "emerald" | "amber";
}) {
  const colors = { teal: "text-teal-700", emerald: "text-emerald-700", amber: "text-amber-600" };
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold text-zinc-500">{title}</p>
      <p className={`mt-1 text-2xl font-bold ${colors[accent]}`}>{value}</p>
      <p className="mt-0.5 text-xs text-zinc-400">{sub}</p>
    </div>
  );
}
