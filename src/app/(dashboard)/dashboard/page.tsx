import { getServerSession } from "next-auth";
import { UserRole } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { getAdminDashboardData, getEmployeeDashboardData } from "@/lib/admin-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  if (session.user.role === UserRole.ADMIN) {
    const data = await getAdminDashboardData();
    return <AdminDashboard data={data} />;
  }

  const data = await getEmployeeDashboardData(session.user.id);
  return (
    <EmployeeDashboard userName={session.user.name ?? "Empleado"} data={data} />
  );
}
