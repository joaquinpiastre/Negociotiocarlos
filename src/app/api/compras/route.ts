import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MovementType } from "@prisma/client";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        supplier: { select: { name: true } },
        user: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    }),
    prisma.purchase.count(),
  ]);

  return Response.json({ purchases, total, pages: Math.ceil(total / pageSize) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { supplierId, items, notes } = body as {
    supplierId: string;
    items: Array<{ productId: string; quantity: number; costPrice: number }>;
    notes?: string;
  };

  if (!supplierId || !items?.length) {
    return Response.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
  });

  const purchase = await prisma.$transaction(async (tx) => {
    const purchase = await tx.purchase.create({
      data: {
        supplierId,
        userId: session.user.id,
        notes: notes || null,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            costPrice: i.costPrice,
            total: i.costPrice * i.quantity,
          })),
        },
      },
    });

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      const stockBefore = Number(product.stock);
      const stockAfter = stockBefore + item.quantity;

      await tx.product.update({
        where: { id: item.productId },
        data: { stock: stockAfter, costPrice: item.costPrice },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: MovementType.ENTRADA,
          reason: `Compra a proveedor`,
          stockBefore,
          stockAfter,
          userId: session.user.id,
        },
      });
    }

    return purchase;
  });

  return Response.json({ success: true, purchaseId: purchase.id }, { status: 201 });
}
