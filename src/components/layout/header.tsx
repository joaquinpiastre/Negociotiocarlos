import { getServerSession } from "next-auth";
import { LogoutButton } from "@/components/auth/logout-button";
import { authOptions } from "@/lib/auth";

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  CAJERO: "Vendedor",
  REPOSITOR: "Repositor",
};

export async function Header() {
  const session = await getServerSession(authOptions);
  const roleLabel = roleLabels[session?.user?.role ?? ""] ?? session?.user?.role;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Mercadito Tio Carlos</h2>
          <p className="text-xs text-zinc-400">Chos Malal, Neuquen</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-semibold text-zinc-800">{session?.user?.name}</p>
            <p className="text-xs text-zinc-400">{roleLabel}</p>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
