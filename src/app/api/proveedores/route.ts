import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { products: true, purchaseOps: true } },
      purchaseOps: { include: { items: { select: { total: true } } } },
      payments: { select: { amount: true } },
    },
  });

  const result = suppliers.map((s) => {
    const totalPurchased = s.purchaseOps.reduce(
      (sum, p) => sum + p.items.reduce((s2, i) => s2 + Number(i.total), 0),
      0,
    );
    const totalPaid = s.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const { purchaseOps, payments, ...rest } = s;
    return { ...rest, totalPurchased, totalPaid, balance: totalPurchased - totalPaid };
  });

  return Response.json(result);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { name, phone, email, address, cuit, notes } = body;

  if (!name) return Response.json({ error: "Nombre requerido" }, { status: 400 });

  const supplier = await prisma.supplier.create({
    data: {
      name,
      phone: phone || null,
      email: email || null,
      address: address || null,
      cuit: cuit || null,
      notes: notes || null,
    },
  });

  return Response.json(supplier, { status: 201 });
}
