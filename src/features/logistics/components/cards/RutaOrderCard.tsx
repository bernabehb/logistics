"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Package, Grid3x3, LayoutGrid, PaintbrushVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RutaPedido {
  id: string;
  clientName: string;
  date: string;
  warehouses: { id: string; status: 'pending' | 'in-progress' | 'ready' }[];
  vendedor: string;
  deliveryType: 'sucursal' | 'domicilio';
  hasGlassCut?: boolean;
}

interface RutaOrderCardProps {
  pedido: RutaPedido;
}

export function RutaOrderCard({ pedido }: RutaOrderCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] overflow-hidden">
      <CardContent className="px-3 py-4 flex flex-col gap-3">
        {/* Header: ID */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">
            #{pedido.id}
          </span>
        </div>

        {/* Client Name */}
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
            Cliente
          </span>
          <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
            {pedido.clientName}
          </span>
        </div>

        {/* Date and Vendor */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <Calendar className="size-2.5" />
              Fecha
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {pedido.date}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <User className="size-2.5" />
              Vendedor
            </div>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">
              {pedido.vendedor}
            </span>
          </div>
        </div>

        {/* Warehouses Grid */}
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          {[
            { id: "Aluminio", label: "ALUM.", Icon: Grid3x3 },
            { id: "Vidrio", label: "VID.", Icon: LayoutGrid },
            { id: "Herrajes", label: "HERR.", Icon: PaintbrushVertical },
          ].filter(wh => pedido.warehouses.some(pwh => pwh.id === wh.id)).map(({ id, label, Icon }) => {
            const whInfo = pedido.warehouses.find(w => w.id === id)!;

            const statusColors = {
              pending: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]",
              'in-progress': "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]",
              ready: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
            };

            return (
              <div
                key={id}
                className="flex flex-col items-center gap-1.5 py-2 px-1 rounded-lg bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-100 dark:border-slate-700 shadow-sm"
              >
                <Icon className="size-3.5 text-slate-400 dark:text-slate-500" />
                <div className={cn("size-2.5 rounded-full transition-colors duration-300", statusColors[whInfo.status])} />
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  {label}
                </span>
                {id === "Vidrio" && pedido.hasGlassCut && (
                  <Badge variant="secondary" className="mt-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none px-1.5 py-0 text-[8px] font-black uppercase tracking-tighter">
                    Corte
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
