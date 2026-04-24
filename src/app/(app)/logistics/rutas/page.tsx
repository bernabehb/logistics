"use client";

import { useState, useMemo, useEffect } from "react";
import { Building2, Home, Search as SearchIcon, Truck, ChevronDown, RefreshCw } from "lucide-react";
import { API_ENDPOINTS, API_HEADERS } from "@/lib/apiConfig";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RutaOrderCard, RutaPedido, RutaStatus, RutaInvoiceType } from "@/features/logistics/components/cards/RutaOrderCard";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { LogisticsFilters, LogisticsDateFilters, LogisticsStatusFilters, LogisticsTypeFilters } from "@/features/logistics/components";
import { isAfter, isBefore, startOfDay, endOfDay, parse } from "date-fns";
import { es } from "date-fns/locale";

const BLOCKS_LIST_FALLBACK = [
  "AZTLAN 1", "AZTLAN 2", "AZTLAN 3", "AZTLAN 4",
  "CAMINO REAL 1", "CAMINO REAL 2", "CAMINO REAL 3", "CAMINO REAL 4",
  "FELIX U. GOMEZ", "GENERAL ESCOBEDO", "LA AURORA"
];

interface ApiRutaInvoice {
  factura: string;
  cliente: string;
  sucursal: string;
  almacen: string;
  vendedor: string;
  bloque: string;
  monto_Factura: number;
  fecha: string;
  metodo: string;
  partNum: string;
  material: string;
  cantidad: number;
  unidad: string;
  direccion: string;
  corte: number;
  tipoFactura: "NORMAL" | "ANTICIPADA";
  montoAnticipado: number;
}

// Helper to generate dynamic data from API is now inside the component using state.


interface AvailableUnit {
  id: string;
  name: string;
  sucursal: string;
}

// Client-side cache para persistencia rápida al navegar
let cachedInvoices: RutaPedido[] | null = null;
let cachedUnidades: AvailableUnit[] | null = null;
let cachedAssignedUnits: Record<string, AvailableUnit> | null = null;

