import { ModulePage } from "@/components/module-page";

export default function ReportsPage() {
  return (
    <ModulePage
      title="Reportes"
      description="Metricas de ventas, stock, compras y rentabilidad por periodos."
      bullets={[
        "Ventas por dia, semana y mes.",
        "Productos mas vendidos y de baja rotacion.",
        "Ganancia estimada y stock valorizado.",
      ]}
    />
  );
}
