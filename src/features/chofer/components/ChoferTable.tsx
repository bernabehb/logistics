"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChoferRow, MaterialDetail } from "../models";
import { ChevronDown, MapPin, Grid3x3, LayoutGrid, PaintbrushVertical, Package, Weight, Phone } from "lucide-react";
import { StatusCircle } from "@/features/logistics/components/StatusIndicator";

interface ChoferTableProps {
  rows: ChoferRow[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  totalWeight: number;
}

export function ChoferTable({
  rows,
  totalItems,
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
  totalWeight,
}: ChoferTableProps) {
  const currentCount = rows.length;
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300">
      <div className="overflow-x-auto">
        <div className="min-w-full lg:min-w-[1024px]">
          {/* Table Header - Only visible on large screens */}
          <div className="hidden lg:grid grid-cols-12 items-end p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-[13px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.05em] uppercase">
            <div className="col-span-2 pl-4">Factura #</div>
            <div className="col-span-3">Cliente</div>
            <div className="col-span-2 flex items-center gap-2">
              <Phone className="size-3.5" />
              Teléfono
            </div>
            <div className="col-span-3 flex items-center gap-2">
              <MapPin className="size-4" />
              Destino
            </div>
            <div className="col-span-1 flex justify-center">Estado</div>
            <div className="col-span-1 flex justify-center">Acción</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {rows.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                No tienes pedidos asignados.
              </div>
            ) : (
              rows.map((row, index) => {
                const isExpanded = expandedRows.has(row.id);

                // Calculate totals and overall status
                const mats = [...row.materials.aluminio, ...row.materials.vidrio, ...row.materials.herrajes];
                const totalWeight = mats.reduce((acc, curr) => acc + curr.weight, 0);

                const generalStatus = (() => {
                  if (mats.length === 0) return 'none';
                  const allReady = mats.every(m => m.status === 'ready');
                  const allPending = mats.every(m => m.status === 'pending');
                  if (allReady) return 'ready';
                  if (allPending) return 'pending';
                  return 'in-progress';
                })();

                return (
                  <div key={row.id} className="flex flex-col group animate-in slide-in-from-bottom-2 fade-in" style={{ animationFillMode: 'both', animationDelay: `${index * 50}ms` }}>
                    {/* Main Row */}
                    <div
                      onClick={() => toggleRow(row.id)}
                      className="flex flex-col lg:grid lg:grid-cols-12 gap-y-3 lg:gap-y-0 items-start lg:items-center p-5 cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      {/* Factura */}
                      <div className="w-full lg:col-span-2 lg:pl-4 flex justify-between lg:flex-col items-center lg:items-start lg:gap-1.5">
                        <span className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider">Factura #</span>
                        <div className="flex flex-col text-right lg:text-left">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-[17px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">#{row.id}</span>
                          <span className="text-slate-500 dark:text-slate-400 text-[14px]">{row.date}</span>
                        </div>
                      </div>

                      {/* Cliente */}
                      <div className="w-full lg:col-span-3 flex justify-between lg:justify-start items-center lg:items-start font-semibold text-slate-800 dark:text-slate-200 text-[16px]">
                        <span className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</span>
                        <span>{row.clientName}</span>
                      </div>

                      {/* Teléfono */}
                      <div className="w-full lg:col-span-2 flex justify-between lg:justify-start items-center lg:items-start text-slate-600 dark:text-slate-300 text-[15px] font-medium">
                        <span className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Phone className="size-3" /> Teléfono</span>
                        <span>{row.clientPhone}</span>
                      </div>

                      {/* Destino */}
                      <div className="w-full lg:col-span-3 flex justify-between lg:justify-start items-center lg:items-start text-slate-600 dark:text-slate-300 text-[15px]">
                        <span className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><MapPin className="size-3" /> Destino</span>
                        <span className="text-right lg:text-left">{row.destination}</span>
                      </div>

                      {/* General Status */}
                      <div className="w-full lg:col-span-1 flex justify-between lg:justify-center items-center">
                        <span className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</span>
                        <div className="flex flex-col items-center gap-1">
                          <StatusCircle status={generalStatus} />
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-tight",
                            generalStatus === 'ready' ? "text-emerald-500" :
                              generalStatus === 'pending' ? "text-red-500" :
                                "text-amber-500"
                          )}>
                            {generalStatus === 'ready' ? 'Listo' :
                              generalStatus === 'pending' ? 'Pendiente' :
                                'En Proceso'}
                          </span>
                        </div>
                      </div>

                      {/* Expand Icon */}
                      <div className="w-full lg:col-span-1 flex justify-between lg:justify-center items-center mt-2 lg:mt-0 pt-3 lg:pt-0 border-t border-slate-100 dark:border-slate-800 lg:border-t-0 text-slate-400 dark:text-slate-500">
                        <span className="lg:hidden text-sm font-semibold text-slate-500">{isExpanded ? 'Ocultar detalles' : 'Ver más detalles'}</span>
                        <ChevronDown className={cn("size-5 transition-transform duration-300", isExpanded && "rotate-180")} />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-500 ease-in-out bg-slate-50/50 dark:bg-slate-800/50",
                        isExpanded ? "max-h-[2000px] lg:max-h-[500px] opacity-100 border-t border-slate-100 dark:border-slate-700/50" : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="p-6">
                        <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                          <Package className="size-4 text-blue-500" />
                          Detalles de Carga por Almacén
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                          {/* Aluminio Card */}
                          <MetricCard
                            title="Aluminio"
                            icon={<Grid3x3 className="size-5 text-slate-400" />}
                            details={row.materials.aluminio}
                          />

                          {/* Vidrio Card */}
                          <MetricCard
                            title="Vidrio"
                            icon={<LayoutGrid className="size-5 text-slate-400" />}
                            details={row.materials.vidrio}
                          />

                          {/* Herrajes Card */}
                          <MetricCard
                            title="Herrajes"
                            icon={<PaintbrushVertical className="size-5 text-slate-400" />}
                            details={row.materials.herrajes}
                          />

                          {/* Total Card */}
                          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 flex flex-col justify-center">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold mb-2">
                              <Weight className="size-5" />
                              <span>Peso total del pedido</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                              {totalWeight.toFixed(2)} kg
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Summary Row */}
          <div className="bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 px-5 py-2.5 flex justify-end items-center">
            <div className="flex items-center gap-2 pr-1 sm:pr-4">
              <span className="text-[15px] font-medium text-slate-500 dark:text-slate-400">Peso total de carga:</span>
              <span className="text-[15px] font-bold text-slate-900 dark:text-slate-100">
                {totalWeight.toFixed(2)} kg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-[14px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 hidden md:flex">
        <div>
          Mostrando <span className="font-semibold text-slate-900 dark:text-slate-100">{currentCount}</span> de <span className="font-semibold text-slate-900 dark:text-slate-100">{totalItems}</span> asignaciones
        </div>
        <div className="flex items-center gap-4">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={onPrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={onNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, icon, details }: { title: string, icon: React.ReactNode, details: MaterialDetail[] }) {
  if (!details || details.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col min-h-[140px]">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <span className="font-semibold text-slate-600 dark:text-slate-300">{title}</span>
        </div>
        <div className="flex items-center justify-center flex-1 text-[15px] text-slate-400 dark:text-slate-500">
          Sin asignar
        </div>
      </div>
    );
  }

  const totalCategoryWeight = details.reduce((acc, curr) => acc + curr.weight, 0);

  // Determine the aggregated status for this warehouse/category
  // Logic: If any item is pending -> pending. If any is in-progress -> in-progress. If all ready -> ready.
  const aggregatedStatus = details.reduce((acc, item) => {
    if (acc === 'pending' || item.status === 'pending') return 'pending';
    if (acc === 'in-progress' || item.status === 'in-progress') return 'in-progress';
    if (item.status === 'ready') return 'ready';
    return acc;
  }, 'ready' as typeof details[0]['status']);

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors shadow-sm">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-slate-800 dark:text-slate-200">{title}</span>
          <div className="ml-1 pl-2 border-l border-slate-200 dark:border-slate-700 flex items-center">
            <StatusCircle status={aggregatedStatus} />
          </div>
        </div>
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">
          {totalCategoryWeight.toFixed(2)} kg
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {details.map((item, idx) => (
          <div key={idx} className="flex flex-col gap-1.5 text-[15px]">
            <div className="flex justify-between items-start">
              <span className="font-medium text-slate-700 dark:text-slate-300 pr-2">{item.name}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>{item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}</span>
              <span className="font-semibold">{item.weight.toFixed(2)} kg</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
