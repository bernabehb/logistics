"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Package, Grid3x3, LayoutGrid, PaintbrushVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export type RutaStatus = 'pending' | 'in-progress' | 'ready' | 'none';
export type RutaInvoiceType = 'normal' | 'anticipada';

export interface RutaPedido {
  id: string;
  clientName: string;
  date: string;
  warehouses: { id: string; status: 'pending' | 'in-progress' | 'ready' }[];
  vendedor: string;
  deliveryType: 'sucursal' | 'domicilio';
  hasGlassCut?: boolean;
  estadoGeneral: RutaStatus;
  type: RutaInvoiceType;
  completedDeliveries?: number;
  block?: string;
  montoTotal?: number;
}

interface RutaOrderCardProps {
  pedido: RutaPedido;
  activeStatusFilters?: RutaStatus[];
}

export function RutaOrderCard({ pedido, activeStatusFilters }: RutaOrderCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] overflow-hidden">
      <CardContent className="px-3 py-4 flex flex-col gap-3">
        {/* Header: ID and Anticipada Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight uppercase">
              Factura: {pedido.id}
            </span>
          </div>
          {pedido.type === 'anticipada' && pedido.completedDeliveries !== undefined && (
            <div className="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-[9px] font-black px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-500/30 uppercase tracking-widest shadow-sm">
              Entregado: {pedido.completedDeliveries}
            </div>
          )}
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
            { id: "Aluminio", label: "ALUMINIO", Icon: Grid3x3 },
            { id: "Vidrio", label: "VIDRIO", Icon: LayoutGrid },
            { id: "Herrajes", label: "HERRAJES", Icon: PaintbrushVertical },
          ].filter(wh => {
            const pwh = pedido.warehouses.find(p => p.id === wh.id);
            if (!pwh) return false;
            
            // Apply status filter if active
            if (activeStatusFilters && activeStatusFilters.length > 0) {
              return activeStatusFilters.includes(pwh.status);
            }
            
            return true;
          }).map(({ id, label, Icon }) => {
            const whInfo = pedido.warehouses.find(w => w.id === id)!;

            const statusColors = {
              pending: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]",
              'in-progress': "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]",
              ready: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
            };

            return (
              <div
                key={id}
                className="flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/50 shadow-sm h-[76px] relative"
              >
                <Icon className="size-3 text-slate-400 dark:text-slate-500 shrink-0" />
                <div className={cn("size-2 rounded-full shrink-0 transition-colors duration-300", statusColors[whInfo.status])} />
                <div className="flex flex-col items-center">
                  <span className="text-[9.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-tighter leading-tight">
                    {label}
                  </span>
                  {id === "Vidrio" && pedido.hasGlassCut && (
                    <div className="mt-0.5 bg-blue-600 dark:bg-blue-500 text-white dark:text-white px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider shadow-sm">
                      Corte
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
