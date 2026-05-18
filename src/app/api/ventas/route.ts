import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MovementType, PaymentMethod } from "@prisma/client";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        user: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
    }),
    prisma.sale.count(),
  ]);

  return Response.json({ sales, total, pages: Math.ceil(total / pageSize) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return Response.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { items, discount, paymentMethod } = body as {
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
    discount: number;
    paymentMethod: string;
  };

  if (!items?.length || !paymentMethod) {
    return Response.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) }, active: true },
  });

  for (const item of items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return Response.json({ error: "Producto no encontrado" }, { status: 400 });
    if (Number(product.stock) < item.quantity) {
      return Response.json(
        { error: `Stock insuficiente para "${product.name}". Disponible: ${Number(product.stock)}` },
        { status: 400 },
      );
    }
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const total = Math.max(0, subtotal - (discount ?? 0));

  const sale = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        subtotal,
        discount: discount ?? 0,
        total,
        paymentMethod: paymentMethod as PaymentMethod,
        userId: session.user.id,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            total: i.unitPrice * i.quantity,
          })),
        },
      },
    });

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      const stockBefore = Number(product.stock);
      const stockAfter = stockBefore - item.quantity;

      await tx.product.update({ where: { id: item.productId }, data: { stock: stockAfter } });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          type: MovementType.SALIDA,
          reason: `Venta #${sale.id.slice(-6)}`,
          stockBefore,
          stockAfter,
          userId: session.user.id,
        },
      });
    }

    return sale;
  });

  return Response.json({ success: true, saleId: sale.id }, { status: 201 });
}
