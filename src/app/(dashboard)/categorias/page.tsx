import { prisma } from "@/lib/prisma";
import { ModulePage } from "@/components/module-page";

export default async function CategoriesPage() {
  const count = await prisma.category.count();
  return (
    <ModulePage
      title="Categorias"
      description="Gestion de rubros del mercado para ordenar productos y reportes."
      bullets={[
        `Categorias activas: ${count}`,
        "Permite crear, editar y eliminar categorias.",
        "Base para filtros rapidos en productos y dashboard.",
      ]}
    />
  );
}
