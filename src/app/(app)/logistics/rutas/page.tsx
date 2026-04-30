"use client";

import { useState, useMemo, useEffect, Fragment, useRef } from "react";
import { Building2, Home, Search as SearchIcon, Truck, ChevronDown, RefreshCw, LayoutGrid, List, User } from "lucide-react";
import { API_ENDPOINTS, API_HEADERS } from "@/lib/apiConfig";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RutaOrderCard, RutaPedido, RutaStatus, RutaInvoiceType } from "@/features/logistics/components/cards/RutaOrderCard";
import { Driver, ApiDriver, mapApiDriverToDriver } from "@/features/logistics/models/drivers";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { LogisticsFilters, LogisticsDateFilters, LogisticsStatusFilters, LogisticsTypeFilters, StatusCircle, StatusPill } from "@/features/logistics/components";
import { isAfter, isBefore, startOfDay, endOfDay, parse } from "date-fns";
import { es } from "date-fns/locale";

const BLOCKS_LIST_FALLBACK = [
  "AZTLAN 1", "AZTLAN 2", "AZTLAN 3", "AZTLAN 4",
  "CAMINO REAL 1", "CAMINO REAL 2", "CAMINO REAL 3", "CAMINO REAL 4",
  "FELIX U. GOMEZ", "GENERAL ESCOBEDO", "LA AURORA"
];

interface ApiRutaInvoice {
  tipoFactura: string;
  montoAnticipado: number;
  orderNum: number;
  factura: string;
  linea: number;
  custNum: number;
  custID: string;
  cliente: string;
  direccionCliente: string;
  direccionEnvio: string;
  orderDate: string;
  fecha: string;
  partNum: string;
  material: string;
  orderQty: number;
  salesUM: string;
  cantidad: number;
  unidadEmbarque: string;
  totalNetWeight: number;
  unidadPeso: string;
  almacen: string;
  warehouseCode: string;
  almacenDescripcionEpicor: string;
  pasillo: string;
  descripcionBin: string;
  descripcionLargaUdc: string;
  corte: number;
  vendedor: string;
  metodo: string;
  monto_Factura: number;
  sucursal: string;
  bloque: string;
  estatusEmbarque: string;
}

// Helper to generate dynamic data from API is now inside the component using state.


interface AvailableUnit {
  id: string;
  name: string;
  sucursal: string;
  iId: number;
}

interface ApiBlockStatus {
  iIdDeliveryBlock: number;
  sDeliveryBlock: string;
  sEstatus: string;
  sChofer: string | null;
  sUnidad: string | null;
  iIdDriver: number | null;
  iIdUnit: number | null;
}

// Client-side cache para persistencia rápida al navegar
let cachedInvoices: RutaPedido[] | null = null;
let cachedUnidades: AvailableUnit[] | null = null;
let cachedAssignedUnits: Record<string, AvailableUnit> | null = null;
let cachedDrivers: Driver[] | null = null;
let cachedBlocks: ApiBlockStatus[] | null = null;
let cachedInvoicesByDriver: Record<string, RutaPedido[]> = {};
let lastDriverFilter: string = 'all';

