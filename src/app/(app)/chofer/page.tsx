"use client";

import { useChoferPageState } from "@/features/chofer/hooks/useChoferPageState";
import { ChoferTable } from "@/features/chofer/components/ChoferTable";
import { Search, Weight, Truck } from "lucide-react";

export default function ChoferPage() {
  const {
    searchQuery,
    setSearchQuery,
    paginatedRows,
    currentPage,
    totalPages,
    totalItems,
    goToNextPage,
    goToPrevPage,
    assignedCount,
    totalWeight,
  } = useChoferPageState();

  return (
    <div className="w-full flex flex-col">
      {/* Header Info */}
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors leading-none">
              Pedidos Asignadas
            </h1>
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 font-bold px-3.5 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-2">
              <span className="text-lg leading-none font-black">{assignedCount}</span>
              <span className="opacity-70 uppercase tracking-widest text-[10px] font-black whitespace-nowrap">Pedidos</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-bold px-5 py-2.5 rounded-2xl shadow-sm transition-all flex items-center gap-4">
            <div className="p-2.5 bg-white dark:bg-slate-800 rounded-xl shadow-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              <Truck className="size-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-slate-900 dark:text-slate-100 uppercase tracking-[0.15em] text-[9px] font-black mb-1">Vehículo Asignado</span>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-700 dark:text-slate-300 leading-none">Unidad 5</span>
                <span className="text-[10px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-tighter bg-slate-100 dark:bg-slate-700/50 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600/50">3.5 TON.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Search Toolbar */}
      <div className="flex w-full items-center justify-between w-full mb-6">
        <div className="relative group w-full md:w-[320px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 size-4.5 transition-colors group-focus-within:text-blue-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por factura, cliente o destino..."
            className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 text-[14px] text-slate-800 dark:text-slate-100 w-full shadow-sm transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
          />
        </div>
      </div>

      {/* Table Structure */}
      <div className="w-full">
        <ChoferTable
          rows={paginatedRows}
          totalItems={totalItems}
          currentPage={currentPage}
          totalPages={totalPages}
          onNextPage={goToNextPage}
          onPrevPage={goToPrevPage}
          totalWeight={totalWeight}
        />
      </div>
    </div>
  );
}
