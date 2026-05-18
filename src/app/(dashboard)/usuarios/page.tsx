import { prisma } from "@/lib/prisma";
import { ModulePage } from "@/components/module-page";

export default async function UsersPage() {
  const users = await prisma.user.count();

  return (
    <ModulePage
      title="Usuarios y roles"
      description="Administracion de accesos por rol: administrador, cajero y repositor."
      bullets={[
        `Usuarios registrados: ${users}`,
        "Control de estado activo/inactivo y ultimo acceso.",
        "Permisos preparados para proteger rutas por rol.",
      ]}
    />
  );
}
