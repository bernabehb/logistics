"use client";

import { Package, Truck, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Logística",
      href: "/logistics",
      icon: Package,
    },
    {
      name: "Chofer",
      href: "/chofer",
      icon: Truck,
    },
  ];

  return (
    <aside className={cn(
      "fixed left-0 top-0 bottom-0 w-[240px] bg-white dark:bg-[#0F172A] border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 z-50",
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-slate-200 dark:border-slate-800">
        <div className="bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 p-2 rounded-lg shadow-sm transition-colors">
          <LayoutDashboard className="text-blue-600 dark:text-blue-400 size-5" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-200">COMPERS</h1>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <p className="px-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">
          Panel de Control
        </p>
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all group",
                  isActive
                    ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 hover:text-slate-900 dark:hover:text-slate-200"
                )}
              >
                <item.icon className={cn(
                  "size-5 transition-colors", 
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400"
                )} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Profile / Theme Toggle */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
         <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#1E293B] flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-xs">
                 US
             </div>
             <div className="flex flex-col">
                 <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-none">Usuario</span>
             </div>
         </div>
         <ThemeToggle />
      </div>
    </aside>
  );
}
