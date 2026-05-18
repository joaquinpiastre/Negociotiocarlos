import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return Response.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    return Response.json(
      { error: `No se puede eliminar: ${count} producto${count !== 1 ? "s" : ""} la usan` },
      { status: 409 },
    );
  }

  await prisma.category.delete({ where: { id } });
  return Response.json({ success: true });
}
