"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";

const ADMIN_ONLY_ROUTES = new Set([
  "/compras",
  "/proveedores",
  "/categorias",
  "/reportes",
  "/usuarios",
  "/configuracion",
]);

interface SidebarProps {
  role: string;
}

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = role === "ADMIN";
  const items = isAdmin
    ? navigationItems
    : navigationItems.filter((i) => !ADMIN_ONLY_ROUTES.has(i.href));

  return (
    <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white p-4 lg:block">
      <div className="mb-6 flex items-center gap-3 rounded-xl bg-teal-800 p-3 text-white">
        <Image
          src="/logo.jpg"
          alt="Mercadito Tio Carlos"
          width={52}
          height={52}
          className="rounded-full border-2 border-teal-600 object-cover"
        />
        <div>
          <p className="text-xs uppercase tracking-wide text-teal-200">Sistema</p>
          <h1 className="text-base font-bold leading-tight">Tio Carlos</h1>
          <p className="text-xs text-teal-200">Chos Malal</p>
        </div>
      </div>

      <nav className="space-y-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-teal-50 text-teal-900"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
              )}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
