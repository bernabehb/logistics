import { Search, RotateCcw, Trash2 } from "lucide-react";
import { StatusCircle } from "./StatusIndicator";
import { cn } from "@/lib/utils";
import { SingleDatePicker } from "./DateRangePicker";
import { InvoiceType } from "../hooks/useLogisticsPageState";
import { Button } from "@/components/ui/button";

type Status = 'pending' | 'in-progress' | 'ready' | 'none';

interface DateFiltersProps {
  fromDate: Date | undefined;
  onFromDateChange: (date: Date | undefined) => void;
  toDate: Date | undefined;
  onToDateChange: (date: Date | undefined) => void;
  onClearFilters: () => void;
}

export function LogisticsDateFilters({ fromDate, onFromDateChange, toDate, onToDateChange, onClearFilters }: DateFiltersProps) {
  const hasActiveFilters = fromDate || toDate;
  return (
    <div className="flex flex-nowrap items-center gap-1.5 w-full md:w-auto">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        <SingleDatePicker label="De" date={fromDate} setDate={onFromDateChange} />
        <SingleDatePicker label="A" date={toDate} setDate={onToDateChange} />
      </div>
      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="flex items-center justify-center h-9 w-9 p-0 text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 transition-colors bg-slate-100/50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 shrink-0"
          title="Limpiar filtros"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}

interface TypeFiltersProps {
  invoiceTypeFilter: InvoiceType;
  onInvoiceTypeChange: (type: InvoiceType) => void;
}

export function LogisticsTypeFilters({ invoiceTypeFilter, onInvoiceTypeChange }: TypeFiltersProps) {
  return (
    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700/50 h-9 flex-nowrap">
      {(['normal', 'anticipada'] as const).map((type) => (
        <Button
          variant="ghost"
          key={type}
          onClick={() => onInvoiceTypeChange(type)}
          className={cn(
            "h-auto px-4 py-1.5 text-[13px] font-semibold rounded-lg transition-all",
            invoiceTypeFilter === type
              ? "bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-600 hover:bg-white dark:hover:bg-[#1E293B]"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-transparent"
          )}
        >
          {type === 'normal' ? 'Normales' : 'Anticipadas'}
        </Button>
      ))}
    </div>
  );
}

interface StatusFiltersProps {
  activeStatusFilters: Status[];
  onToggleStatusFilter: (status: Status) => void;
  compact?: boolean;
}

export function LogisticsStatusFilters({ activeStatusFilters, onToggleStatusFilter, compact }: StatusFiltersProps) {
  return (
    <div className={cn(
      "flex items-center gap-1 md:gap-2 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 p-1 rounded-xl shadow-sm h-9",
      compact ? "justify-start" : "justify-around md:justify-start md:p-1.5"
    )}>
      {(['pending', 'in-progress', 'ready'] as const).map((status) => (
        <Button
          key={status}
          variant="ghost"
          onClick={() => onToggleStatusFilter(status)}
          className={cn(
            "h-auto flex items-center justify-center transition-all border border-transparent rounded-lg",
            compact 
              ? "gap-1.5 px-2.5 py-1 text-[11px]" 
              : "gap-1.5 md:gap-2.5 text-[12px] md:text-[14px] px-2 md:px-4 py-1 md:py-1.5 flex-1 md:flex-none",
            activeStatusFilters.includes(status)
              ? "bg-slate-100 dark:bg-[#1E293B] text-slate-900 dark:text-slate-100 shadow-sm border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-[#1E293B]"
              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50"
          )}
        >
          <StatusCircle status={status} />
          <span>{status === 'pending' ? 'Pendiente' : status === 'in-progress' ? 'En progreso' : 'Listo'}</span>
        </Button>
      ))}
    </div>
  );
}

interface LogisticsFiltersProps {
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

export function LogisticsFilters(props: LogisticsFiltersProps) {
  return (
    <div className="flex flex-col gap-4 w-full relative z-10">
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
        <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto">
          <LogisticsDateFilters 
            fromDate={props.fromDate} 
            onFromDateChange={props.onFromDateChange} 
            toDate={props.toDate} 
            onToDateChange={props.onToDateChange} 
            onClearFilters={props.onClearFilters} 
          />
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>
          <LogisticsTypeFilters 
            invoiceTypeFilter={props.invoiceTypeFilter} 
            onInvoiceTypeChange={props.onInvoiceTypeChange} 
          />
        </div>
        <LogisticsStatusFilters 
          activeStatusFilters={props.activeStatusFilters} 
          onToggleStatusFilter={props.onToggleStatusFilter} 
        />
      </div>
    </div>
  );
}
