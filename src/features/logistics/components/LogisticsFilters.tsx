import { Search, RotateCcw } from "lucide-react";
import { StatusCircle } from "./StatusIndicator";
import { cn } from "@/lib/utils";
import { SingleDatePicker } from "./DateRangePicker";
import { InvoiceType } from "../hooks/useLogisticsPageState";

type Status = 'pending' | 'in-progress' | 'ready' | 'none';

interface LogisticsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  fromDate: Date | undefined;
  onFromDateChange: (date: Date | undefined) => void;
  toDate: Date | undefined;
  onToDateChange: (date: Date | undefined) => void;
  onClearFilters: () => void;
  activeStatusFilters: Status[];
  onToggleStatusFilter: (status: Status) => void;
  invoiceTypeFilter: InvoiceType;
  onInvoiceTypeChange: (type: InvoiceType) => void;
}

export function LogisticsFilters({
  searchQuery,
  onSearchChange,
  fromDate,
  onFromDateChange,
  toDate,
  onToDateChange,
  onClearFilters,
  activeStatusFilters,
  onToggleStatusFilter,
  invoiceTypeFilter,
  onInvoiceTypeChange
}: LogisticsFiltersProps) {
  const hasActiveFilters = searchQuery || fromDate || toDate;

  return (
    <div className="flex flex-col gap-4 w-full relative z-10">
      
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
        {/* Left side: Search, Dates & Type Toggle */}
        <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto">
        {/* Search Input */}
        <div className="relative group w-full md:w-auto">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 size-4.5 transition-colors group-focus-within:text-blue-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar factura o cliente..."
            className="pl-10 pr-4 py-2.5 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 text-[15px] text-slate-800 dark:text-slate-100 w-full md:w-[260px] shadow-sm transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
          />
        </div>

        {/* Date Pickers Group and Type Filters */}
        <div className="flex flex-wrap items-center gap-2 md:gap-4 w-full md:w-auto">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <SingleDatePicker 
              label="De"
              date={fromDate} 
              setDate={onFromDateChange} 
            />
            <SingleDatePicker 
              label="A"
              date={toDate} 
              setDate={onToDateChange} 
            />
          </div>

          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>

          {/* Type Filter */}
          <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700/50">
            {(['normal', 'anticipada'] as const).map((type) => (
              <button
                key={type}
                onClick={() => onInvoiceTypeChange(type)}
                className={cn(
                  "px-4 py-1.5 text-[13px] font-semibold rounded-lg transition-all",
                  invoiceTypeFilter === type
                    ? "bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-600"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transparent"
                )}
              >
                {type === 'normal' ? 'Normales' : 'Anticipadas'}
              </button>
            ))}
          </div>
        </div>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-2 px-3 py-2 text-[13px] font-bold text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors uppercase tracking-wider bg-slate-100/50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          )}
      </div>

      {/* Right side: Legend / Interactive Filters */}
      <div className="flex items-center justify-around md:justify-start gap-1 md:gap-2 w-full md:w-auto bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 p-1 md:p-1.5 rounded-xl shadow-sm">
        
        <button 
           onClick={() => onToggleStatusFilter('pending')}
           className={cn(
             "flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2.5 text-[12px] md:text-[14px] font-semibold px-2 md:px-4 py-1 md:py-1.5 rounded-lg transition-all border border-transparent",
             activeStatusFilters.includes('pending') 
               ? "bg-slate-100 dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 shadow-sm border-slate-200 dark:border-slate-600" 
               : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          )}
        >
          <StatusCircle status="pending" />
          <span>Pendiente</span>
        </button>

        <button 
           onClick={() => onToggleStatusFilter('in-progress')}
           className={cn(
             "flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2.5 text-[12px] md:text-[14px] font-semibold px-2 md:px-4 py-1 md:py-1.5 rounded-lg transition-all border border-transparent",
             activeStatusFilters.includes('in-progress') 
               ? "bg-slate-100 dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 shadow-sm border-slate-200 dark:border-slate-600" 
               : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          )}
        >
          <StatusCircle status="in-progress" />
          <span>En progreso</span>
        </button>

        <button 
           onClick={() => onToggleStatusFilter('ready')}
           className={cn(
             "flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2.5 text-[12px] md:text-[14px] font-semibold px-2 md:px-4 py-1 md:py-1.5 rounded-lg transition-all border border-transparent",
             activeStatusFilters.includes('ready') 
               ? "bg-slate-100 dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 shadow-sm border-slate-200 dark:border-slate-600" 
               : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          )}
        >
          <StatusCircle status="ready" />
          <span>Listo</span>
        </button>
      </div>
      </div>
    </div>
  );
}
