"use client";

import { useState, useEffect } from "react";
import { Unit, UnitStatus, ApiUnit, mapApiUnitToUnit, MOCK_UNITS } from "@/features/logistics/models/units";
import { Driver, ApiDriver, mapApiDriverToDriver, MOCK_DRIVERS } from "@/features/logistics/models/drivers";
import { UnitCard } from "@/features/logistics/components/cards/UnitCard";
import { Search, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AsignarUnidadesPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UnitStatus>("Disponible");

  const [isLoadingUnits, setIsLoadingUnits] = useState(true);
  const [unitsError, setUnitsError] = useState<string | null>(null);

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const [driverError, setDriverError] = useState<string | null>(null);

  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [activeMapUnitId, setActiveMapUnitId] = useState<string | null>(null);

  const fetchDrivers = async () => {
    setIsLoadingDrivers(true);
    try {
      const response = await fetch('/api/drivers');
      if (!response.ok) throw new Error('Error al conectar con la API de choferes');
      const data = await response.json();
      
      const mappedDrivers = data.map((d: ApiDriver) => mapApiDriverToDriver(d));
      // Filtrar para mostrar solo los que tienen el estatus "Disponible" en el select
      const availableDrivers = mappedDrivers.filter((d: Driver) => d.status === "Disponible");
      
      setDrivers(availableDrivers);
      setDriverError(null);
    } catch (err) {
      console.error('Error fetching drivers:', err);
      setDriverError('No se pudieron cargar los choferes');
    } finally {
      setIsLoadingDrivers(false);
    }
  };

  // Función de carga de datos
  const fetchUnits = async (isInitial = false) => {
    // Si no es la carga inicial, y no hay mapa abierto O la pestaña está oculta, no hacer nada
    if (!isInitial && (document.visibilityState !== 'visible' || !activeMapUnitId)) return;

    if (isInitial) setIsLoadingUnits(true);
    try {
      const response = await fetch('/api/units');
      if (!response.ok) throw new Error('Error al conectar con la API');
      const data = await response.json();
      
      const mappedUnits = data.map((u: ApiUnit, index: number) => mapApiUnitToUnit(u, index));
      setUnits(mappedUnits);
      setUnitsError(null);
    } catch (err) {
      console.error('Error fetching units:', err);
      if (isInitial) setUnitsError('No se pudo cargar la información de las unidades');
    } finally {
      if (isInitial) setIsLoadingUnits(false);
    }
  };

  // 1. Carga inicial (Solo una vez al montar)
  useEffect(() => {
    fetchUnits(true);
    fetchDrivers();
  }, []);

  // 2. Lógica de Seguimiento / Polling (Depende de activeMapUnitId)
  useEffect(() => {
    // Si hay un mapa activo, pedir actualización inmediata (silenciosa)
    if (activeMapUnitId) {
      fetchUnits(false);
    }

    // Configurar polling cada 30 segundos (solo si es visible y hay un mapa)
    const interval = setInterval(() => {
      fetchUnits(false);
    }, 30000);

    // Escuchar cambios de visibilidad
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && activeMapUnitId) {
        fetchUnits(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeMapUnitId]);

  // Helper to find driver assigned to a unit
  const getAssignedDriverName = (unit: Unit) => {
    const localDriverId = assignments[unit.id];
    if (localDriverId) {
      return drivers.find(d => d.id === localDriverId)?.name;
    }
    return unit.apiDriverName;
  };

  const handleAssignUnit = (unitId: string, driverId: string) => {
    setUnits(prev => prev.map(u => {
      if (u.id === unitId) {
        return { ...u, status: driverId ? "Asignado" : "Disponible" } as Unit;
      }
      return u;
    }));

    setAssignments(prev => {
      const next = { ...prev };
      if (driverId) {
        // Remove previous assignment for this unit if any
        Object.keys(next).forEach(uid => {
          if (next[uid] === driverId) delete next[uid];
        });
        next[unitId] = driverId;
      } else {
        delete next[unitId];
      }
      return next;
    });
  };

  const handleSetMaintenance = (unitId: string) => {
    setUnits(prev => prev.map(u => {
      if (u.id === unitId) {
        return { ...u, status: "Mantenimiento" } as Unit;
      }
      return u;
    }));
  };

  const counts = {
    Todas: units.length,
    Disponible: units.filter(u => u.status === "Disponible").length,
    Asignado: units.filter(u => u.status === "Asignado").length,
    Mantenimiento: units.filter(u => u.status === "Mantenimiento").length,
  };

  const filteredUnits = units.filter(u => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return u.status === statusFilter;

    let matchesSearch = false;
    if (/^\d+$/.test(q)) {
      // Si es un número, buscamos que el nombre de la unidad termine en ese número exacto (con o sin cero inicial)
      // Esto evita que al buscar "4" salgan la "14" o "24"
      const numericRegex = new RegExp(`\\b0?${q}$`, 'i');
      matchesSearch = numericRegex.test(u.name);
    } else {
      // Búsqueda por texto normal
      matchesSearch = u.name.toLowerCase().includes(q) ||
                     u.plate.toLowerCase().includes(q);
    }

    const matchesStatus = u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full flex flex-col gap-4 h-full pb-12 -mt-2 md:-mt-4">
      {/* Title Header */}
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
        Asignación de Unidades
      </h1>

      {/* Unified Filter & Stats Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 md:gap-6 w-full bg-white/50 dark:bg-slate-900/40 py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* 1. Master Search Bar (Left) */}
        <div className="relative group w-full lg:w-auto lg:min-w-[320px] flex-1 max-w-md shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-500 transition-colors pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar por nombre o placa..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 h-10 text-xs focus-visible:ring-slate-500/20 shadow-sm transition-all placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* 2. Filters & Stats Group (Right) */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          {/* Status Filters Toggles */}
          <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-[#1E293B] p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 h-9 shrink-0">
            {[
              { id: "Disponible", label: "Disponibles" },
              { id: "Asignado", label: "Asignados" },
              { id: "Mantenimiento", label: "En Taller" }
            ].map((status) => (
              <button
                key={status.id}
                onClick={() => setStatusFilter(status.id as any)}
                className={cn(
                  "h-auto px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  statusFilter === status.id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {status.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden min-[1400px]:block"></div>

          {/* Stats Badges (Compact) */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-2">
              <span className="text-sm leading-none">{counts.Disponible}</span>
              <span className="opacity-70 uppercase tracking-widest text-[9px]">Disponibles</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-500/10 border border-slate-100 dark:border-slate-500/20 text-slate-600 dark:text-slate-400 font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all flex items-center gap-2">
              <span className="text-sm leading-none">{counts.Todas}</span>
              <span className="opacity-70 uppercase tracking-widest text-[9px]">Total</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-6">
        {isLoadingUnits ? (
           <div className="col-span-full flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500 mb-4" />
              <p className="text-slate-500 font-medium">Cargando unidades...</p>
           </div>
        ) : unitsError ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-red-50/50 dark:bg-red-950/10 border border-dashed border-red-200 dark:border-red-900/30 rounded-[2rem]">
            <Truck className="size-20 text-red-200 dark:text-red-900/30 mb-4" />
            <h3 className="text-xl font-bold text-red-400 dark:text-red-800 tracking-tight">{unitsError}</h3>
          </div>
        ) : filteredUnits.length > 0 ? (
          filteredUnits.map((unit) => (
            <UnitCard 
              key={unit.id}
              unit={unit}
              assignedDriverName={getAssignedDriverName(unit)}
              assignedDriverIds={Object.values(assignments)}
              onAssign={(driverId) => handleAssignUnit(unit.id, driverId)}
              onMaintenance={() => handleSetMaintenance(unit.id)}
              allDrivers={drivers}
              isLoadingDrivers={isLoadingDrivers}
              driverError={driverError}
              isMapOpen={activeMapUnitId === unit.id}
              onMapOpenChange={(open) => setActiveMapUnitId(open ? unit.id : null)}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem]">
            <Truck className="size-20 text-slate-200 dark:text-slate-800 mb-4 transition-colors" />
            <h3 className="text-xl font-bold text-slate-400 dark:text-slate-600 transition-colors">No se encontraron unidades</h3>
          </div>
        )}
      </div>
    </div>
  );
}

