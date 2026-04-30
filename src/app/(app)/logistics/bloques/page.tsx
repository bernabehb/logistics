"use client";

import { useState, useEffect } from "react";
import { Block, BlockStatus } from "@/features/logistics/models/blocks";
import { Driver, ApiDriver, mapApiDriverToDriver } from "@/features/logistics/models/drivers";
import { BlockCard } from "@/features/logistics/components/cards/BlockCard";
import { Search, Layers, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { API_ENDPOINTS, API_HEADERS } from "@/lib/apiConfig";

interface ApiBlockStatus {
  iIdDeliveryBlock: number;
  sDeliveryBlock: string;
  sEstatus: string;
  sChofer: string | null;
  sUnidad: string | null;
  iIdDriver: number | null;
  iIdUnit: number | null;
}

// Cache persistente para navegación rápida
let cachedBlocks: Block[] | null = null;
let cachedDrivers: Driver[] | null = null;

export default function BloquesPage() {
  const [blocks, setBlocks] = useState<Block[]>(cachedBlocks || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BlockStatus>("Disponible");

  const [isLoadingBlocks, setIsLoadingBlocks] = useState(!cachedBlocks);
  
  const [drivers, setDrivers] = useState<Driver[]>(cachedDrivers || []);
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(!cachedDrivers);
  const [driverError, setDriverError] = useState<string | null>(null);
  
  const [errorDialog, setErrorDialog] = useState<{ show: boolean; message: string }>({ show: false, message: "" });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAllData = async (silent: boolean | any = false) => {
    const isManualRefresh = typeof silent === 'object' && silent !== null;
    const isSilent = typeof silent === 'boolean' ? silent : false;
    
    setIsRefreshing(true);
    if (isManualRefresh || (!isSilent && !cachedBlocks)) {
      setIsLoadingBlocks(true);
      setIsLoadingDrivers(true);
    }
    setDriverError(null);
    
    try {
      const [blocksRes, driversRes] = await Promise.all([
        fetch('/api/logistics/blocks-status'),
        fetch('/api/drivers'),
      ]);

      if (!blocksRes.ok || !driversRes.ok) throw new Error('Error al conectar con los servidores');
      
      const blocksData: ApiBlockStatus[] = await blocksRes.json();
      const driversData: ApiDriver[] = await driversRes.json();
      
      // Map Blocks
      const mappedBlocks: Block[] = blocksData.map(b => ({
        id: b.iIdDeliveryBlock.toString(),
        iId: b.iIdDeliveryBlock,
        name: b.sDeliveryBlock,
        status: (b.sEstatus || "Disponible") === "Asignado" ? "Asignado" : "Disponible",
        apiDriverName: b.sChofer || undefined
      }));
      setBlocks(mappedBlocks);
      cachedBlocks = mappedBlocks;

      // Map & Sort Drivers by Branch Priority
      const branchPriority: Record<string, number> = {
        'MONTERREY': 0,
        'APODACA': 1,
        'GUADALUPE': 2,
        'SANTA CATARINA': 3
      };

      const mappedDrivers: Driver[] = driversData
        .map(d => mapApiDriverToDriver(d))
        .sort((a, b) => {
          const priorityA = branchPriority[a.sucursal?.toUpperCase() || ''] ?? 99;
          const priorityB = branchPriority[b.sucursal?.toUpperCase() || ''] ?? 99;
          
          if (priorityA !== priorityB) return priorityA - priorityB;
          return a.name.localeCompare(b.name);
        });

      setDrivers(mappedDrivers);
      cachedDrivers = mappedDrivers;
    } catch (err) {
      console.error('Error fetching data:', err);
      setDriverError('No se pudieron cargar los datos del servidor');
    } finally {
      setIsRefreshing(false);
      setIsLoadingBlocks(false);
      setIsLoadingDrivers(false);
    }
  };

  useEffect(() => {
    // Carga inicial: Si no hay caché, se muestra el spinner.
    // Si hay caché, se usa el estado inicial (que ya tiene cachedBlocks) y se refresca en silencio.
    fetchAllData(!!cachedBlocks);
  }, []);

  // Polling para actualizaciones silenciosas cada 10 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAllData(true);
      }
    }, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAllData(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const getAssignedDriverName = (block: Block) => {
    return block.apiDriverName;
  };

  const handleAssignBlock = async (blockId: string, driverId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    const originalBlocks = [...blocks];
    const targetDriver = drivers.find(d => d.id === driverId);

    // Actualización Optimista: Reflejar el cambio inmediatamente en la UI
    setBlocks(prev => prev.map(b => {
      if (b.id === blockId) {
        return { 
          ...b, 
          status: driverId ? "Asignado" : "Disponible",
          apiDriverName: driverId ? targetDriver?.name : undefined
        };
      }
      return b;
    }));

    // Si driverId es vacío, es una liberación
    if (!driverId) {
      try {
        const response = await fetch('/api/logistics/unassign-block', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(block.iId)
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          const errorMsg = errData?.message || errData?.error || "Error en la liberación";
          throw new Error(errorMsg);
        }
        
        // Refresco silencioso en segundo plano con retraso para dar tiempo a la BD
        setTimeout(() => fetchAllData(true), 2000);
      } catch (err: any) {
        console.warn("Validation/Error assigning block:", err?.message || err);
        setBlocks(originalBlocks); // Revertir en caso de error
        
        if (err && err.message) {
          setErrorDialog({ show: true, message: err.message });
        } else {
          setErrorDialog({ show: true, message: "Hubo un error al intentar liberar el bloque. Intenta de nuevo más tarde." });
        }
      }
      return;
    }

    let iIdDriver = 0;
    iIdDriver = parseInt(driverId);

    try {
      const response = await fetch('/api/logistics/assign-block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          iIdDeliveryBlock: block.iId,
          iIdDriver: iIdDriver
        })
      });

      if (!response.ok) throw new Error("Error en la respuesta del servidor");
      
      // Refresco silencioso en segundo plano con retraso para dar tiempo a la BD
      setTimeout(() => fetchAllData(true), 2000);
    } catch (err) {
      console.error("Error assigning block:", err);
      setBlocks(originalBlocks); // Revertir en caso de error
      alert("Hubo un error al procesar la asignación.");
    }
  };

  const counts = {
    Todas: blocks.length,
    Disponible: blocks.filter(b => b.status === "Disponible").length,
    Asignado: blocks.filter(b => b.status === "Asignado").length,
  };

  const filteredBlocks = blocks.filter(b => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = b.name.toLowerCase().includes(q);
    const matchesStatus = b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full flex flex-col gap-4 h-full pb-12 -mt-2 md:-mt-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
          Asignación de Bloques
        </h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchAllData}
          disabled={isLoadingBlocks}
          className="h-9 rounded-xl font-bold border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
        >
          <RefreshCw className={cn("size-3.5 mr-2", isRefreshing && "animate-spin text-blue-500")} />
          Actualizar
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 md:gap-6 w-full bg-white/50 dark:bg-slate-900/40 py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="relative group w-full lg:w-auto lg:min-w-[320px] flex-1 max-w-md shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-500 transition-colors pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar por nombre de bloque..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 h-10 text-xs focus-visible:ring-slate-500/20 shadow-sm transition-all placeholder:text-slate-400 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
          <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-[#1E293B] p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 h-9 shrink-0">
            {[
              { id: "Disponible", label: "Disponibles" },
              { id: "Asignado", label: "Asignados" },
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
        {isLoadingBlocks ? (
           <div className="col-span-full flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-500 mb-4" />
              <p className="text-slate-500 font-medium">Cargando bloques...</p>
           </div>
        ) : filteredBlocks.length > 0 ? (
          filteredBlocks.map((block) => (
            <BlockCard 
              key={block.id}
              block={block}
              assignedDriverName={getAssignedDriverName(block)}
              onAssign={(driverId) => handleAssignBlock(block.id, driverId)}
              allDrivers={drivers}
              isLoadingDrivers={isLoadingDrivers}
              driverError={driverError}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem]">
            <Layers className="size-20 text-slate-200 dark:text-slate-800 mb-4 transition-colors" />
            <h3 className="text-xl font-bold text-slate-400 dark:text-slate-600 transition-colors">No se encontraron bloques</h3>
          </div>
        )}
      </div>

      <Dialog open={errorDialog.show} onOpenChange={(open) => !open && setErrorDialog({ show: false, message: "" })}>
        <DialogContent className="sm:max-w-md p-6 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">No se pudo liberar el bloque</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {errorDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex justify-end">
            <Button
              onClick={() => setErrorDialog({ show: false, message: "" })}
              className="px-6 py-2.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-colors"
            >
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
