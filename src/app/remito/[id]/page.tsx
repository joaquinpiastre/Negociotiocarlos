import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { RemitoActions } from "./remito-actions";

export default async function RemitoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { id } = await params;

  const [purchase, settings] = await Promise.all([
    prisma.purchase.findUnique({
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
    }),
    prisma.businessSettings.findFirst(),
  ]);

  if (!purchase) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Compra no encontrada.</p>
      </div>
    );
  }

  const total = purchase.items.reduce((sum, i) => sum + Number(i.total), 0);

  const ars = (v: number) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(v);

  const fecha = new Date(purchase.purchasedAt).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const remitoNumber = purchase.id.slice(-8).toUpperCase();

  return (
    <div className="min-h-screen bg-zinc-100 py-8 px-4 print:bg-white print:py-0 print:px-0">
      {/* Botones (se ocultan al imprimir) */}
      <div className="mb-6 flex justify-center gap-3 print:hidden">
        <RemitoActions remitoNumber={remitoNumber} />
      </div>

      {/* Documento */}
      <div id="remito-doc" className="mx-auto max-w-2xl rounded-2xl bg-white shadow-lg print:shadow-none print:rounded-none print:max-w-none">
        <div className="p-8">
          {/* Encabezado */}
          <div className="flex items-start justify-between border-b border-zinc-200 pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">{settings?.businessName ?? "Tio Carlos"}</h1>
              {settings?.location && <p className="text-sm text-zinc-500">{settings.location}</p>}
              {settings?.phone && <p className="text-sm text-zinc-500">{settings.phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Remito de compra</p>
              <p className="mt-1 text-xl font-bold text-teal-700">#{remitoNumber}</p>
              <p className="text-sm text-zinc-500">{fecha}</p>
            </div>
          </div>

          {/* Datos del proveedor */}
          <div className="mb-6 rounded-xl bg-zinc-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-400">Proveedor</p>
            <p className="font-semibold text-zinc-900">{purchase.supplier.name}</p>
            {purchase.supplier.cuit && (
              <p className="text-sm text-zinc-600">CUIT: {purchase.supplier.cuit}</p>
            )}
            {purchase.supplier.address && (
              <p className="text-sm text-zinc-600">{purchase.supplier.address}</p>
            )}
            {purchase.supplier.phone && (
              <p className="text-sm text-zinc-600">{purchase.supplier.phone}</p>
            )}
            {purchase.supplier.email && (
              <p className="text-sm text-zinc-600">{purchase.supplier.email}</p>
            )}
          </div>

          {/* Tabla de items */}
          <table className="w-full mb-6">
            <thead>
              <tr className="border-b-2 border-zinc-200">
                <th className="text-left pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Producto</th>
                <th className="text-right pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Cant.</th>
                <th className="text-right pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">P. unitario</th>
                <th className="text-right pb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Total</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item, idx) => (
                <tr key={item.id} className={idx % 2 === 0 ? "bg-zinc-50" : "bg-white"}>
                  <td className="py-2.5 pl-1 pr-4">
                    <p className="text-sm font-medium text-zinc-900">{item.product.name}</p>
                    {item.product.brand && (
                      <p className="text-xs text-zinc-400">{item.product.brand}</p>
                    )}
                    {item.product.barcode && (
                      <p className="text-xs text-zinc-400">Cód: {item.product.barcode}</p>
                    )}
                  </td>
                  <td className="py-2.5 text-right text-sm text-zinc-700">
                    {Number(item.quantity)}{" "}
                    <span className="text-xs text-zinc-400">
                      {item.product.unitType === "KG" ? "kg" : item.product.unitType === "LITRO" ? "L" : "u."}
                    </span>
                  </td>
                  <td className="py-2.5 text-right text-sm text-zinc-700">{ars(Number(item.costPrice))}</td>
                  <td className="py-2.5 text-right text-sm font-semibold text-zinc-900">{ars(Number(item.total))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-zinc-900">
                <td colSpan={3} className="pt-3 text-right text-sm font-semibold text-zinc-700">
                  TOTAL
                </td>
                <td className="pt-3 text-right text-lg font-bold text-zinc-900">{ars(total)}</td>
              </tr>
            </tfoot>
          </table>

          {/* Notas */}
          {purchase.notes && (
            <div className="rounded-xl border border-zinc-200 p-3 mb-6">
              <p className="text-xs font-semibold text-zinc-500 mb-1">Notas</p>
              <p className="text-sm text-zinc-700">{purchase.notes}</p>
            </div>
          )}

          {/* Pie */}
          <div className="border-t border-zinc-200 pt-4 flex items-center justify-between text-xs text-zinc-400">
            <span>Registrado por: {purchase.user.name}</span>
            <span>{settings?.receiptHeader ?? ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
