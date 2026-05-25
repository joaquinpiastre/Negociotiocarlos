import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PaymentMethod } from "@prisma/client";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { amount, method, notes, paidAt } = body as {
    amount: number;
    method: string;
    notes?: string;
    paidAt?: string;
  };

  if (!amount || amount <= 0) return Response.json({ error: "Monto inválido" }, { status: 400 });
  if (!method) return Response.json({ error: "Método de pago requerido" }, { status: 400 });

  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) return Response.json({ error: "Proveedor no encontrado" }, { status: 404 });

  const payment = await prisma.supplierPayment.create({
    data: {
      supplierId: id,
      amount,
      method: method as PaymentMethod,
      notes: notes || null,
      paidAt: paidAt ? new Date(paidAt) : new Date(),
    },
  });

  return Response.json(payment, { status: 201 });
}
