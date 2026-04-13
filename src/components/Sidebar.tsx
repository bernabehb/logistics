"use client";

import { Package, Truck, LogOut, ClipboardList, DollarSign, ShieldCheck, Map } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/app/login/actions";


import { useEffect, useState } from "react";
import { getUserSession } from "@/app/login/actions";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Usuario");

  useEffect(() => {
    getUserSession().then((session) => {
      if (session) {
        setUserRole(session.role);
        setUserName(session.name || "Usuario");
      }
    });
  }, []);

  const navItems = [
    {
      name: "Control de pedidos",
      href: "/logistics",
      icon: Package,
      roles: ["Logistica"],
    },
    {
      name: "Rutas",
      href: "/logistics/rutas",
      icon: Map,
      roles: ["Logistica", "Admin"],
    },
    {
      name: "Cajas",
      href: "/cajas",
      icon: DollarSign,
      roles: ["Cajas"],
    },
    {
      name: "Asignación de pedidos",
      href: "/logistics/asignar-ruta",
      icon: ClipboardList,
      roles: ["Logistica"],
    },
    {
      name: "Asignación de unidades",
      href: "/logistics/asignar-unidades",
      icon: Truck,
      roles: ["Logistica"],
    },
    {
      name: "Autorizar salida",
      href: "/logistics/autorizar-salida",
      icon: ClipboardList,
      roles: ["Logistica", "Guardia"],
    },
    {
      name: "Panel de Control",
      href: "/admin",
      icon: ShieldCheck,
      roles: ["Admin"],
    },
    {
      name: "Mis entregas",
      href: "/chofer",
      icon: Truck,
      roles: ["Chofer"],
    },
  ].filter((item) => !userRole || item.roles.includes(userRole))
   .sort((a, b) => {
     const disabledNames = ["Asignación de pedidos", "Control de pedidos"];
     const isADisabled = disabledNames.includes(a.name);
     const isBDisabled = disabledNames.includes(b.name);
     if (isADisabled && !isBDisabled) return 1;
     if (!isADisabled && isBDisabled) return -1;
     return 0;
   });

  return (
    <aside className={cn(
      "fixed left-0 top-0 bottom-0 w-[240px] bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 z-50",
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      {/* Brand Header */}
      <div className="flex items-center px-6 h-20 border-b border-slate-200 dark:border-slate-800">
        <Image 
          src="/logo.png" 
          alt="COMPERS Logo" 
          width={160} 
          height={60} 
          className="object-contain dark:brightness-0 dark:invert" 
        />
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = item.href === '/logistics'
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <item.icon className={cn(
                  "size-5 transition-colors",
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400"
                )} />
                <span className={cn((item.name === "Asignación de pedidos" || item.name === "Control de pedidos") && "line-through opacity-70")}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile / Theme Toggle */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">{userRole || "Cargando..."}</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="size-4" />
            Cerrar Sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
