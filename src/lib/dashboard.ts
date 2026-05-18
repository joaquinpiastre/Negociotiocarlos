import { prisma } from "@/lib/prisma";

export async function getDashboardData() {
  const [productsCount, products, todaySales, recentMoves] = await Promise.all([
    prisma.product.count({ where: { active: true } }),
    prisma.product.findMany({
      where: { active: true },
      select: { stock: true, minStock: true },
    }),
    prisma.sale.aggregate({
      _sum: { total: true },
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { product: { select: { name: true } }, user: { select: { name: true } } },
    }),
  ]);

  return {
    productsCount,
    lowStock: products.filter((item) => Number(item.stock) <= Number(item.minStock)).length,
    todayIncome: Number(todaySales._sum.total ?? 0),
    recentMoves,
  };
}
