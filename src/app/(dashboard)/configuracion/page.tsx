import { prisma } from "@/lib/prisma";
import { ModulePage } from "@/components/module-page";

export default async function SettingsPage() {
  const settings = await prisma.businessSettings.findFirst();
  return (
    <ModulePage
      title="Configuracion del negocio"
      description="Datos generales de Tio Carlos para comprobantes y reglas de negocio."
      bullets={[
        `Negocio: ${settings?.businessName ?? "Tio Carlos"}`,
        `Ubicacion: ${settings?.location ?? "Chos Malal"}`,
        "Moneda ARS y porcentaje de ganancia sugerida configurable.",
      ]}
    />
  );
}
