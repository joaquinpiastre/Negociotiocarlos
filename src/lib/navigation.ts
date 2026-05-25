import {
  BarChart3,
  Boxes,
  ClipboardList,
  Cog,
  LayoutDashboard,
  PackageSearch,
  ShoppingBag,
  ShoppingCart,
  Tags,
  Trash2,
  Truck,
  Users,
} from "lucide-react";

export const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/productos", label: "Productos", icon: Boxes },
  { href: "/scanner", label: "Scanner", icon: PackageSearch },
  { href: "/ventas", label: "Ventas", icon: ShoppingCart },
  { href: "/stock", label: "Stock", icon: ClipboardList },
  { href: "/bajas", label: "Bajas", icon: Trash2 },
  { href: "/compras", label: "Compras", icon: ShoppingBag },
  { href: "/proveedores", label: "Proveedores", icon: Truck },
  { href: "/categorias", label: "Categorias", icon: Tags },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/usuarios", label: "Usuarios", icon: Users },
  { href: "/configuracion", label: "Configuracion", icon: Cog },
];
