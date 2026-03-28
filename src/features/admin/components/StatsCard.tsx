"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color?: string;
  iconCls?: string;
  sub?: string;
}

export function StatsCard({ label, value, icon: Icon, color, iconCls, sub }: StatsCardProps) {
  return (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-2xl border bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 shadow-sm",
      color
    )}>
      <div className={cn(
        "flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0",
        iconCls || color || "bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400"
      )}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
          {value}
        </span>
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
          {label}
        </span>
        {sub && (
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}
