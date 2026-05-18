import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const { code } = await params;

  const product = await prisma.product.findUnique({
    where: { barcode: decodeURIComponent(code) },
    include: { category: true },
  });

  if (!product) {
    return Response.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  return Response.json(product);
}
