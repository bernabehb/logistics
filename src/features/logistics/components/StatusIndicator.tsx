import React from 'react';
import { cn } from "@/lib/utils";

type Status = 'pending' | 'in-progress' | 'ready' | 'none';

interface StatusCircleProps {
  status: Status;
}

export function StatusCircle({ status }: StatusCircleProps) {
  if (status === 'none') {
    return <span className="text-slate-300 dark:text-slate-600 font-bold text-lg leading-none">-</span>;
  }
  
  return (
    <div 
      className={cn(
        "w-[14px] h-[14px] rounded-full shadow-inner ring-2 ring-white dark:ring-transparent",
        status === 'pending' && "bg-red-500 shadow-red-500/40", 
        status === 'in-progress' && "bg-amber-500 shadow-amber-500/40",
        status === 'ready' && "bg-green-500 shadow-green-500/40"
      )} 
    />
  );
}

interface StatusPillProps {
  status: Status;
}

export function StatusPill({ status }: StatusPillProps) {
  const config = {
    'pending': { 
      label: 'Pendiente', 
      classes: 'bg-red-50/80 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20 group-hover:bg-red-100 dark:group-hover:bg-red-500/20' 
    },
    'in-progress': { 
      label: 'En Proceso', 
      classes: 'bg-orange-50/80 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/20' 
    },
    'ready': { 
      label: 'Listo', 
      classes: 'bg-green-50/80 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20 group-hover:bg-green-100 dark:group-hover:bg-green-500/20' 
    },
    'none': { 
      label: 'N/A', 
      classes: 'bg-slate-50 dark:bg-[#1E293B] text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700' 
    }
  };
  
  if (status === 'none') return null;

  const { label, classes } = config[status];

  return (
    <>
      {/* Mobile: solo dot */}
      <div className={cn(
        "md:hidden w-[16px] h-[16px] rounded-full shadow-inner ring-2 ring-white dark:ring-transparent",
        status === 'pending' && "bg-red-500 shadow-red-500/40",
        status === 'in-progress' && "bg-amber-500 shadow-amber-500/40",
        status === 'ready' && "bg-green-500 shadow-green-500/40"
      )} />
      {/* Desktop: pill completo */}
      <div className={cn(
        "hidden md:flex px-4 py-1.5 rounded-full text-[13px] font-bold border items-center gap-2 w-fit min-w-[110px] justify-center shadow-sm transition-colors",
        classes
      )}>
        <div className={cn(
          "w-[6px] h-[6px] rounded-full",
          status === 'pending' && "bg-red-500 dark:bg-red-400",
          status === 'in-progress' && "bg-orange-500 dark:bg-orange-400",
          status === 'ready' && "bg-green-500 dark:bg-green-400"
        )} />
        {label}
      </div>
    </>
  );
}
