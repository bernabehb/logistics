"use client";

import { Package, Truck, LogOut, ClipboardList, DollarSign, ShieldCheck, Map, Layers, HelpCircle } from "lucide-react";
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
      name: "Rutas",
      href: "/logistics/rutas",
      icon: Map,
      roles: ["Logistica"],
    },
    {
      name: "Bloques",
      href: "/logistics/bloques",
      icon: Layers,
      roles: ["Logistica"],
    },
    {
      name: "Autorizar salida",
      href: "/logistics/autorizar-salida",
      icon: ClipboardList,
      roles: ["Logistica", "Guardia"],
    },
    {
      name: "Unidades",
      href: "/logistics/unidades",
      icon: Truck,
      roles: ["Logistica"],
    },
  ].filter((item) => userRole && item.roles.includes(userRole));

  return (
    <aside className={cn(
      "fixed left-0 top-0 bottom-0 w-[240px] bg-white/40 dark:bg-slate-950/45 backdrop-blur-2xl border-r border-white/20 dark:border-white/10 flex flex-col transition-transform duration-300 z-50 shadow-[0_8px_32px_0_rgba(0,0,0,0.06)]",
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      {/* Brand Header */}
      <div className="flex items-center px-6 h-20 border-b border-white/20 dark:border-white/10">
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
                  "relative flex items-center gap-3 pl-5 pr-3 py-2.5 rounded-xl text-sm font-semibold transition-all group border overflow-hidden",
                  isActive
                    ? "bg-white/20 dark:bg-white/5 text-slate-900 dark:text-white border-white/30 dark:border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.03)] backdrop-blur-md"
                    : "border-transparent text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-6 bg-cyan-400 dark:bg-cyan-400 rounded-r-md" />
                )}
                <item.icon className={cn(
                  "size-5 transition-colors",
                  isActive ? "text-cyan-500 dark:text-cyan-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400"
                )} />
                <span>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
 
      {/* Footer Profile / Theme Toggle */}
      <div className="p-4 border-t border-slate-200/40 dark:border-slate-800/40 flex flex-col gap-4">
        <Link
          href="/logistics/ayuda"
          onClick={onClose}
          className={cn(
            "relative flex items-center gap-3 pl-5 pr-3 py-2.5 rounded-xl text-sm font-semibold transition-all group border overflow-hidden",
            pathname.startsWith("/logistics/ayuda")
              ? "bg-white/20 dark:bg-white/5 text-slate-900 dark:text-white border-white/30 dark:border-white/10 shadow-[0_4px_12px_rgba(0,0,0,0.03)] backdrop-blur-md"
              : "border-transparent text-slate-500 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200"
          )}
        >
          {pathname.startsWith("/logistics/ayuda") && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-6 bg-cyan-400 dark:bg-cyan-400 rounded-r-md" />
          )}
          <HelpCircle className={cn(
            "size-5 transition-colors",
            pathname.startsWith("/logistics/ayuda") ? "text-cyan-500 dark:text-cyan-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400"
          )} />
          <span>Manual de Usuario</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-850 dark:text-slate-200 capitalize">{userName || "Cargando..."}</span>
              {userRole && (
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 capitalize">{userRole}</span>
              )}
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
