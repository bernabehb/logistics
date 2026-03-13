import React from "react";
import { StatusCircle, StatusPill } from "./StatusIndicator";
import { Grid3x3, LayoutGrid, PaintbrushVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogisticsRow } from "../models";

interface LogisticsTableProps {
  rows: LogisticsRow[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
}

export function LogisticsTable({
  rows,
  totalItems,
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
}: LogisticsTableProps) {
  const currentCount = rows.length;

  return (
    <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300">
      <div className="overflow-x-auto">
        <div className="min-w-0 md:min-w-[1024px]">
          {/* Table Header */}
      <div className="grid grid-cols-8 md:grid-cols-6 items-end px-2 py-3 md:p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#1E293B] text-[13px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.05em] uppercase">
        <div className="col-span-2 md:col-span-1 pl-1 md:pl-4">Factura #</div>
        <div className="col-span-3 md:col-span-1">Cliente</div>

        {/* Materials columns with icons */}
        <div className="col-span-1 flex flex-col items-center justify-center gap-1 md:gap-2">
          <Grid3x3 className="w-3 h-3 md:w-5 md:h-5 text-slate-400 dark:text-slate-500" />
          <span>Alum.</span>
        </div>
        <div className="col-span-1 flex flex-col items-center justify-center gap-1 md:gap-2">
          <LayoutGrid className="w-3 h-3 md:w-5 md:h-5 text-slate-400 dark:text-slate-500" />
          <span>Vid.</span>
        </div>
        <div className="col-span-1 flex flex-col items-center justify-center gap-1 md:gap-2">
          <PaintbrushVertical className="w-3 h-3 md:w-5 md:h-5 text-slate-400 dark:text-slate-500" />
          <span>Herr.</span>
        </div>

        <div className="col-span-1 md:col-span-1 flex justify-center text-center leading-tight">Est.</div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-100 dark:divide-slate-700">
        {rows.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
            No se encontraron pedidos.
          </div>
        ) : (
          rows.map((row, index) => (
            <div
              key={row.id}
              className={cn(
                "grid grid-cols-8 md:grid-cols-6 items-center px-2 py-2 md:p-5 transition-all duration-200 hover:bg-slate-50 dark:hover:bg-[#1E293B]/50 group animate-in slide-in-from-bottom-2 fade-in",
                row.estadoGeneral === 'pending' && "bg-red-50/30 dark:bg-red-900/10 hover:bg-red-50 dark:hover:bg-red-900/20"
              )}
              style={{ animationFillMode: 'both', animationDelay: `${index * 50}ms` }}
            >
              {/* Factura */}
              <div className="col-span-2 md:col-span-1 pl-1 md:pl-4 flex flex-col gap-0.5 md:gap-1.5">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-[17px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">#{row.id}</span>
                {row.isUrgent ? (
                  <span className="text-red-500 dark:text-red-400 font-bold text-[11px] flex items-center gap-0.5 tracking-wider uppercase">
                    <span></span> URG.
                  </span>
                ) : (
                  <span className="text-slate-500 dark:text-slate-400 text-[14px] truncate">{row.date}</span>
                )}
              </div>

              {/* Cliente */}
              <div className="col-span-3 md:col-span-1 flex items-center gap-1.5 md:gap-3.5 overflow-hidden">
                <div className={cn("flex-shrink-0 w-[26px] h-[26px] md:w-[38px] md:h-[38px] rounded-full flex items-center justify-center text-[10px] md:text-[14px] font-bold shadow-sm", row.clientColor)}>
                  {row.clientInitials}
                </div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-[16px] truncate min-w-0">{row.clientName}</span>
              </div>

              {/* Aluminio */}
              <div className="col-span-1 flex justify-center">
                <StatusCircle status={row.aluminio} />
              </div>

              {/* Vidrio */}
              <div className="col-span-1 flex justify-center">
                <StatusCircle status={row.vidrio} />
              </div>

              {/* Herrajes */}
              <div className="col-span-1 flex justify-center">
                <StatusCircle status={row.herrajes} />
              </div>

              {/* Estado General */}
              <div className="col-span-1 flex justify-center">
                <StatusPill status={row.estadoGeneral} />
              </div>
            </div>
          ))
        )}
      </div>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="px-3 md:px-6 py-3 md:py-4 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-0 md:justify-between text-[13px] md:text-[14px] text-slate-500 dark:text-slate-400 bg-white dark:bg-[#1E293B]">
        <div>
          Mostrando <span className="font-semibold text-slate-900 dark:text-slate-100">{currentCount}</span> de <span className="font-semibold text-slate-900 dark:text-slate-100">{totalItems}</span> pedidos activos
        </div>
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onPrevPage}
              disabled={currentPage === 1}
              className="px-3 md:px-4 py-1.5 md:py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={onNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 md:px-4 py-1.5 md:py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-[#1E293B] rounded-lg text-slate-600 dark:text-slate-300 text-[13px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
