"use client";

import { useState } from "react";
import { Search, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DepartureCard, ReadyDeparture } from "@/features/logistics/components/cards/DepartureCard";
import departuresData from "@/lib/departures.json";

const MOCK_DEPARTURES: ReadyDeparture[] = departuresData as ReadyDeparture[];

export default function AutorizarSalidaPage() {
  const [departures, setDepartures] = useState<ReadyDeparture[]>(MOCK_DEPARTURES);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Pendiente" | "En ruta">("Pendiente");

  const handleAuthorize = (id: string) => {
    setDepartures(departures.map(dep => 
      dep.id === id ? { ...dep, status: "En ruta" } : dep
    ));
  };

  const filteredDepartures = departures.filter(dep => 
    dep.status === statusFilter && (
      dep.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dep.unitName.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const pendingCount = departures.filter(d => d.status === "Pendiente").length;
  const enRutaCount = departures.filter(d => d.status === "En ruta").length;

  return (
    <div className="w-full flex flex-col gap-4 min-h-full pb-12 -mt-2 md:-mt-4">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all w-full">
        {/* Left Section: Title & Unified Master Search */}
        <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
              Autorizar Salidas
            </h1>
          </div>
          <div className="relative group w-full md:w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-slate-500 transition-colors pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por chofer o unidad..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 h-13 text-sm focus-visible:ring-slate-500/20 shadow-sm transition-all placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto md:ml-auto">
          <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-[#1E293B] p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 h-13 transition-all w-full md:w-auto overflow-x-auto no-scrollbar">
            <Button
              variant="ghost"
              onClick={() => setStatusFilter("Pendiente")}
              className={cn(
                "h-auto px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
                statusFilter === "Pendiente"
                  ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-md ring-1 ring-slate-200 dark:ring-slate-600 scale-105 z-10 hover:bg-white dark:hover:bg-slate-700"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-transparent"
              )}
            >
              Pendientes
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[10px]",
                statusFilter === "Pendiente" ? "bg-slate-100 dark:bg-slate-600" : "bg-slate-200 dark:bg-slate-800"
              )}>
                {pendingCount}
              </span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setStatusFilter("En ruta")}
              className={cn(
                "h-auto px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
                statusFilter === "En ruta"
                  ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-md ring-1 ring-slate-200 dark:ring-slate-600 scale-105 z-10 hover:bg-white dark:hover:bg-slate-700"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-transparent"
              )}
            >
              En Ruta
              <span className={cn(
                "px-2 py-0.5 rounded-md text-[10px]",
                statusFilter === "En ruta" ? "bg-slate-100 dark:bg-slate-600" : "bg-slate-200 dark:bg-slate-800"
              )}>
                {enRutaCount}
              </span>
            </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 auto-rows-max">
            {filteredDepartures.map((dep) => (
              <DepartureCard key={dep.id} departure={dep} onAuthorize={handleAuthorize} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
