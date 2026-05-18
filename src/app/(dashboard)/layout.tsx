import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { authOptions } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <Sidebar role={session.user.role} />
      <div className="flex w-full flex-col">
        <Header />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
