import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, barcode, costPrice, ivaRate, internalTaxPercent, salePrice, stock, minStock, categoryId, supplierId, brand, unitType } = body;

  const product = await prisma.product.update({
    where: { id },
    data: {
      name,
      barcode: barcode || null,
      costPrice: Number(costPrice),
      ivaRate: Number(ivaRate ?? 0),
      internalTaxPercent: Number(internalTaxPercent ?? 0),
      salePrice: Number(salePrice),
      stock: Number(stock),
      minStock: Number(minStock),
      categoryId,
      supplierId: supplierId || null,
      brand: brand || null,
      unitType,
    },
    include: { category: true },
  });

  return Response.json(product);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  await prisma.product.update({ where: { id }, data: { active: false } });

  return Response.json({ success: true });
}
