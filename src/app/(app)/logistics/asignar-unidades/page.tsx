"use client";

import { useState } from "react";
import { MOCK_UNITS, Unit, UnitStatus } from "@/features/logistics/models/units";
import { MOCK_DRIVERS, Driver } from "@/features/logistics/models/drivers";
import {
  Truck,
  User,
  Fuel,
  Search,
  Filter,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";

function UnitCard({
  unit,
  onAssign,
  onMaintenance,
  assignedDriverName
}: {
  unit: Unit,
  onAssign: (driverId: string) => void,
  onMaintenance: () => void,
  assignedDriverName?: string
}) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");

  const statusColors = {
    "Disponible": "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    "Asignado": "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    "Mantenimiento": "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    "Fuera de Servicio": "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  };

  const handleAssign = () => {
    if (selectedDriverId) {
      onAssign(selectedDriverId);
      setIsAssigning(false);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1E293B] rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:shadow-xl transition-all duration-500 group relative border border-slate-100 dark:border-slate-800 flex flex-col overflow-hidden">
      {/* Unit Header */}
      <div className="flex justify-between items-start mb-6 min-h-16">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-nowrap">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight transition-colors truncate">
              {unit.name}
            </h3>
            <span className={cn(
              "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors shrink-0 whitespace-nowrap",
              statusColors[unit.status]
            )}>
              {unit.status}
            </span>
          </div>
          <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest transition-colors opacity-60">
            Capacidad: {unit.capacity}
          </span>
        </div>
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl transition-colors shrink-0 ml-2">
          <Truck className="size-5 text-slate-400" />
        </div>
      </div>

      {/* Samsara Stats */}
      <div className="mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2 transition-colors">
          <div className="flex items-center gap-2 text-slate-400">
            <Fuel className="size-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Combustible</span>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-xl font-black text-slate-700 dark:text-slate-200 leading-none transition-colors">{unit.fuelLevel}%</span>
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  unit.fuelLevel > 20 ? "bg-emerald-500" : "bg-red-500"
                )}
                style={{ width: `${unit.fuelLevel}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Control */}
      <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 transition-colors">
        {!isAssigning ? (
          <div className="flex flex-col gap-3 min-h-[110px] justify-center">
            {unit.status === "Disponible" ? (
              <>
                <button
                  onClick={() => setIsAssigning(true)}
                  className="w-full bg-slate-100 hover:bg-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-white dark:text-slate-400 dark:hover:text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-slate-400/80 dark:border-slate-500 hover:border-slate-600 active:scale-95 shadow-sm"
                >
                  Asignar Chofer
                </button>
                <button
                  onClick={onMaintenance}
                  className="w-full py-2 text-[10px] font-black text-slate-400 hover:text-amber-600 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-amber-100 dark:hover:border-amber-900/30 rounded-lg"
                >
                  <AlertTriangle className="size-3" />
                  Enviar a Mantenimiento
                </button>
              </>
            ) : unit.status === "Asignado" ? (
              <>
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                  <div className="size-10 bg-blue-500 rounded-xl flex items-center justify-center text-white transition-colors">
                    <User className="size-5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Chofer</span>
                    <span className="text-sm font-black text-slate-700 dark:text-slate-200 transition-colors truncate">
                      {assignedDriverName || "No asignado"}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onAssign("")}
                  className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors py-1 flex items-center justify-center"
                >
                  Liberar Unidad
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onAssign("")}
                  className="w-full bg-slate-50 hover:bg-slate-600 dark:bg-emerald-500/5 dark:hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-400 dark:hover:text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-600 active:scale-95 shadow-sm"
                >
                  Marcar como Disponible
                </button>
                <div className="py-2 h-8" /> {/* Spacer to match height */}
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccionar Chofer</label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full h-11 bg-slate-50 dark:bg-[#0F172A]/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all cursor-pointer"
              >
                <option value="">Selecciona un chofer...</option>
                {MOCK_DRIVERS.map(driver => (
                  <option key={driver.id} value={driver.id}>{driver.name} ({driver.block})</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAssigning(false)}
                className="flex-1 h-11 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedDriverId}
                className="flex-[2] h-11 bg-slate-100 hover:bg-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-white dark:text-slate-400 dark:hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest border border-slate-400/80 dark:border-slate-500 hover:border-slate-600 active:scale-95 disabled:opacity-50 transition-all shadow-sm"
              >
                Asignar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AsignarUnidadesPage() {
  const [units, setUnits] = useState<Unit[]>(MOCK_UNITS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UnitStatus | "Todas">("Todas");

  const [assignments, setAssignments] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    MOCK_DRIVERS.forEach(d => {
      if (d.assignedUnitId) initial[d.assignedUnitId] = d.id;
    });
    return initial;
  });

  // Helper to find driver assigned to a unit
  const getAssignedDriver = (unitId: string) => {
    const driverId = assignments[unitId];
    return MOCK_DRIVERS.find(d => d.id === driverId);
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
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.plate.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "Todas" || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full flex flex-col gap-4 h-full pb-12 -mt-2 md:-mt-4">
      {/* Header Section: Title, Search & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
        {/* Left column: Title & Search Bar */}
        <div className="flex flex-col gap-3 w-full md:w-auto">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
            Asignación de Unidades
          </h1>
          <div className="relative flex-1 group">
            <label htmlFor="unit-search" className="sr-only">Buscar unidad</label>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-slate-500 transition-colors" />
            <input
              id="unit-search"
              type="text"
              placeholder="Buscar por nombre de la unidad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 h-13 text-sm focus:outline-none focus:ring-4 focus:ring-slate-500/5 focus:border-slate-400 dark:focus:border-slate-700 transition-all shadow-sm placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Right column: Stats & Filters */}
        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold px-5 py-2.5 rounded-2xl shadow-sm transition-all flex items-center gap-3">
              <span className="text-xl leading-none">{counts.Disponible}</span>
              <span className="opacity-70 uppercase tracking-widest text-[11px] mt-0.5">Disponibles</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-500/10 border border-slate-100 dark:border-slate-500/20 text-slate-600 dark:text-slate-400 font-bold px-5 py-2.5 rounded-2xl shadow-sm transition-all flex items-center gap-3">
              <span className="text-xl leading-none">{counts.Todas}</span>
              <span className="opacity-70 uppercase tracking-widest text-[11px] mt-0.5">Total</span>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-[#1E293B] p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 h-13 transition-all">
            {[
              { id: "Todas", label: "Todas" },
              { id: "Disponible", label: "Disponibles" },
              { id: "Asignado", label: "Asignados" },
              { id: "Mantenimiento", label: "Mantenimiento" }
            ].map((status) => (
              <button
                key={status.id}
                onClick={() => setStatusFilter(status.id as any)}
                className={cn(
                  "px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  statusFilter === status.id
                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-md ring-1 ring-slate-200 dark:ring-slate-600 scale-105 z-10"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                )}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
        {filteredUnits.length > 0 ? (
          filteredUnits.map((unit) => (
            <UnitCard 
              key={unit.id}
              unit={unit}
              assignedDriverName={getAssignedDriver(unit.id)?.name}
              onAssign={(driverId) => handleAssignUnit(unit.id, driverId)}
              onMaintenance={() => handleSetMaintenance(unit.id)}
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

