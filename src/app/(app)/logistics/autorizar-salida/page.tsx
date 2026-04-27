"use client";

import { useState } from "react";
import { Search, CheckCircle2, Home, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DepartureCard, ReadyDeparture } from "@/features/logistics/components/cards/DepartureCard";
import { RefreshCw } from "lucide-react";
import departuresData from "@/lib/departures.json";

const MOCK_DEPARTURES: ReadyDeparture[] = departuresData as ReadyDeparture[];

let cachedDepartures: ReadyDeparture[] | null = null;

export default function AutorizarSalidaPage() {
  const [departures, setDepartures] = useState<ReadyDeparture[]>(cachedDepartures || MOCK_DEPARTURES);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simular carga de datos reales (por ahora reseteamos al mock si no hay cache, o simplemente forzamos un refresh)
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Pendiente" | "En ruta">("Pendiente");
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<"domicilio" | "sucursal">("domicilio");

  const handleAuthorize = (id: string) => {
    const updated = departures.map(dep => {
      if (dep.id === id) {
        return { 
          ...dep, 
          status: dep.deliveryType === 'sucursal' ? "Completado" : "En ruta" 
        };
      }
      return dep;
    });
    setDepartures(updated);
    cachedDepartures = updated;
  };

  const filteredDepartures = departures.filter(dep => 
    dep.status === statusFilter && 
    dep.deliveryType === deliveryTypeFilter && (
      dep.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dep.unitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dep.clientName && dep.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  const pendingCount = departures.filter(d => d.status === "Pendiente" && d.deliveryType === deliveryTypeFilter).length;
  const enRutaCount = departures.filter(d => d.status === "En ruta" && d.deliveryType === deliveryTypeFilter).length;

  return (
    <div className="w-full flex flex-col gap-4 min-h-full pb-12 -mt-2 md:-mt-4">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
          Autorizar Salidas
        </h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="h-9 rounded-xl font-bold border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
        >
          <RefreshCw className={cn("size-3.5 mr-2", isRefreshing && "animate-spin text-blue-500")} />
          Actualizar
        </Button>
      </div>

      {/* Unified Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 md:gap-6 w-full bg-white/50 dark:bg-slate-900/40 py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* 1. Master Search Bar (Left) */}
        <div className="relative group w-full lg:w-auto lg:min-w-[320px] flex-1 max-w-md shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-500 transition-colors pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar por chofer o unidad..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 h-10 text-xs focus-visible:ring-slate-500/20 shadow-sm transition-all placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* 2. Filters Group (Right) */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto justify-between lg:justify-end">
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden min-[1400px]:block"></div>

          {/* Delivery Type (Domicilio/Sucursal) */}
          <div className="flex items-center justify-center gap-1 bg-slate-100/50 dark:bg-[#1E293B] p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 h-9 w-full sm:w-auto shrink-0">
            {[
              { id: 'domicilio', label: 'Domicilio' },
              { id: 'sucursal', label: 'Sucursal' },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setDeliveryTypeFilter(btn.id as any)}
                className={cn(
                  "h-auto px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  deliveryTypeFilter === btn.id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden min-[1400px]:block"></div>

          {/* Status Filter (Pendientes/En Ruta) */}
          <div className="flex items-center justify-center gap-1 bg-slate-100/50 dark:bg-[#1E293B] p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 h-9 w-full sm:w-auto shrink-0">
            {[
              { id: "Pendiente", label: "Pendientes", count: pendingCount },
              { id: "En ruta", label: "En Ruta", count: enRutaCount }
            ].map((status) => (
              <button
                key={status.id}
                onClick={() => setStatusFilter(status.id as any)}
                className={cn(
                  "h-auto px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2",
                  statusFilter === status.id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {status.label}
                <span className={cn(
                  "px-1.5 py-0.5 rounded-md text-[9px] min-w-[1.2rem] text-center",
                  statusFilter === status.id 
                    ? "bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300" 
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                )}>
                  {status.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="flex-1 mt-1">
        {filteredDepartures.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400 w-full">
            <CheckCircle2 className="size-12 mb-4 text-emerald-500 opacity-50" />
            <p className="text-lg font-medium">
              {statusFilter === "Pendiente" 
                ? "No hay salidas pendientes de autorización" 
                : "No hay unidades en ruta actualmente"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-6 auto-rows-max">
            {filteredDepartures.map((dep) => (
              <DepartureCard key={dep.id} departure={dep} onAuthorize={handleAuthorize} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
