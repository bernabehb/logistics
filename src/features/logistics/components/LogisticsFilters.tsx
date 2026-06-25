import { Building2, ChevronDown, Search, RotateCcw, Trash2 } from "lucide-react";
import { StatusCircle } from "./StatusIndicator";
import { cn } from "@/lib/utils";
import { SingleDatePicker } from "./DateRangePicker";
export type InvoiceType = 'normal' | 'anticipada';
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";

type Status = 'pending' | 'in-progress' | 'ready' | 'none';

const DEFAULT_BRANCHES = ["APODACA", "GUADALUPE", "MONTERREY", "SANTA CATARINA"];

interface BranchFilterProps {
  branchFilter: string;
  onBranchChange: (branch: string) => void;
  branches?: string[];
  className?: string;
  size?: "default" | "xs" | "sm" | "lg" | "icon" | "icon-xs" | "icon-sm" | "icon-lg" | "logistics-card";
}

export function LogisticsBranchFilter({
  branchFilter,
  onBranchChange,
  branches = DEFAULT_BRANCHES,
  className,
  size
}: BranchFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className={cn(
            "rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] px-3 text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all",
            !size && !className?.includes("h-") && "h-10",
            className
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="size-3.5 text-slate-400 shrink-0" />
            <span className="truncate">
              {branchFilter === 'all' ? 'TODAS LAS SUCURSALES' : branchFilter}
            </span>
          </div>
          <ChevronDown className="size-3 text-slate-400 shrink-0 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-64 p-2 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-xl"
      >
        <div className="flex flex-col gap-1">
          <p className="px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
            Filtrar por Sucursal
          </p>
          <button
            onClick={() => onBranchChange('all')}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
              branchFilter === 'all'
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
            )}
          >
            <div className={cn("size-2 rounded-full", branchFilter === 'all' ? "bg-white animate-pulse" : "bg-blue-500")} />
            TODAS LAS SUCURSALES
          </button>
          <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
          <div className="flex flex-col gap-0.5">
            {branches.map(branch => (
              <button
                key={branch}
                onClick={() => onBranchChange(branch)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group",
                  branchFilter === branch
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                )}
              >
                <div className={cn(
                  "size-6 rounded-lg flex items-center justify-center text-[10px] shrink-0",
                  branchFilter === branch
                    ? "bg-white/20 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600"
                )}>
                  {branch.substring(0, 2)}
                </div>
                {branch}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface DateFiltersProps {
  fromDate: Date | undefined;
  onFromDateChange: (date: Date | undefined) => void;
  toDate?: Date | undefined;
  onToDateChange?: (date: Date | undefined) => void;
  onClearFilters: () => void;
  isSingleDate?: boolean;
}

export function LogisticsDateFilters({ 
  fromDate, 
  onFromDateChange, 
  toDate, 
  onToDateChange, 
  onClearFilters,
  isSingleDate = false
}: DateFiltersProps) {
  const hasActiveFilters = fromDate || (toDate && !isSingleDate);
  return (
    <div className="flex flex-nowrap items-center gap-1.5 w-full md:w-auto">
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        <SingleDatePicker 
          label={isSingleDate ? "Fecha" : "De"} 
          date={fromDate} 
          setDate={onFromDateChange} 
        />
        {!isSingleDate && onToDateChange && (
          <SingleDatePicker label="A" date={toDate} setDate={onToDateChange} />
        )}
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
    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700/50 h-9 flex-nowrap w-full md:w-auto">
      {(['normal', 'anticipada'] as const).map((type) => (
        <Button
          variant="ghost"
          key={type}
          onClick={() => onInvoiceTypeChange(type)}
          className={cn(
            "h-auto px-4 py-1.5 text-[13px] font-semibold rounded-lg transition-all flex-1 md:flex-initial",
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
      "flex items-center gap-1 md:gap-2 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 p-1 rounded-xl shadow-sm h-9 w-full md:w-auto",
      compact ? "justify-between md:justify-start" : "justify-around md:justify-start md:p-1.5"
    )}>
      {(['pending', 'in-progress', 'ready'] as const).map((status) => (
        <Button
          key={status}
          variant="ghost"
          onClick={() => onToggleStatusFilter(status)}
          className={cn(
            "h-auto flex items-center justify-center transition-all border border-transparent rounded-lg flex-1 md:flex-none",
            compact 
              ? "gap-1.5 px-2.5 py-1 text-[11px]" 
              : "gap-1.5 md:gap-2.5 text-[12px] md:text-[14px] px-2 md:px-4 py-1 md:py-1.5 md:flex-none",
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