export default function RutasPage() {
  const [invoices, setInvoices] = useState<RutaPedido[]>(cachedInvoices || []);
  const [unidadesDisponibles, setUnidadesDisponibles] = useState<AvailableUnit[]>(cachedUnidades || []);
  const [isLoading, setIsLoading] = useState(!cachedInvoices || !cachedUnidades);
  const [error, setError] = useState<string | null>(null);
  
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<'sucursal' | 'domicilio'>('domicilio');
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [statusFilters, setStatusFilters] = useState<RutaStatus[]>([]);
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<RutaInvoiceType>('normal');
  const [assignedUnits, setAssignedUnits] = useState<Record<string, AvailableUnit>>(cachedAssignedUnits || {});
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);

  // Sincronizar asignaciones con la caché
  useEffect(() => {
    cachedAssignedUnits = assignedUnits;
  }, [assignedUnits]);

  // Data Fetching and Mapping
  const fetchAllData = async (forceRefresh = false) => {
    if (!forceRefresh && cachedInvoices && cachedUnidades) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch Unidades Disponibles
      try {
        const unitsResponse = await fetch('/api/units');
          if (unitsResponse.ok) {
            const unitsData = await unitsResponse.json();
            const availableUnits = unitsData
              .filter((u: any) => u.sEstatus === "Disponible")
              .map((u: any, i: number) => ({
                id: `${u.sNombre_Unidad}-${u.sSucursal}-${i}`,
                name: u.sNombre_Unidad,
                sucursal: u.sSucursal
              }));
            cachedUnidades = availableUnits;
            setUnidadesDisponibles(availableUnits);
          }
        } catch (unitErr) {
          console.error("Error fetching units:", unitErr);
        }

        const response = await fetch('/api/routes');
        if (!response.ok) throw new Error('No se pudo conectar con el servidor de rutas');
        const data: ApiRutaInvoice[] = await response.json();

        // Group by Invoice (factura)
        const groupedMap = new Map<string, RutaPedido & { block: string }>();
        const VALID_STATUSES = ['pending', 'in-progress', 'ready'] as const;

        data.forEach((row) => {
          const facturaId = row.factura;
          
          if (!groupedMap.has(facturaId)) {
            // Determine invoice type
            const type: RutaInvoiceType = row.tipoFactura === "ANTICIPADA" ? "anticipada" : "normal";
            
            // For now, randomization of general status is kept as API doesn't provide it yet
            const randomStatusIdx = Math.floor(Math.random() * 3);
            
            groupedMap.set(facturaId, {
              id: facturaId,
              clientName: row.cliente,
              date: row.fecha,
              warehouses: [],
              vendedor: row.vendedor,
              deliveryType: row.metodo === 'EAD' ? 'domicilio' : 'sucursal',
              block: (row.bloque || "GENERAL").trim().toUpperCase(),
              estadoGeneral: VALID_STATUSES[randomStatusIdx],
              type: type,
              completedDeliveries: type === 'anticipada' ? (row.montoAnticipado > 0 ? 1 : 0) : undefined,
              hasGlassCut: false,
              montoTotal: row.monto_Factura
            });
          }

          const current = groupedMap.get(facturaId)!;
          
          // Determine Warehouse
          let warehouseName = (row.almacen || "").trim().toUpperCase();
          let warehouseId: string | null = null;
          
          if (warehouseName.includes("ALUMINIO")) warehouseId = "Aluminio";
          else if (warehouseName.includes("VIDRIO")) warehouseId = "Vidrio";
          else if (warehouseName.includes("HERRAJE")) warehouseId = "Herrajes";

          if (warehouseId) {
            // Aggregate warehouse if not already present
            if (!current.warehouses.some(w => w.id === warehouseId)) {
              current.warehouses.push({
                id: warehouseId,
                status: VALID_STATUSES[Math.floor(Math.random() * 3)] // Keep random status for Wh for now
              });
            }

            // Specific "CORTE" logic for VIDRIO
            if (warehouseId === "Vidrio" && row.corte === 1) {
              current.hasGlassCut = true;
            }
          }
        });

        const allData = Array.from(groupedMap.values());

        cachedInvoices = allData;
        setInvoices(allData);
        setError(null);
      } catch (err) {
        console.error("Error fetching routes:", err);
        setError("Error al cargar la información de rutas dinámica");
      } finally {
        setIsLoading(false);
      }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Compute Blocks from Data
  const BLOCKS_LIST = useMemo(() => {
    if (invoices.length === 0) return BLOCKS_LIST_FALLBACK;
    const blocks = new Set<string>();
    invoices.forEach(p => {
      if (p.block) blocks.add(p.block);
    });
    BLOCKS_LIST_FALLBACK.forEach(b => blocks.add(b));
    return Array.from(blocks).sort();
  }, [invoices]);

  const toggleStatusFilter = (status: RutaStatus) => {
    setStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setFromDate(undefined);
    setToDate(undefined);
    setStatusFilters([]);
    setInvoiceTypeFilter('normal');
  };

  const filteredPedidos = useMemo(() => {
    const filtered = invoices.filter((p) => {
      // 1. Delivery Type (Sucursal/Domicilio)
      if (p.deliveryType !== deliveryTypeFilter) return false;

      // 2. Search Query
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch = p.id.toLowerCase().includes(lowerQuery) ||
          p.clientName.toLowerCase().includes(lowerQuery);
        if (!matchesSearch) return false;
      }

      // 3. Invoice Type
      if (p.type !== invoiceTypeFilter) return false;

      // 4. Status Filters - Deep check within warehouses
      if (statusFilters.length > 0 && !p.warehouses.some(w => statusFilters.includes(w.status))) {
        return false;
      }

      // 5. Date Range
      if (fromDate || toDate) {
        // Safe parsing: take only YYYY-MM-DD
        const cleanDateStr = p.date?.split('T')[0]?.split(' ')[0] || "";
        const parts = cleanDateStr.split('-');
        
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const day = parseInt(parts[2]);
          const rowDate = new Date(year, month, day);

          if (fromDate) {
            const from = startOfDay(fromDate);
            if (!(isAfter(rowDate, from) || rowDate.getTime() === from.getTime())) return false;
          }

          if (toDate) {
            const to = endOfDay(toDate);
            if (!(isBefore(rowDate, to) || rowDate.getTime() === to.getTime())) return false;
          }
        }
      }

      return true;
    });

    // Limit sucursal invoices as requested to avoid clutter
    if (deliveryTypeFilter === "sucursal") {
      return filtered.slice(0, 15);
    }

    return filtered;
  }, [invoices, deliveryTypeFilter, searchQuery, fromDate, toDate, statusFilters, invoiceTypeFilter]);

  // Grouping
  const groupedData = useMemo(() => {
    const groups: Record<string, RutaPedido[]> = {};
    BLOCKS_LIST.forEach(b => groups[b] = []);
    filteredPedidos.forEach(p => {
      if (p.block && groups[p.block]) {
        groups[p.block].push(p);
      }
    });
    return groups;
  }, [filteredPedidos, BLOCKS_LIST]);

  return (
    <div className="w-full flex flex-col gap-4 h-full pb-12 -mt-2 md:-mt-4">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
          Gestión de rutas
        </h1>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchAllData(true)}
          disabled={isLoading}
          className="h-8 rounded-xl font-bold border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
        >
          <RefreshCw className={cn("size-3.5 mr-2", isLoading && "animate-spin text-blue-500")} />
          Actualizar
        </Button>
      </div>

      {/* Unified Single Row Filters */}
      <div className="flex flex-wrap items-center gap-3 md:gap-1.5 w-full bg-white/50 dark:bg-slate-900/40 py-2 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* 1. Search Bar */}
        <div className="relative group w-full md:w-[220px] shrink-0">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-500 transition-colors pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar factura o cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 h-9 text-xs focus-visible:ring-slate-500/20 shadow-sm transition-all placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* 2. Group A: Dates Only */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center">
            <LogisticsDateFilters
              fromDate={fromDate}
              onFromDateChange={setFromDate}
              toDate={toDate}
              onToDateChange={setToDate}
              onClearFilters={clearFilters}
            />
          </div>
        </div>

        {/* 3-5. Group B: Status, Type & Delivery */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-between min-[1400px]:justify-end min-[1400px]:ml-auto">
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>
          <div className="scale-95 origin-left">
            <LogisticsStatusFilters
              activeStatusFilters={statusFilters as any}
              onToggleStatusFilter={toggleStatusFilter as any}
              compact={true}
            />
          </div>
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>
          <LogisticsTypeFilters
            invoiceTypeFilter={invoiceTypeFilter as any}
            onInvoiceTypeChange={setInvoiceTypeFilter as any}
          />
          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden min-[1400px]:block"></div>
          <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 h-9 shrink-0">
            {[
              { id: 'domicilio', label: 'Domicilio', Icon: Home },
              { id: 'sucursal', label: 'Sucursal', Icon: Building2 },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setDeliveryTypeFilter(btn.id as any)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                  deliveryTypeFilter === btn.id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {btn.Icon && <btn.Icon className="size-3" />}
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content View */}
      {isLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-white/30 dark:bg-slate-900/20 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 animate-pulse">
          <Truck className="size-10 text-slate-300 dark:text-slate-700 animate-bounce mb-4" />
          <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Cargando rutas...</p>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-red-50/30 dark:bg-red-900/10 rounded-3xl border border-dashed border-red-200 dark:border-red-900/30">
          <p className="text-sm font-bold text-red-500 mb-2">{error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </div>
      ) : deliveryTypeFilter === 'domicilio' ? (
        /* 11 Block Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 min-[2000px]:grid-cols-4 gap-4">
          {BLOCKS_LIST.filter(blockName => (groupedData[blockName] || []).length > 0).map((blockName) => {
            const items = groupedData[blockName] || [];
            return (
              <Card key={blockName} className="border-2 border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/40 rounded-2xl overflow-hidden flex flex-col h-full shadow-md transition-all hover:shadow-lg">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider leading-none">
                        {blockName}
                      </CardTitle>
                      <div className="flex items-center justify-center size-5 rounded-full bg-blue-600 dark:bg-blue-500 text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                        {items.length}
                      </div>
                    </div>

                    <Popover 
                      open={openPopoverId === blockName} 
                      onOpenChange={(open) => setOpenPopoverId(open ? blockName : null)}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "h-8 px-3 text-[10px] font-black border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2 transition-all hover:bg-slate-50",
                            assignedUnits[blockName] 
                              ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-none ring-0 opacity-100" 
                              : "bg-white dark:bg-slate-800 shadow-sm opacity-80"
                          )}
                        >
                          <Truck className="size-3.5" />
                          <span className="uppercase tracking-widest truncate max-w-[100px]">
                            {assignedUnits[blockName] ? assignedUnits[blockName].name : "Unidad"}
                          </span>
                          <ChevronDown className="size-3 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-2 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl" align="end">
                        <div className="flex flex-col gap-1">
                          <p className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 mb-1">
                            Seleccionar Unidad
                          </p>
                          <div className="grid grid-cols-1 gap-0.5 max-h-[240px] overflow-y-auto pr-1 select-none no-scrollbar">
                            <button
                              onClick={() => {
                                setAssignedUnits(prev => {
                                  const next = { ...prev };
                                  delete next[blockName];
                                  return next;
                                });
                                setOpenPopoverId(null);
                              }}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                                !assignedUnits[blockName]
                                  ? "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm"
                                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                              )}
                            >
                              Sin Asignación
                            </button>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 my-0.5 mx-2"></div>
                            {unidadesDisponibles.length > 0 ? (
                              unidadesDisponibles.map((unid) => (
                                <button
                                  key={unid.id}
                                  onClick={() => {
                                    setAssignedUnits(prev => ({ ...prev, [blockName]: unid }));
                                    setOpenPopoverId(null);
                                  }}
                                  className={cn(
                                    "w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all flex justify-between items-center",
                                    assignedUnits[blockName]?.id === unid.id
                                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                                  )}
                                >
                                  <span>{unid.name}</span>
                                  <span className={cn(
                                    "text-[8px] px-1.5 py-0.5 rounded-md truncate max-w-[80px]",
                                    assignedUnits[blockName]?.id === unid.id
                                      ? "bg-white/20 text-white"
                                      : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                                  )}>
                                    {unid.sucursal}
                                  </span>
                                </button>
                              ))
                            ) : (
                              <div className="px-3 py-4 text-center text-slate-400 text-[9px] font-black uppercase tracking-widest">
                                No hay unidades disponibles
                              </div>
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </CardHeader>

                <CardContent className="px-2 py-4 flex-1">
                  {items.length > 0 ? (
                    <div className={cn(
                      "flex flex-col gap-3",
                      items.length > 2 
                        ? "max-h-[510px] overflow-y-auto pr-2 custom-scrollbar" 
                        : "h-auto overflow-visible pr-0"
                    )}>
                      {items.map(p => (
                        <div key={p.id} className="shrink-0">
                          <RutaOrderCard pedido={p} activeStatusFilters={statusFilters} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800/50 rounded-3xl opacity-40">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sin resultados</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Direct Order Grid for Sucursal */
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter">
              Todos los Pedidos en Sucursal
            </h2>
            <Badge variant="secondary" className="px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
              {filteredPedidos.length} Total
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {filteredPedidos.length > 0 ? (
              filteredPedidos.map(p => (
                <RutaOrderCard key={p.id} pedido={p} activeStatusFilters={statusFilters} />
              ))
            ) : (
              <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center opacity-50">
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">No hay pedidos pendientes en sucursal</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
