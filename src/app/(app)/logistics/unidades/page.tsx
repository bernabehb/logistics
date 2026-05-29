"use client";

import { useState, useEffect } from "react";
import { Unit, UnitStatus, ApiUnit, mapApiUnitToUnit, MOCK_UNITS } from "@/features/logistics/models/units";
import { Search, Truck, Fuel, ShieldCheck, MapPin, Gauge, User, RefreshCw, Wrench, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Cache for quick loads
let cachedUnits: Unit[] | null = null;

export default function UnidadesPage() {
  const [units, setUnits] = useState<Unit[]>(cachedUnits || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UnitStatus>("Disponible");
  const [isLoading, setIsLoading] = useState(!cachedUnits);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTogglingMap, setIsTogglingMap] = useState<Record<number, boolean>>({});

  const handleToggleMaintenance = async (iIdUnit: number, status: UnitStatus) => {
    setIsTogglingMap(prev => ({ ...prev, [iIdUnit]: true }));
    const bMaintenance = status !== "Mantenimiento";
    try {
      const res = await fetch("/api/units/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ iIdUnit, bMaintenance })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Error al actualizar el estado de mantenimiento");
      }

      // Update local state
      setUnits(prev => prev.map(u => {
        if (u.iId === iIdUnit) {
          return {
            ...u,
            status: bMaintenance ? "Mantenimiento" : "Disponible"
          };
        }
        return u;
      }));
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al cambiar el estado de mantenimiento de la unidad");
    } finally {
      setIsTogglingMap(prev => ({ ...prev, [iIdUnit]: false }));
    }
  };

  const fetchUnitsData = async (silent = false) => {
    setIsRefreshing(true);
    if (!silent && !cachedUnits) {
      setIsLoading(true);
    }
    setErrorMsg(null);

    try {
      const res = await fetch("/api/units");
      if (!res.ok) throw new Error("Error al consultar el servidor externo");

      const apiUnits: ApiUnit[] = await res.json();

      // Map API units
      const mapped: Unit[] = apiUnits.map((u, idx) => mapApiUnitToUnit(u, idx));
      setUnits(mapped);
      cachedUnits = mapped;
    } catch (err) {
      console.warn("Failed to fetch units:", err);
      setUnits([]);
      cachedUnits = [];
      if (!silent) {
        setErrorMsg("Error al conectar con el servidor de unidades");
      }
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUnitsData(!!cachedUnits);
  }, []);

  // Silent automatic refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchUnitsData(true);
      }
    }, 15000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchUnitsData(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Filter logic
  const filteredUnits = units.filter((unit) => {
    const matchesSearch =
      unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.plate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (unit.apiDriverName && unit.apiDriverName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (unit.sucursal && unit.sucursal.toLowerCase().includes(searchQuery.toLowerCase())) ||
      unit.lastLocation.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = unit.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<UnitStatus, string> = {
    Disponible: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    Asignado: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    Mantenimiento: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  };

  const statusBadgeColors: Record<UnitStatus, string> = {
    Disponible: "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]",
    Asignado: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]",
    Mantenimiento: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]",
  };

  return (
    <div className="space-y-3 w-full pb-8 -mt-2 md:-mt-4">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors flex items-center gap-2.5">
            <Truck className="size-7 text-blue-500 dark:text-blue-400 shrink-0" />
            Unidades
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchUnitsData(false)}
            disabled={isRefreshing}
            className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 size-10"
          >
            <RefreshCw className={cn("size-4 text-slate-500 dark:text-slate-400", isRefreshing && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Filters & Search Grid */}
      <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-2 sm:py-2 sm:px-4 border border-slate-200 dark:border-slate-800/50 shadow-sm flex flex-col lg:flex-row gap-3 items-center justify-between transition-colors">
        {/* Search */}
        <div className="relative w-full lg:max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input
            type="text"
            placeholder="Buscar por unidad, chofer, placa o sucursal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9.5 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-sm focus-visible:ring-blue-500/20 focus-visible:border-blue-500 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto justify-center lg:justify-end">
          {(["Disponible", "Asignado", "Mantenimiento"] as const).map((filter) => {
            const isActive = statusFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all active:scale-95",
                  isActive
                    ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-sm"
                    : "bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <RefreshCw className="size-8 text-blue-500 animate-spin" />
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Cargando unidades...
          </p>
        </div>
      ) : filteredUnits.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUnits.map((unit) => {
            // Colors for Fuel Level progress
            const fuelLow = unit.fuelLevel < 20;
            const fuelMid = unit.fuelLevel < 50;
            const fuelProgressColor = fuelLow
              ? "bg-red-500"
              : fuelMid
                ? "bg-amber-500"
                : "bg-emerald-500";

            return (
              <Card
                key={unit.id}
                className="hover:shadow-md transition-all duration-300 group flex flex-col h-full overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-sm"
              >
                {/* Header */}
                <CardHeader className="flex flex-row justify-between items-start p-4 pt-3.5 pb-2">
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-nowrap">
                      <CardTitle className="text-lg font-bold text-slate-800 dark:text-slate-100 tracking-tight transition-colors truncate">
                        {unit.name}
                      </CardTitle>
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors shrink-0 whitespace-nowrap",
                          statusColors[unit.status]
                        )}
                      >
                        {unit.status}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      Modelo: {unit.type}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-colors shrink-0 ml-2">
                    <Truck className="size-4.5 text-slate-400" />
                  </div>
                </CardHeader>

                {/* Content */}
                <CardContent className="p-4 pt-2.5 pb-4 flex-1 flex flex-col gap-3.5">
                  <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-3.5 flex flex-col gap-2.5 border border-slate-100 dark:border-slate-800/30">
                    {/* Plate */}
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400 uppercase tracking-wider">Placas</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-200 uppercase bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-2 py-0.5 rounded-md">
                        {unit.plate}
                      </span>
                    </div>


                    {/* Sucursal */}
                    {unit.sucursal && (
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-400 uppercase tracking-wider">Sucursal</span>
                        <span className="font-black text-blue-600 dark:text-blue-400 uppercase text-[10px] tracking-wide">
                          {unit.sucursal}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Fuel level bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <Fuel className="size-3.5 text-slate-400" />
                        <span className="font-bold text-slate-400 uppercase tracking-wider">Combustible</span>
                      </div>
                      <span className={cn("font-bold text-xs", fuelLow ? "text-red-500 animate-pulse" : "text-slate-700 dark:text-slate-200")}>
                        {unit.fuelLevel}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                      <div
                        className={cn("h-full transition-all duration-500 ease-out", fuelProgressColor)}
                        style={{ width: `${unit.fuelLevel}%` }}
                      />
                    </div>
                  </div>

                  {/* Driver / Mileage */}
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-800/50 pt-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg shrink-0">
                        <User className="size-3.5 text-blue-500" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none mb-0.5">
                          Chofer
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate uppercase">
                          {unit.apiDriverName || "Sin asignación"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
                        <Gauge className="size-3.5 text-slate-500 dark:text-slate-400" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider leading-none mb-0.5">
                          Odómetro
                        </span>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                          {unit.mileage.toLocaleString()} km
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Maintenance Action Button */}
                  {(unit.status === "Disponible" || unit.status === "Mantenimiento") && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/50">
                      <Button
                        onClick={() => handleToggleMaintenance(unit.iId, unit.status)}
                        disabled={isTogglingMap[unit.iId]}
                        size="sm"
                        variant={unit.status === "Mantenimiento" ? "default" : "outline"}
                        className={cn(
                          "w-full h-8.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                          unit.status === "Mantenimiento"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-sm shadow-emerald-500/20"
                            : "border-amber-200 dark:border-amber-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600 dark:text-amber-400"
                        )}
                      >
                        {isTogglingMap[unit.iId] ? (
                          <RefreshCw className="size-3.5 animate-spin" />
                        ) : unit.status === "Mantenimiento" ? (
                          <>
                            <Check className="size-3.5" />
                            Liberar Unidad
                          </>
                        ) : (
                          <>
                            <Wrench className="size-3.5" />
                            Mandar a Mantenimiento
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/50 rounded-3xl transition-colors">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            No se encontraron resultados
          </p>
        </div>
      )}
    </div>
  );
}
