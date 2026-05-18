import { ModulePage } from "@/components/module-page";

export default function PurchasesPage() {
  return (
    <ModulePage
      title="Compras"
      description="Registro de compras a proveedores con actualizacion automatica de stock."
      bullets={[
        "Carga de items, costo unitario y observaciones por operacion.",
        "Historial filtrable por proveedor y fecha.",
        "Integrado con valorizacion de stock.",
      ]}
    />
  );
}
