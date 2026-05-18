import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });

  return Response.json(categories);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const body = await request.json();
  const { name } = body;

  if (!name) return Response.json({ error: "Nombre requerido" }, { status: 400 });

  try {
    const category = await prisma.category.create({ data: { name } });
    return Response.json(category, { status: 201 });
  } catch {
    return Response.json({ error: "Ya existe una categoría con ese nombre" }, { status: 409 });
  }
}
