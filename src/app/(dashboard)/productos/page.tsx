import { revalidatePath } from "next/cache";
import { ModulePage } from "@/components/module-page";
import { Card } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

async function createProduct(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "");
  const barcode = String(formData.get("barcode") ?? "");
  const salePrice = Number(formData.get("salePrice") ?? 0);
  const costPrice = Number(formData.get("costPrice") ?? 0);
  const stock = Number(formData.get("stock") ?? 0);

  const category = await prisma.category.findFirst();
  if (!name || !category) return;

  await prisma.product.create({
    data: {
      name,
      barcode: barcode || null,
      salePrice,
      costPrice,
      stock,
      minStock: 1,
      categoryId: category.id,
    },
  });

  revalidatePath("/productos");
}

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: { category: true },
      take: 20,
    }),
    prisma.category.count(),
  ]);

  return (
    <div className="space-y-4">
      <ModulePage
        title="Gestion de productos"
        description="Alta, edicion y control rapido de articulos del mercado."
        bullets={[
          `Categorias cargadas: ${categories}`,
          "Busqueda por nombre/codigo y filtros avanzados en la siguiente iteracion.",
          "Scanner integrado para lectura por camara o lector USB.",
        ]}
      />

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">Crear producto rapido</h2>
        <form action={createProduct} className="grid gap-3 md:grid-cols-5">
          <input name="name" placeholder="Nombre" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <input name="barcode" placeholder="Codigo de barras" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <input name="costPrice" type="number" step="0.01" placeholder="Costo" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <input name="salePrice" type="number" step="0.01" placeholder="Venta" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <input name="stock" type="number" step="0.001" placeholder="Stock inicial" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <button className="rounded-lg bg-teal-800 px-4 py-2 font-medium text-white md:col-span-5 md:justify-self-start">
            Guardar producto
          </button>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-zinc-900">Listado</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-500">
                <th className="px-2 py-2">Producto</th>
                <th className="px-2 py-2">Codigo</th>
                <th className="px-2 py-2">Categoria</th>
                <th className="px-2 py-2">Stock</th>
                <th className="px-2 py-2">Precio venta</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id} className="border-b border-zinc-100">
                  <td className="px-2 py-2 font-medium text-zinc-900">{product.name}</td>
                  <td className="px-2 py-2 text-zinc-600">{product.barcode ?? "-"}</td>
                  <td className="px-2 py-2 text-zinc-600">{product.category.name}</td>
                  <td className="px-2 py-2 text-zinc-600">{String(product.stock)}</td>
                  <td className="px-2 py-2 text-zinc-600">${String(product.salePrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
