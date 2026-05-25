import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const [supplier, purchases, payments] = await Promise.all([
    prisma.supplier.findUnique({ where: { id } }),
    prisma.purchase.findMany({
      where: { supplierId: id },
      orderBy: { purchasedAt: "desc" },
      include: {
        user: { select: { name: true } },
        items: { include: { product: { select: { name: true, unitType: true } } } },
      },
    }),
    prisma.supplierPayment.findMany({
      where: { supplierId: id },
      orderBy: { paidAt: "desc" },
    }),
  ]);

  if (!supplier) return Response.json({ error: "No encontrado" }, { status: 404 });

  const totalPurchased = purchases.reduce(
    (sum, p) => sum + p.items.reduce((s, i) => s + Number(i.total), 0),
    0,
  );
  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  const purchasesWithTotal = purchases.map((p) => ({
    ...p,
    total: p.items.reduce((s, i) => s + Number(i.total), 0),
  }));

  return Response.json({
    supplier,
    purchases: purchasesWithTotal,
    payments,
    totals: { totalPurchased, totalPaid, balance: totalPurchased - totalPaid },
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { name, phone, email, address, cuit, notes } = body;

  const supplier = await prisma.supplier.update({
    where: { id },
    data: {
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      cuit: cuit || null,
      notes: notes || null,
    },
  });

  return Response.json(supplier);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  try {
    await prisma.supplier.delete({ where: { id } });
    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "No se puede eliminar: tiene compras o productos asociados" },
      { status: 409 },
    );
  }
}
