"use client";

import { LogisticsFilters, KanbanBoard } from "@/features/logistics/components";
import { useLogisticsPageState } from "@/features/logistics/hooks/useLogisticsPageState";

export default function LogisticsPage() {
  const {
    searchQuery,
    setSearchQuery,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    clearFilters,
    statusFilters,
    toggleStatusFilter,
    filteredRows,
    pendingCount,
  } = useLogisticsPageState();

  return (
    <div className="w-full flex flex-col">
      {/* Header Info */}
      <div className="mb-6 flex flex-col gap-2">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
              Pedidos Activos
            </h1>
            <span className="bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold px-2.5 py-1 text-xs rounded-lg transition-colors">
              {pendingCount} Pendiente{pendingCount !== 1 && "s"}
            </span>
          </div>
        </div>
        <p className="text-slate-500 dark:text-slate-400 font-medium text-[15px] transition-colors">
          Monitoree el estado de preparación de pedidos en los diferentes almacenes.
        </p>
      </div>

    <div className="flex w-full items-center justify-between w-full">
        <LogisticsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          fromDate={fromDate}
          onFromDateChange={setFromDate}
          toDate={toDate}
          onToDateChange={setToDate}
          onClearFilters={clearFilters}
          activeStatusFilters={statusFilters}
          onToggleStatusFilter={toggleStatusFilter}
        />
      </div>

      {/* View Content (Kanban Only) */}
      <KanbanBoard rows={filteredRows} />
    </div>
  );
}
