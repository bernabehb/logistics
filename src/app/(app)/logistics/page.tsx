"use client";

import { LogisticsFilters, KanbanBoard } from "@/features/logistics/components";
import { useLogisticsPageState } from "@/features/logistics/hooks/useLogisticsPageState";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

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
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 transition-all w-full mb-2">
        {/* Left Section: Title & Unified Master Search */}
        <div className="flex flex-col gap-3 w-full xl:w-auto shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
              Pedidos Activos
            </h1>
            <span className="bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 font-semibold px-2.5 py-1 text-xs rounded-lg transition-colors">
              {pendingCount} Pendiente{pendingCount !== 1 && "s"}
            </span>
          </div>
          <div className="relative group w-full md:w-[320px]">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-slate-500 transition-colors pointer-events-none" />
             <Input
               type="text"
               placeholder="Buscar factura o cliente..."
               value={searchQuery}
               onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
               className="w-full bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 h-13 text-sm focus-visible:ring-slate-500/20 shadow-sm transition-all placeholder:text-slate-400 font-medium"
             />
          </div>
        </div>

        {/* Right Section / Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto xl:ml-auto">
          <LogisticsFilters
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
      </div>

      {/* View Content (Kanban Only) */}
      <KanbanBoard rows={filteredRows} />
    </div>
  );
}
