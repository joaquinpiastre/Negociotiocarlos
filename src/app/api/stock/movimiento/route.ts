import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MovementType } from "@prisma/client";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { productId, type, quantity, reason } = body as {
    productId: string;
    type: string;
    quantity: number;
    reason?: string;
  };

  if (!productId || !type || !quantity || quantity <= 0) {
    return Response.json({ error: "Datos incompletos o invalidos" }, { status: 400 });
  }

  const VALID_TYPES = ["ENTRADA", "SALIDA", "PERDIDA", "VENCIMIENTO", "AJUSTE"];
  if (!VALID_TYPES.includes(type)) {
    return Response.json({ error: "Tipo de movimiento invalido" }, { status: 400 });
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return Response.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  const stockBefore = Number(product.stock);
  const qty = Number(quantity);

  const isDecrease = ["SALIDA", "PERDIDA", "VENCIMIENTO", "AJUSTE"].includes(type);

  if (isDecrease && stockBefore < qty) {
    return Response.json(
      { error: `Stock insuficiente. Disponible: ${stockBefore}` },
      { status: 400 },
    );
  }

  const stockAfter = isDecrease ? stockBefore - qty : stockBefore + qty;

  const [movement] = await prisma.$transaction([
    prisma.stockMovement.create({
      data: {
        quantity: qty,
        type: type as MovementType,
        reason: reason ?? null,
        stockBefore,
        stockAfter,
        productId,
        userId: session.user.id,
      },
    }),
    prisma.product.update({
      where: { id: productId },
      data: { stock: stockAfter },
    }),
  ]);

  return Response.json({ success: true, movement, newStock: stockAfter });
}
