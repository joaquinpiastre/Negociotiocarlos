"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Boxes, ScanLine, ShoppingCart, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { navigationItems } from "@/lib/navigation";

const primaryItems = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { href: "/productos", label: "Productos", icon: Boxes },
  { href: "/scanner", label: "Scanner", icon: ScanLine },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
];

export function MobileNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  return (
    <>
      {/* More menu overlay */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More menu drawer */}
      {showMore && (
        <div className="fixed bottom-16 left-0 right-0 z-50 rounded-t-2xl border-t border-zinc-200 bg-white p-4 shadow-xl lg:hidden">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Mas opciones
          </p>
          <div className="grid grid-cols-3 gap-2">
            {navigationItems
              .filter((i) => !primaryItems.some((p) => p.href === i.href))
              .map(({ href, label, icon: Icon }) => {
                const active = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setShowMore(false)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl p-3 text-xs font-medium transition-colors",
                      active
                        ? "bg-teal-50 text-teal-800"
                        : "text-zinc-600 hover:bg-zinc-50",
                    )}
                  >
                    <Icon size={20} />
                    {label}
                  </Link>
                );
              })}
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white lg:hidden">
        <div className="flex">
          {primaryItems.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                  active ? "text-teal-800" : "text-zinc-500",
                )}
              >
                <Icon size={20} />
                {label}
              </Link>
            );
          })}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium text-zinc-500"
          >
            <MoreHorizontal size={20} />
            Mas
          </button>
        </div>
      </nav>
    </>
  );
}
