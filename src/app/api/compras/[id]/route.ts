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

  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: {
      supplier: true,
      user: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true, brand: true, unitType: true, barcode: true } },
        },
      },
    },
  });

  if (!purchase) return Response.json({ error: "No encontrado" }, { status: 404 });

  const total = purchase.items.reduce((sum, i) => sum + Number(i.total), 0);

  return Response.json({ ...purchase, total });
}
