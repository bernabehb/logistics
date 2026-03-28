"use client";

import { useState } from "react";
import { MOCK_UNITS, Unit, UnitStatus } from "@/features/logistics/models/units";
import { MOCK_DRIVERS, Driver } from "@/features/logistics/models/drivers";
import { UnitCard } from "@/features/logistics/components/cards/UnitCard";
import { Search, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AsignarUnidadesPage() {
  const [units, setUnits] = useState<Unit[]>(MOCK_UNITS);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<UnitStatus>("Disponible");

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
    const matchesStatus = u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full flex flex-col gap-4 h-full pb-12 -mt-2 md:-mt-4">
      {/* Header Section: Title, Search & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all w-full mb-2">
        {/* Left Section: Title & Unified Master Search */}
        <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
              Asignación de Unidades
            </h1>
          </div>
          <div className="relative group w-full md:w-[320px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-slate-500 transition-colors pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por nombre de la unidad..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 h-13 text-sm focus-visible:ring-slate-500/20 shadow-sm transition-all placeholder:text-slate-400 font-medium"
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
              { id: "Disponible", label: "Disponibles" },
              { id: "Asignado", label: "Asignados" },
              { id: "Mantenimiento", label: "Mantenimiento" }
            ].map((status) => (
              <Button
                variant="ghost"
                key={status.id}
                onClick={() => setStatusFilter(status.id as any)}
                className={cn(
                  "h-auto px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap",
                  statusFilter === status.id
                    ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-md ring-1 ring-slate-200 dark:ring-slate-600 scale-105 z-10 hover:bg-white dark:hover:bg-slate-700"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-transparent"
                )}
              >
                {status.label}
              </Button>
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
              assignedDriverIds={Object.values(assignments)}
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

