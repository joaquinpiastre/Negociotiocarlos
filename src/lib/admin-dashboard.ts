import { prisma } from "@/lib/prisma";

export type AdminDashboardData = Awaited<ReturnType<typeof getAdminDashboardData>>;
export type EmployeeDashboardData = Awaited<ReturnType<typeof getEmployeeDashboardData>>;

export async function getAdminDashboardData() {
  const now = new Date();

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    activeProducts,
    todaySales,
    monthSales,
    lastMonthSales,
    monthSaleItems,
    recentSales,
    topSaleItemsRaw,
    last7DaysSales,
    usersCount,
    suppliersCount,
    todayMovementsCount,
  ] = await Promise.all([
    prisma.product.findMany({
      where: { active: true },
      select: {
        id: true,
        name: true,
        stock: true,
        costPrice: true,
        minStock: true,
        category: { select: { name: true } },
      },
      orderBy: { stock: "asc" },
    }),
    prisma.sale.aggregate({
      _sum: { total: true },
      _count: true,
      where: { createdAt: { gte: startOfToday } },
    }),
    prisma.sale.aggregate({
      _sum: { total: true },
      _count: true,
      where: { createdAt: { gte: startOfMonth } },
    }),
    prisma.sale.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
    }),
    prisma.saleItem.findMany({
      where: { sale: { createdAt: { gte: startOfMonth } } },
      select: {
        quantity: true,
        total: true,
        unitCost: true,
      },
    }),
    prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        user: { select: { name: true } },
        items: { take: 1, include: { product: { select: { name: true } } } },
      },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true, total: true },
      where: { sale: { createdAt: { gte: startOfMonth } } },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.sale.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { total: true, createdAt: true },
    }),
    prisma.user.count({ where: { active: true } }),
    prisma.supplier.count(),
    prisma.stockMovement.count({ where: { createdAt: { gte: startOfToday } } }),
  ]);

  const stockValue = activeProducts.reduce(
    (sum, p) => sum + Number(p.stock) * Number(p.costPrice),
    0,
  );
  const lowStockProducts = activeProducts.filter(
    (p) => Number(p.stock) <= Number(p.minStock),
  );
  const productsWithoutPrice = activeProducts.filter(
    (p) => Number(p.costPrice) === 0,
  );

  const monthProfit = monthSaleItems.reduce((sum, item) => {
    return sum + Number(item.total) - Number(item.quantity) * Number(item.unitCost);
  }, 0);

  const thisMonthTotal = Number(monthSales._sum.total ?? 0);
  const lastMonthTotal = Number(lastMonthSales._sum.total ?? 0);
  const monthGrowth =
    lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0;

  const chartData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric" });
    const dayStart = new Date(d);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    const total = last7DaysSales
      .filter((s) => {
        const sd = new Date(s.createdAt);
        return sd >= dayStart && sd <= dayEnd;
      })
      .reduce((sum, s) => sum + Number(s.total), 0);
    return { day: label, total };
  });

  const topProductIds = topSaleItemsRaw.map((i) => i.productId);
  const topProductDetails =
    topProductIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: topProductIds } },
          select: { id: true, name: true, category: { select: { name: true } } },
        })
      : [];

  const topProducts = topSaleItemsRaw.map((item) => {
    const p = topProductDetails.find((d) => d.id === item.productId);
    return {
      name: p?.name ?? "—",
      category: p?.category.name ?? "",
      quantity: Number(item._sum.quantity ?? 0),
      total: Number(item._sum.total ?? 0),
    };
  });

  return {
    kpis: {
      stockValue,
      todayIncome: Number(todaySales._sum.total ?? 0),
      todaySalesCount: todaySales._count,
      monthIncome: thisMonthTotal,
      monthSalesCount: monthSales._count,
      lastMonthIncome: lastMonthTotal,
      monthGrowth,
      monthProfit,
      productsCount: activeProducts.length,
      lowStockCount: lowStockProducts.length,
      usersCount,
      suppliersCount,
      todayMovementsCount,
    },
    productsWithoutPrice: productsWithoutPrice.slice(0, 10),
    lowStockProducts: lowStockProducts.slice(0, 6),
    recentSales,
    topProducts,
    chartData,
  };
}

export async function getEmployeeDashboardData(userId: string) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [todayMovements, todaySales] = await Promise.all([
    prisma.stockMovement.findMany({
      where: { userId, createdAt: { gte: startOfToday } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { product: { select: { name: true } } },
    }),
    prisma.sale.aggregate({
      _sum: { total: true },
      _count: true,
      where: { userId, createdAt: { gte: startOfToday } },
    }),
  ]);

  return {
    todayMovements,
    todaySalesCount: todaySales._count,
    todaySalesTotal: Number(todaySales._sum.total ?? 0),
  };
}
