import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MovementType } from "@prisma/client";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const type = searchParams.get("type");
  const product = searchParams.get("product") ?? "";
  const pageSize = 30;

  const where: {
    type?: MovementType;
    product?: { name: { contains: string; mode: "insensitive" } };
  } = {};

  if (type && Object.values(MovementType).includes(type as MovementType)) {
    where.type = type as MovementType;
  }
  if (product) {
    where.product = { name: { contains: product, mode: "insensitive" } };
  }

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
      include: {
        product: { select: { name: true } },
        user: { select: { name: true } },
      },
    }),
    prisma.stockMovement.count({ where }),
  ]);

  return Response.json({ movements, total, pages: Math.ceil(total / pageSize) });
}
