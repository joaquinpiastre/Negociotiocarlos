import { ModulePage } from "@/components/module-page";

export default function SuppliersPage() {
  return (
    <ModulePage
      title="Proveedores"
      description="Administracion de datos comerciales y relacion con productos."
      bullets={[
        "ABM de proveedores con telefono, email, direccion y CUIT.",
        "Vista de compras historicas por proveedor.",
        "Control de productos sin proveedor asignado.",
      ]}
    />
  );
}
