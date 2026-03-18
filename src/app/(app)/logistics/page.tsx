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
    invoiceTypeFilter,
    setInvoiceTypeFilter
  } = useLogisticsPageState();

  return (
    <div className="w-full flex flex-col gap-4 h-full pb-8 -mt-2 md:-mt-4">
      {/* Header Info */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
          Pedidos Activos
        </h1>
        <span className="bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold px-2.5 py-1 text-xs rounded-lg transition-colors">
          {pendingCount} Pendiente{pendingCount !== 1 && "s"}
        </span>
      </div>

      <div className="w-full">
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
          invoiceTypeFilter={invoiceTypeFilter}
          onInvoiceTypeChange={setInvoiceTypeFilter}
        />
      </div>

      {/* View Content (Kanban Only) */}
      <KanbanBoard rows={filteredRows} />
    </div>
  );
}
