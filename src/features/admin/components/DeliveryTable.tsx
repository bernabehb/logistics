"use client";

import { DeliveryRecord, DeliveryStatus } from "@/features/admin/models";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  CheckCircle2,
  Clock3,
  AlertCircle,
  XCircle,
  MapPin,
  Package,
} from "lucide-react";

interface DeliveryTableProps {
  deliveries: DeliveryRecord[];
}

const STATUS_CONFIG: Record<
  DeliveryStatus,
  { label: string; icon: React.ElementType; cls: string; row: string }
> = {
  delivered: {
    label: "Entregado",
    icon: CheckCircle2,
    cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    row: "",
  },
  "in-progress": {
    label: "En curso",
    icon: Clock3,
    cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    row: "",
  },
  pending: {
    label: "Pendiente",
    icon: AlertCircle,
    cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    row: "bg-amber-50/40 dark:bg-amber-900/10",
  },
  failed: {
    label: "Fallido",
    icon: XCircle,
    cls: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800",
    row: "bg-red-50/40 dark:bg-red-900/10",
  },
};

export function DeliveryTable({ deliveries }: DeliveryTableProps) {
  if (deliveries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 gap-3">
        <Package className="w-10 h-10 opacity-40" />
        <p className="font-medium text-sm">No hay entregas en este periodo</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B]/60">
            <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Pedido
            </th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">
              Cliente
            </th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden md:table-cell">
              Dirección
            </th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 hidden lg:table-cell">
              Bloque
            </th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Fecha de Factura
            </th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
              Fecha de Entrega
            </th>
            <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">
              Estado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {deliveries.map((delivery) => {
            const config = STATUS_CONFIG[delivery.status];
            const Icon = config.icon;
            return (
              <tr
                key={delivery.id}
                className={cn(
                  "transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40",
                  config.row
                )}
              >
                <td className="px-4 py-3.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[13px]">
                    #{delivery.orderId}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {delivery.clientName}
                  </span>
                </td>
                <td className="px-4 py-3.5 hidden md:table-cell">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-[12px]">{delivery.address}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 hidden lg:table-cell">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 whitespace-nowrap">
                    {(delivery as any).block || "S/A"}
                  </span>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <span className="text-slate-600 dark:text-slate-400 text-[12px]">
                    {format(parseISO(delivery.date), "d MMM yyyy", { locale: es })}
                  </span>
                </td>
                <td className="px-4 py-3.5 whitespace-nowrap">
                  <div className="flex flex-col">
                    {delivery.status === "delivered" && (delivery as any).deliveryDate ? (
                      <>
                        <span className="text-slate-700 dark:text-slate-300 font-medium text-[12px]">
                          {format(parseISO((delivery as any).deliveryDate), "d MMM yyyy", { locale: es })}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          {format(parseISO((delivery as any).deliveryDate), "h:mm a").toUpperCase()}
                        </span>
                      </>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-[12px] font-medium">—</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border",
                      config.cls
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {config.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
