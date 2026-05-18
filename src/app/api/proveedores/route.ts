import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true, purchaseOps: true } } },
  });

  return Response.json(suppliers);
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
