import { ModulePage } from "@/components/module-page";

export default function SalesPage() {
  return (
    <ModulePage
      title="Ventas (POS)"
      description="Caja rapida para registrar ventas, aplicar descuentos y elegir medio de pago."
      bullets={[
        "Siguiente paso: carrito en tiempo real + lectura de codigos.",
        "Descuento de stock automatico al confirmar la venta.",
        "Base preparada para agregar facturacion fiscal en una etapa futura.",
      ]}
    />
  );
}
