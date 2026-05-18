import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = 20;

  const where = search
    ? {
        active: true,
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { barcode: { contains: search } },
          { brand: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : { active: true };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, supplier: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return Response.json({ products, total, pages: Math.ceil(total / pageSize) });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, barcode, costPrice, salePrice, stock, minStock, categoryId, supplierId, brand, unitType } = body;

  if (!name || !categoryId || costPrice == null || salePrice == null) {
    return Response.json({ error: "Datos incompletos" }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: {
      name,
      barcode: barcode || null,
      costPrice: Number(costPrice),
      salePrice: Number(salePrice),
      stock: Number(stock ?? 0),
      minStock: Number(minStock ?? 1),
      categoryId,
      supplierId: supplierId || null,
      brand: brand || null,
      unitType: unitType ?? "UNIDAD",
    },
    include: { category: true },
  });

  return Response.json(product, { status: 201 });
}
