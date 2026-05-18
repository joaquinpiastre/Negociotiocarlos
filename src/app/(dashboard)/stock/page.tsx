import { ModulePage } from "@/components/module-page";

export default function StockPage() {
  return (
    <ModulePage
      title="Control de stock"
      description="Registro de entradas, salidas, ajustes, perdidas, devoluciones y vencimientos."
      bullets={[
        "Movimientos guardan stock anterior/nuevo, usuario y motivo.",
        "Alertas automaticas para stock bajo y agotado.",
        "Historial listo para auditoria interna.",
      ]}
    />
  );
}
