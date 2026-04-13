"use client";

import { useState, useEffect } from "react";
import { MOCK_LOGISTICS_DATA, LogisticsRow } from "@/features/logistics/models";
import { Driver, ApiDriver, mapApiDriverToDriver } from "@/features/logistics/models/drivers";
import { OrderCard } from "@/features/logistics/components/cards/OrderCard";
import { Search, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";


export default function AsignarRutaPage() {
  const [invoices, setInvoices] = useState<LogisticsRow[]>(
    MOCK_LOGISTICS_DATA.filter((r) => r.estadoGeneral === "ready" && !(r.isUrgent && r.type !== 'anticipada'))
  );

  const [filter, setFilter] = useState<'todos' | 'pendientes' | 'asignados'>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  // Estados para choferes dinámicos
  const [externalDrivers, setExternalDrivers] = useState<Driver[]>([]);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(true);
  const [driversError, setDriversError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDrivers() {
      try {
        setIsLoadingDrivers(true);
        const response = await fetch('/api/drivers');
        if (!response.ok) throw new Error('Falló la conexión');
        
        const data: ApiDriver[] = await response.json();
        if (!data || data.length === 0) {
          setDriversError("No se pudo obtener los datos");
          return;
        }

        const mapped = data.map(mapApiDriverToDriver);
        setExternalDrivers(mapped);
      } catch (err) {
        console.error("Error fetching drivers:", err);
        setDriversError("No se pudo obtener los datos");
      } finally {
        setIsLoadingDrivers(false);
      }
    }

    fetchDrivers();
  }, []);

  const handleAssignDriver = (id: string, driverId: string) => {
    // Modifica el estado "global" del mock en memoria para sincronización entre vistas (solo prototipo, sin persistencia remota).
    const globalInvoice = MOCK_LOGISTICS_DATA.find(inv => inv.id === id);
    if (globalInvoice) {
      globalInvoice.assignedDriverId = driverId;
    }

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, assignedDriverId: driverId } : inv))
    );
  };

  const assignedCount = invoices.filter(i => i.assignedDriverId).length;
  const pendingCount = invoices.length - assignedCount;

  const filteredInvoices = invoices.filter(i => {
    const matchesFilter = filter === 'pendientes'
      ? !i.assignedDriverId
      : filter === 'asignados'
        ? !!i.assignedDriverId
        : true;

    const matchesSearch = searchQuery === '' ||
      i.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  }).sort((a, b) => {
    // Los pendientes van primero, los asignados al final
    if (!!a.assignedDriverId === !!b.assignedDriverId) return 0;
    return a.assignedDriverId ? 1 : -1;
  });

  return (
    <div className="w-full flex flex-col gap-4 h-full pb-12 -mt-2 md:-mt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all w-full mb-2">
        {/* Left Section: Title & Unified Master Search */}
        <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
              Asignación de Pedidos
            </h1>
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

        {/* Right column: Filter Buttons */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => setFilter('todos')}
            className={cn(
              "h-auto px-5 py-3 rounded-2xl flex flex-col items-center min-w-[100px] transition-all border",
              filter === 'todos'
                ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 shadow-md ring-2 ring-blue-500/20"
                : "bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-300"
            )}
          >
            <span className={cn("text-2xl font-black mb-0.5", filter === 'todos' ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300")}>
              {invoices.length}
            </span>
            <span className={cn("text-[10px] uppercase font-bold tracking-wider", filter === 'todos' ? "text-blue-600 dark:text-blue-400" : "text-slate-500")}>
              Todos
            </span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setFilter('pendientes')}
            className={cn(
              "h-auto px-5 py-3 rounded-2xl flex flex-col items-center min-w-[100px] transition-all border",
              filter === 'pendientes'
                ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-md ring-2 ring-slate-400/20"
                : "bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300"
            )}
          >
            <span className={cn("text-2xl font-black mb-0.5", filter === 'pendientes' ? "text-slate-800 dark:text-slate-200" : "text-slate-700 dark:text-slate-300")}>
              {pendingCount}
            </span>
            <span className={cn("text-[10px] uppercase font-bold tracking-wider", filter === 'pendientes' ? "text-slate-600 dark:text-slate-400" : "text-slate-500")}>
              Pendientes
            </span>
          </Button>

          <Button
            variant="outline"
            onClick={() => setFilter('asignados')}
            className={cn(
              "h-auto px-5 py-3 rounded-2xl flex flex-col items-center min-w-[100px] transition-all border",
              filter === 'asignados'
                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 shadow-md ring-2 ring-emerald-500/20"
                : "bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-300"
            )}
          >
            <span className={cn("text-2xl font-black mb-0.5", filter === 'asignados' ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600 dark:text-emerald-500/70")}>
              {assignedCount}
            </span>
            <span className={cn("text-[10px] uppercase font-bold tracking-wider", filter === 'asignados' ? "text-emerald-600 dark:text-emerald-400" : "text-emerald-600/70 dark:text-emerald-500/50")}>
              Asignados
            </span>
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      {filteredInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-3xl">
          <PackageCheck className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-1">
            No hay pedidos listos
          </h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            Los pedidos aparecerán aquí cuando su estado en logística cambie a Listo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
          {filteredInvoices.map((invoice) => (
            <OrderCard 
              key={invoice.id} 
              invoice={invoice} 
              onAssign={handleAssignDriver}
              externalDrivers={externalDrivers}
              isLoadingDrivers={isLoadingDrivers}
              driversError={driversError}
            />
          ))}
        </div>
      )}
    </div>
  );
}