export default function RutasPage() {
  const [invoices, setInvoices] = useState<RutaPedido[]>(cachedInvoicesByDriver[lastDriverFilter] || []);
  const [unidadesDisponibles, setUnidadesDisponibles] = useState<AvailableUnit[]>(cachedUnidades || []);
  const [isLoading, setIsLoading] = useState(!cachedInvoices);
  const [error, setError] = useState<string | null>(null);
  
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<'sucursal' | 'domicilio'>('domicilio');
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [statusFilters, setStatusFilters] = useState<RutaStatus[]>([]);
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<RutaInvoiceType>('normal');
  const [assignedUnits, setAssignedUnits] = useState<Record<string, AvailableUnit>>(cachedAssignedUnits || {});
  const [openPopoverId, setOpenPopoverId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [driverFilter, setDriverFilter] = useState<string>(lastDriverFilter);
  const [drivers, setDrivers] = useState<Driver[]>(cachedDrivers || []);
  const [apiBlocks, setApiBlocks] = useState<ApiBlockStatus[]>(cachedBlocks || []);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);

  const lastRequestRef = useRef<number>(0);

  // Sincronizar asignaciones con la caché
  useEffect(() => {
    cachedAssignedUnits = assignedUnits;
  }, [assignedUnits]);

  // Sincronizar con el cambio de filtro de chofer
  useEffect(() => {
    lastDriverFilter = driverFilter;
    fetchAllData(false); // No forzar si ya lo tenemos en caché
  }, [driverFilter]);

  const handleAssignUnit = async (blockName: string, unit: AvailableUnit | null) => {
    // Find the block iId from our fetched blocks
    const apiBlock = apiBlocks.find(b => b.sDeliveryBlock.trim().toUpperCase() === blockName.trim().toUpperCase());
    
    if (!apiBlock) {
      alert(`No se pudo encontrar el ID del bloque "${blockName}" en el catálogo.`);
      return;
    }

    const originalAssignments = { ...assignedUnits };

    // Optimistic update
    setAssignedUnits(prev => {
      const next = { ...prev };
      if (unit) {
        next[blockName] = unit;
      } else {
        delete next[blockName];
      }
      return next;
    });

    try {
      setIsAssigning(blockName);
      const response = await fetch('/api/logistics/assign-unit-to-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iIdDeliveryBlock: Number(apiBlock.iIdDeliveryBlock),
          iIdUnit: unit ? Number(unit.iId) : 0
        })
      });

      if (!response.ok) throw new Error("Error en la asignación");
      
      // Refresh silently in background
      fetchAllData(true, true);
    } catch (err) {
      console.error("Error assigning unit to block:", err);
      setAssignedUnits(originalAssignments); // Rollback
      alert("Hubo un error al asignar la unidad al bloque.");
    } finally {
      setIsAssigning(null);
      setOpenPopoverId(null);
    }
  };

  // Data Fetching and Mapping
  const fetchAllData = async (forceRefresh = false, silent = false) => {
    const requestId = ++lastRequestRef.current;
    
    // Si ya tenemos datos para ESTE chofer y no es force ni silent, usar caché
    if (!forceRefresh && !silent && cachedInvoicesByDriver[driverFilter]) {
      setInvoices(cachedInvoicesByDriver[driverFilter]);
      setIsLoading(false);
      return;
    }

    try {
      if (!silent) setIsLoading(true);
      setError(null);

      // 1. Iniciar peticiones en paralelo para ganar velocidad
      const catalogsNeeded = forceRefresh || !cachedUnidades || !cachedDrivers || !cachedBlocks;
      
      let routesUrl = '/api/routes';
      if (driverFilter && driverFilter !== 'all') {
        routesUrl += `?iIdDriver=${driverFilter}`;
      }

      // Disparamos todo al mismo tiempo
      const [catalogsResults, routesResponse] = await Promise.all([
        catalogsNeeded 
          ? Promise.all([
              fetch('/api/logistics/blocks-status'),
              fetch('/api/units'),
              fetch('/api/logistics/assigned-drivers')
            ])
          : Promise.resolve(null),
        fetch(routesUrl)
      ]);

      // 2. Procesar Catálogos (si se pidieron)
      if (catalogsResults) {
        const [blocksRes, unitsRes, driversRes] = catalogsResults;
        
        if (blocksRes.ok) {
          const blocksData: ApiBlockStatus[] = await blocksRes.json();
          setApiBlocks(blocksData);
          cachedBlocks = blocksData;
          
          const initialAssignments: Record<string, AvailableUnit> = {};
          blocksData.forEach(b => {
            if (b.sUnidad && b.iIdUnit) {
              const blockKey = b.sDeliveryBlock.trim().toUpperCase();
              initialAssignments[blockKey] = {
                id: `${b.sUnidad}-${b.iIdUnit}`,
                name: b.sUnidad,
                sucursal: "", 
                iId: Number(b.iIdUnit || 0)
              };
            }
          });
          setAssignedUnits(initialAssignments);
          cachedAssignedUnits = initialAssignments;
        }

        if (unitsRes.ok) {
          const unitsData = await unitsRes.json();
          const availableUnits = unitsData
            .filter((u: any) => u.sEstatus === "Disponible")
            .map((u: any, i: number) => ({
              id: `${u.sNombre_Unidad}-${u.sSucursal}-${i}`,
              name: u.sNombre_Unidad,
              sucursal: u.sSucursal,
              iId: Number(u.iId || u.sId || 0)
            }));
          setUnidadesDisponibles(availableUnits);
          cachedUnidades = availableUnits;
        }

        if (driversRes.ok) {
          const driversData = await driversRes.json();
          const mappedDrivers = driversData.map((d: ApiDriver) => mapApiDriverToDriver(d));
          setDrivers(mappedDrivers);
          cachedDrivers = mappedDrivers;
        }
      }

      // 3. Procesar Rutas
      // Protección contra Race Conditions
      if (requestId !== lastRequestRef.current) return;

      if (!routesResponse.ok) throw new Error('No se pudo conectar con el servidor de rutas');
      const data: ApiRutaInvoice[] = await routesResponse.json();

      // Mapeo de datos (optimizado)
      const groupedMap = new Map<string, RutaPedido & { block: string }>();
      
      data.forEach((row) => {
        const isFactura = row.factura && row.factura.trim() !== "";
        const groupKey = isFactura ? row.factura : `ORDER-${row.orderNum}`;
        
        if (!groupedMap.has(groupKey)) {
          // ... resto del mapeo ...
            // Determine invoice type
            const type: RutaInvoiceType = row.tipoFactura === "ANTICIPADA" ? "anticipada" : "normal";
            
            // Map status from estatusEmbarque
            let status: RutaStatus = 'pending';
            const rawStatus = (row.estatusEmbarque || "").toLowerCase();
            if (rawStatus === 'listo') status = 'ready';
            else if (rawStatus === 'en proceso' || rawStatus === 'embarcado') status = 'in-progress';
            else status = 'pending';

            groupedMap.set(groupKey, {
              id: groupKey,
              clientName: row.cliente,
              date: isFactura ? row.fecha : row.orderDate,
              warehouses: [],
              vendedor: row.vendedor,
              deliveryType: (row.metodo === 'EAD' || (row.bloque && row.bloque.includes("ZONA"))) ? 'domicilio' : 'sucursal',
              block: (row.bloque || "GENERAL").trim().toUpperCase(),
              estadoGeneral: status, // Use current row's status for general state initial value
              type: type,
              completedDeliveries: type === 'anticipada' ? (row.montoAnticipado > 0 ? 1 : 0) : undefined,
              hasGlassCut: false,
              montoTotal: row.monto_Factura,
              orderNum: row.orderNum
            });
          }

          const current = groupedMap.get(groupKey)!;
          
          // Determine Warehouse
          let warehouseName = (row.almacen || "").trim().toUpperCase();
          let warehouseId: string | null = null;
          
          if (warehouseName.includes("ALUMINIO")) warehouseId = "Aluminio";
          else if (warehouseName.includes("VIDRIO")) warehouseId = "Vidrio";
          else if (warehouseName.includes("HERRAJE")) warehouseId = "Herrajes";

          if (warehouseId) {
             // Map status from estatusEmbarque
            let itemStatus: RutaStatus = 'pending';
            const rawStatus = (row.estatusEmbarque || "").toLowerCase();
            if (rawStatus === 'listo') itemStatus = 'ready';
            else if (rawStatus === 'en proceso' || rawStatus === 'embarcado') itemStatus = 'in-progress';
            else itemStatus = 'pending';

            // Aggregate warehouse if not already present
            if (!current.warehouses.some(w => w.id === warehouseId)) {
              current.warehouses.push({
                id: warehouseId,
                status: itemStatus
              });
            } else {
                // Logic to consolidate statuses for the same warehouse category
                const existing = current.warehouses.find(w => w.id === warehouseId)!;
                // Priority: pending > in-progress > ready (if one is pending, whole category is pending)
                if (itemStatus === 'pending') existing.status = 'pending';
                else if (itemStatus === 'in-progress' && existing.status === 'ready') existing.status = 'in-progress';
            }

            // Specific "CORTE" logic for VIDRIO
            if (warehouseId === "Vidrio" && row.corte === 1) {
              current.hasGlassCut = true;
            }
          }
        });

        const allData = Array.from(groupedMap.values());

        // Mapeo final y guardado en caché específica por chofer
        cachedInvoicesByDriver[driverFilter] = allData;
        cachedInvoices = allData;
        setInvoices(allData);
        setError(null);
      } catch (err) {
        console.error("Error fetching routes:", err);
        setError("Error al cargar la información de rutas dinámica");
      } finally {
        if (requestId === lastRequestRef.current) {
          setIsLoading(false);
        }
      }
  };

  // Quitamos el useEffect de montaje redundante, ya que el useEffect de [driverFilter]
  // se encarga de la carga inicial al activarse por primera vez.

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
        const matchesSearch = 
          p.id.toLowerCase().includes(lowerQuery) ||
          p.clientName.toLowerCase().includes(lowerQuery) ||
          (p.block && p.block.toLowerCase().includes(lowerQuery)) ||
          (p.orderNum && p.orderNum.toString().includes(lowerQuery));
        if (!matchesSearch) return false;
      }

      // 3. Invoice Type
      if (p.type !== invoiceTypeFilter) return false;

      // 4. Status Filters - Deep check within warehouses
      if (statusFilters.length > 0 && !p.warehouses.some(w => statusFilters.includes(w.status))) {
        return false;
      }

      // 5. Date Filter (Single Day)
      if (fromDate) {
        // Safe parsing: take only YYYY-MM-DD
        const cleanDateStr = p.date?.split('T')[0]?.split(' ')[0] || "";
        const parts = cleanDateStr.split('-');
        
        if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1;
          const day = parseInt(parts[2]);
          const rowDate = new Date(year, month, day);

          const filterDate = startOfDay(fromDate);
          if (rowDate.getTime() !== filterDate.getTime()) return false;
        }
      }

      return true;
    });

    // Limit sucursal invoices as requested to avoid clutter
    if (deliveryTypeFilter === "sucursal") {
      return filtered.slice(0, 15);
    }

    return filtered;
  }, [invoices, deliveryTypeFilter, searchQuery, fromDate, statusFilters, invoiceTypeFilter]);

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
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 pl-3 pr-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-all hover:bg-white dark:hover:bg-slate-900 shadow-sm min-w-[180px] justify-between group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <User className="size-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                  <span className="truncate max-w-[200px]">
                    {driverFilter === 'all' ? 'TODOS LOS CHOFERES' : drivers.find(d => d.id === driverFilter)?.name || 'TODOS LOS CHOFERES'}
                  </span>
                </div>
                <ChevronDown className="size-3.5 text-slate-400 shrink-0 ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px] p-2 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl" align="end">
              <div className="flex flex-col gap-1">
                <p className="px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                  Filtrar por Chofer
                </p>
                <button
                  onClick={() => setDriverFilter('all')}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                    driverFilter === 'all'
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  )}
                >
                  <div className={cn("size-2 rounded-full", driverFilter === 'all' ? "bg-white animate-pulse" : "bg-blue-500")} />
                  TODOS LOS CHOFERES
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                <div className="max-h-[320px] overflow-y-auto pr-1 no-scrollbar flex flex-col gap-0.5">
                  {drivers.map(driver => (
                    <button
                      key={driver.id}
                      onClick={() => setDriverFilter(driver.id)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group",
                        driverFilter === driver.id
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      )}
                    >
                      <div className={cn(
                        "size-6 rounded-lg flex items-center justify-center text-[10px] shrink-0",
                        driverFilter === driver.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600"
                      )}>
                        {driver.name.substring(0, 1)}
                      </div>
                      <span className="truncate">{driver.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>
          {/* View Toggle */}
          <div className="flex items-center bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 h-9">
            <button
              onClick={() => setViewMode('cards')}
              title="Vista de Tarjetas"
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === 'cards' 
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              title="Vista de Tablero"
              className={cn(
                "p-1.5 rounded-lg transition-all",
                viewMode === 'table' 
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600" 
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              )}
            >
              <List className="size-4" />
            </button>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchAllData(true)}
            disabled={isLoading}
            className="h-9 rounded-xl font-bold border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <RefreshCw className={cn("size-3.5 mr-2", isLoading && "animate-spin text-blue-500")} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Unified Single Row Filters */}
      <div className="flex flex-wrap items-center gap-3 md:gap-1.5 w-full bg-white/50 dark:bg-slate-900/40 py-2 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* 1. Search Bar */}
        <div className="relative group w-full md:w-[320px] shrink-0">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-500 transition-colors pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar por factura, cliente u orden"
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
              onClearFilters={clearFilters}
              isSingleDate={true}
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
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white/50 dark:bg-[#0F172A]/40 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Factura #</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Aluminio</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Vidrio</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Herrajes</th>
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado General</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPedidos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="size-16 rounded-full bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800">
                          <Truck className="size-8 text-slate-300 dark:text-slate-600" />
                        </div>
                        <span className="text-sm font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em]">No se encontraron resultados</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Prueba cambiando los filtros de búsqueda, estatus o fecha</p>
                      </div>
                    </td>
                  </tr>
                ) : deliveryTypeFilter === 'sucursal' ? (
                  <>
                    {/* Single header for sucursal as seen in user's image */}
                    <tr className="bg-slate-50/80 dark:bg-slate-800/30 border-y border-slate-200/60 dark:border-slate-800/60">
                      <td colSpan={6} className="px-6 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">Entrega en Sucursal</span>
                          <div className="size-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                            {filteredPedidos.length}
                          </div>
                        </div>
                      </td>
                    </tr>
                    {filteredPedidos.map(p => {
                      const aluminio = p.warehouses.find(w => w.id === 'Aluminio')?.status || 'none';
                      const vidrio = p.warehouses.find(w => w.id === 'Vidrio')?.status || 'none';
                      const herrajes = p.warehouses.find(w => w.id === 'Herrajes')?.status || 'none';
                      
                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {p.id.startsWith('ORDER-') ? `Orden: ${p.id.split('-')[1]}` : `Factura: ${p.id}`}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{p.date}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 group-hover:border-blue-200 dark:group-hover:border-blue-900/50 transition-colors">
                                  {p.clientName.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-black text-slate-700 dark:text-slate-200 truncate max-w-[240px] leading-tight">{p.clientName}</span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 opacity-70 truncate">{p.vendedor}</span>
                                </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-center">
                              <StatusCircle status={aluminio} />
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-center">
                              <StatusCircle status={vidrio} />
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-center">
                              <StatusCircle status={herrajes} />
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center">
                              <StatusPill status={p.estadoGeneral} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </>
                ) : (
                  BLOCKS_LIST.filter(blockName => (groupedData[blockName] || []).length > 0).map((blockName) => {
                    const items = groupedData[blockName] || [];
                    return (
                      <Fragment key={blockName}>
                        {/* Block Separator Header */}
                        <tr className="bg-slate-50/80 dark:bg-slate-800/30 border-y border-slate-200/60 dark:border-slate-800/60">
                          <td colSpan={6} className="px-6 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{blockName}</span>
                              <div className="size-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                                {items.length}
                              </div>
                            </div>
                          </td>
                        </tr>
                        {items.map(p => {
                          const aluminio = p.warehouses.find(w => w.id === 'Aluminio')?.status || 'none';
                          const vidrio = p.warehouses.find(w => w.id === 'Vidrio')?.status || 'none';
                          const herrajes = p.warehouses.find(w => w.id === 'Herrajes')?.status || 'none';
                          
                          return (
                            <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                              <td className="px-6 py-5">
                                <div className="flex flex-col">
                                  <span className="text-sm font-black text-slate-700 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {p.id.startsWith('ORDER-') ? `Orden: ${p.id.split('-')[1]}` : `Factura: ${p.id}`}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{p.date}</span>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="size-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 group-hover:border-blue-200 dark:group-hover:border-blue-900/50 transition-colors">
                                      {p.clientName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-sm font-black text-slate-700 dark:text-slate-200 truncate max-w-[240px] leading-tight">{p.clientName}</span>
                                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 opacity-70 truncate">{p.vendedor}</span>
                                    </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex justify-center">
                                  <StatusCircle status={aluminio} />
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex justify-center">
                                  <StatusCircle status={vidrio} />
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex justify-center">
                                  <StatusCircle status={herrajes} />
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex items-center">
                                  <StatusPill status={p.estadoGeneral} />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
            {filteredPedidos.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center opacity-40">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Sin resultados para mostrar</p>
              </div>
            )}
          </div>
          {/* Pagination Footer Placeholder as seen in Image 2 */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Mostrando {filteredPedidos.length} de {filteredPedidos.length} pedidos
            </p>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" disabled><ChevronDown className="size-4 rotate-90" /></Button>
              <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 hover:text-white">1</Button>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-lg" disabled><ChevronDown className="size-4 -rotate-90" /></Button>
            </div>
          </div>
        </div>
      ) : deliveryTypeFilter === 'domicilio' ? (
        /* 11 Block Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 min-[2000px]:grid-cols-4 gap-4">
          {filteredPedidos.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-slate-900/40 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 transition-all">
              <div className="relative mb-6">
                <div className="absolute inset-0 scale-150 bg-blue-500/5 blur-3xl rounded-full" />
                <Truck className="size-20 text-slate-300 dark:text-slate-700 relative z-10 opacity-40 animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-[0.2em] mb-2">No se encontraron resultados</h3>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest text-center max-w-md px-6 leading-relaxed">
                No hay facturas o pedidos que coincidan con los filtros seleccionados actualmente (chofer, fecha o estatus).
              </p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchAllData(true)}
                className="mt-8 rounded-xl font-bold border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm h-10 px-6"
              >
                <RefreshCw className="size-3.5 mr-2" />
                Reintentar carga
              </Button>
            </div>
          ) : (
            BLOCKS_LIST.filter(blockName => (groupedData[blockName] || []).length > 0).map((blockName) => {
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
                          disabled={isAssigning === blockName}
                          className={cn(
                            "h-8 px-3 text-[10px] font-black border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2 transition-all hover:bg-slate-50",
                            assignedUnits[blockName] 
                              ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-none ring-0 opacity-100" 
                              : "bg-white dark:bg-slate-800 shadow-sm opacity-80"
                          )}
                        >
                          {isAssigning === blockName ? (
                            <RefreshCw className="size-3.5 animate-spin" />
                          ) : (
                            <Truck className="size-3.5" />
                          )}
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
                              onClick={() => handleAssignUnit(blockName, null)}
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
                                  onClick={() => handleAssignUnit(blockName, unid)}
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
          })
        )}
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
