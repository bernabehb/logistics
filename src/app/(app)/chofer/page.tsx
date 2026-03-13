"use client";

import { useChoferPageState } from "@/features/chofer/hooks/useChoferPageState";
import { ChoferTable } from "@/features/chofer/components/ChoferTable";
import { Search, Weight } from "lucide-react";

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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
            Pedidos Asignadas
          </h1>
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold px-2.5 py-1 text-xs rounded-lg transition-colors">
              {assignedCount} Viaje{assignedCount !== 1 && 's'}
            </span>
          </div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-[15px] transition-colors">
          Consulta los detalles de recolección y pesos por almacén para tus pedidos asignados.
        </p>
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
