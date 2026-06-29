"use client";

import { useState, useMemo, useEffect, Fragment, useRef } from "react";
import { Building2, Home, Search as SearchIcon, Truck, ChevronDown, RefreshCw, LayoutGrid, List, User, Check } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { LogisticsFilters, LogisticsDateFilters, LogisticsStatusFilters, LogisticsTypeFilters, StatusCircle, StatusPill } from "@/features/logistics/components";
import { isAfter, isBefore, startOfDay, endOfDay, parse } from "date-fns";
import { es } from "date-fns/locale";
import { closeSwal, showConfirm, showError, showLoading, showSuccess } from "@/lib/mySwal";

const BLOCKS_LIST_FALLBACK = [
  "AZTLAN 1", "AZTLAN 2", "AZTLAN 3", "AZTLAN 4",
  "CAMINO REAL 1", "CAMINO REAL 2", "CAMINO REAL 3", "CAMINO REAL 4",
  "FELIX U. GOMEZ", "GENERAL ESCOBEDO", "LA AURORA"
];

const BRANCHES = ["APODACA", "GUADALUPE", "MONTERREY", "SANTA CATARINA"];

const getLogisticsBranchId = (branch?: string) => {
  const normalized = branch?.trim().toUpperCase() || "";
  if (normalized.includes("MONTERREY")) return 1;
  if (normalized.includes("APODACA")) return 2;
  if (normalized.includes("GUADALUPE")) return 3;
  if (normalized.includes("SANTA CATARINA")) return 4;
  return 0;
};

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
  iIdLogisticsBranch?: number;
}

interface AvailableUnit {
  id: string;
  name: string;
  sucursal: string;
  iId: number;
}

interface FetchedInvoiceDetails {
  factura: string;
  almacenes: {
    almacen: string;
    materiales: {
      material: string;
      cantidad: number;
      unidadVenta: string;
    }[];
  }[];
}

interface ApiBlockStatus {
  iIdDeliveryBlock: number;
  sDeliveryBlock: string;
  sEstatus: string;
  sChofer: string | null;
  sUnidad: string | null;
  iIdDriver: number | null;
  iIdUnit: number | null;
  bAuthorized?: boolean;
  iTripNumber?: number;
  iIdLogisticsBranch?: number | null;
  sLogisticsBranch?: string | null;
  sAuthorizedInvoices?: string | null;
}

const normalizeBlockName = (value: string) => value.trim().toUpperCase();

const routeBlockPriority = (block: ApiBlockStatus) => {
  if (block.sEstatus === 'En Ruta') return 0;
  if (block.bAuthorized && block.iIdUnit && block.sUnidad) return 4;
  if (block.iIdUnit && block.sUnidad) return 3;
  if (block.sEstatus === 'Asignado') return 2;
  return 1;
};

const getBlockScopeKey = (blockName: string, branchId?: number | null) => {
  return `${normalizeBlockName(blockName)}|${branchId && branchId > 0 ? branchId : 'ALL'}`;
};

const parseInvoiceCsv = (value?: string | null) => {
  return (value || "")
    .split(",")
    .map(x => x.trim().toUpperCase())
    .filter(Boolean)
    .filter((invoice, index, array) => array.indexOf(invoice) === index);
};

const getActiveRouteBlock = (blocks: ApiBlockStatus[], blockName: string, logisticsBranchId?: number | null) => {
  const matchingBlocks = blocks.filter(b => {
    if (normalizeBlockName(b.sDeliveryBlock) !== normalizeBlockName(blockName)) return false;
    if (!logisticsBranchId || logisticsBranchId <= 0) return true;
    return b.iIdLogisticsBranch === logisticsBranchId;
  });

  return matchingBlocks
    .sort((a, b) => {
      const priorityDiff = routeBlockPriority(b) - routeBlockPriority(a);
      if (priorityDiff !== 0) return priorityDiff;
      return (b.iTripNumber || 0) - (a.iTripNumber || 0);
    })[0];
};

let cachedInvoices: RutaPedido[] | null = null;
let cachedUnidades: AvailableUnit[] | null = null;
let cachedAssignedUnits: Record<string, AvailableUnit> | null = null;
let cachedDrivers: Driver[] | null = null;
let cachedBlocks: ApiBlockStatus[] | null = null;
let cachedInvoicesByDriver: Record<string, RutaPedido[]> = {};
let lastDriverFilter: string = 'all';
let lastBranchFilter: string = 'all';

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
  const [branchFilter, setBranchFilter] = useState<string>(lastBranchFilter);
  const [drivers, setDrivers] = useState<Driver[]>(cachedDrivers || []);
  const [apiBlocks, setApiBlocks] = useState<ApiBlockStatus[]>(cachedBlocks || []);
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<FetchedInvoiceDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [authorizingBlockName, setAuthorizingBlockName] = useState<string | null>(null);
  const handleOpenDetails = async (invoiceId: string) => {
    const invoiceNum = invoiceId;
    setSelectedInvoiceId(invoiceId);
    setIsLoadingDetails(true);
    setInvoiceDetails(null);
    try {
      const res = await fetch(`/api/logistics/invoice-details/${invoiceNum}`);
      if (res.ok) {
        const data = await res.json();
        setInvoiceDetails(data);
      }
    } catch (err) {
      console.error("Error fetching invoice details:", err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const lastRequestRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

  const currentLogisticsBranchId = () => {
    return branchFilter !== 'all' ? getLogisticsBranchId(branchFilter) : 0;
  };

  const currentBlockScopeKey = (blockName: string) => {
    return getBlockScopeKey(blockName, currentLogisticsBranchId());
  };

  const getRouteBlockForDisplay = (blockName: string) => {
    return getActiveRouteBlock(apiBlocks, blockName, currentLogisticsBranchId());
  };

  const getAssignedUnitForDisplay = (blockName: string, apiBlock?: ApiBlockStatus) => {
    const displayBranchId = branchFilter === 'all'
      ? apiBlock?.iIdLogisticsBranch || 0
      : currentLogisticsBranchId();

    const scopedUnit = assignedUnits[getBlockScopeKey(blockName, displayBranchId)];
    if (scopedUnit) return scopedUnit;

    if (apiBlock?.iIdUnit && apiBlock.sUnidad) {
      return {
        id: `${apiBlock.sUnidad}-${apiBlock.iIdUnit}-${apiBlock.iTripNumber || 1}`,
        name: apiBlock.sUnidad,
        sucursal: apiBlock.sLogisticsBranch || "",
        iId: apiBlock.iIdUnit
      };
    }

    return undefined;
  };

  useEffect(() => {
    cachedAssignedUnits = assignedUnits;
  }, [assignedUnits]);

  const isInitialMount = useRef(true);

  useEffect(() => {
    lastDriverFilter = driverFilter;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Al montar por primera vez, forzar un refresco silencioso en segundo plano
      // para traer los catálogos y asignaciones más recientes de la BD
      fetchAllData(true, true);
    } else {
      fetchAllData(false, !!cachedInvoicesByDriver[driverFilter]);
    }
  }, [driverFilter]);

  useEffect(() => {
    lastBranchFilter = branchFilter;
  }, [branchFilter]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAllData(true, true);
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAllData(true, true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [driverFilter]);

  const handleAssignUnit = async (blockName: string, unit: AvailableUnit | null) => {
    const logisticsBranchId = currentLogisticsBranchId();
    const blockScopeKey = currentBlockScopeKey(blockName);
    const apiBlock = getActiveRouteBlock(apiBlocks, blockName, logisticsBranchId);

    if (!apiBlock) {
      alert(`No se pudo encontrar el ID del bloque "${blockName}" en el catálogo.`);
      return;
    }

    const originalAssignments = { ...assignedUnits };

    setAssignedUnits(prev => {
      const next = { ...prev };
      if (unit) {
        next[blockScopeKey] = unit;
      } else {
        delete next[blockScopeKey];
      }
      return next;
    });

    try {
      setIsAssigning(blockScopeKey);
      const response = await fetch('/api/logistics/assign-unit-to-block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iIdDeliveryBlock: Number(apiBlock.iIdDeliveryBlock),
          iIdUnit: unit ? Number(unit.iId) : 0,
          iIdLogisticsBranch: logisticsBranchId || null
        })
      });

      if (!response.ok) throw new Error("Error en la asignación");

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
  const getVisibleBlockInvoiceNums = (blockName: string) => {
    return (groupedData[blockName] || [])
      .filter(p => !p.id.startsWith('ORDER-'))
      .map(p => p.id.trim().toUpperCase())
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index);
  };

  const isBlockAuthorizedForCurrentTrip = (apiBlock: ApiBlockStatus | undefined) => {
    return !!apiBlock?.bAuthorized && apiBlock.sEstatus !== 'En Ruta';
  };

  const executeAuthorizeBlock = async (blockName: string, authorize: boolean) => {
    if (branchFilter === 'all') {
      await showError({
        title: "Selecciona una sucursal",
        text: "Para autorizar debes filtrar por una sucursal específica.",
        timer: 2600
      });
      return;
    }
    const logisticsBranchId = branchFilter !== 'all' ? getLogisticsBranchId(branchFilter) : 0;
    const blockScopeKey = currentBlockScopeKey(blockName);
    const apiBlock = getActiveRouteBlock(apiBlocks, blockName, logisticsBranchId);

    if (!apiBlock) {
      await showError({
        title: "Bloque no encontrado",
        text: `No se pudo encontrar el ID del bloque "${blockName}" en el catálogo.`
      });
      return;
    }

    try {
      setAuthorizingBlockName(blockScopeKey);
      setIsRefreshing(true);

      showLoading({
        title: authorize ? "Sincronizando ruta con Samsara" : "Regresando bloque...",
        html: authorize
          ? `Estamos creando la ruta del bloque <b>${blockName}</b>.<br/>Esto puede tardar unos segundos.`
          : `Estamos regresando las facturas del bloque <b>${blockName}</b>.`
      });

      const useInvoiceAuthorization = branchFilter !== 'all';
      const authorizedInvoiceNums = parseInvoiceCsv(apiBlock.sAuthorizedInvoices);
      const visibleInvoiceNums = getVisibleBlockInvoiceNums(blockName);
      const invoiceNums = useInvoiceAuthorization
        ? authorize
          ? visibleInvoiceNums
          : (authorizedInvoiceNums.length > 0 ? authorizedInvoiceNums : visibleInvoiceNums)
        : [];

      if (authorize && branchFilter === 'all') {
        closeSwal();
        await showError({
          title: "Selecciona una sucursal",
          text: "Para autorizar debes filtrar por una sucursal específica.",
          timer: 2600
        });
        return;
      }

      if (useInvoiceAuthorization && invoiceNums.length === 0) {
        closeSwal();
        await showError({
          title: "Sin facturas visibles",
          text: `No hay facturas visibles del bloque ${blockName} para autorizar en la sucursal seleccionada.`
        });
        return;
      }

      const response = await fetch(
        useInvoiceAuthorization
          ? '/api/logistics/authorize-block-invoices-with-samsara-route'
          : authorize
            ? '/api/logistics/authorize-block-with-samsara-route'
            : '/api/logistics/authorize-block',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            useInvoiceAuthorization
              ? {
                iIdDeliveryBlock: Number(apiBlock.iIdDeliveryBlock),
                iIdLogisticsBranch: logisticsBranchId,
                bAuthorize: authorize,
                invoiceNums
              }
              : {
                iIdDeliveryBlock: Number(apiBlock.iIdDeliveryBlock),
                bAuthorize: authorize
              }
          )
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || errJson.message || "Error al cambiar la autorización del bloque");
      }

      await showSuccess({
        title: authorize ? "Ruta sincronizada" : "Bloque regresado",
        html: authorize
          ? `El bloque <b>${blockName}</b> fue autorizado y la ruta quedo lista en Samsara.`
          : `Las facturas del bloque <b>${blockName}</b> regresaron correctamente.`,
        timer: 1800
      });

      await fetchAllData(true, true);
    } catch (err: any) {
      console.error("Error authorizing block:", err);
      closeSwal();
      await showError({
        title: authorize ? "No se pudo autorizar el bloque" : "No se pudo regresar el bloque",
        text: err.message || "Hubo un error al cambiar la autorización del bloque."
      });
    } finally {
      setIsRefreshing(false);
      setAuthorizingBlockName(null);
    }
  };

  const handleAuthorizeBlock = async (blockName: string, authorize: boolean) => {
    const confirmed = await showConfirm({
      icon: authorize ? "question" : "warning",
      iconColor: authorize ? "#60a5fa" : "#f59e0b",
      title: authorize ? "¿Autorizar bloque?" : "¿Regresar bloque?",
      html: authorize
        ? `Se creara la ruta en Samsara y se autorizaran solo las facturas visibles de la sucursal seleccionada para el bloque <b>${blockName}</b>.`
        : `Se regresaran las facturas del bloque <b>${blockName}</b> para incluir nuevas facturas y volver a autorizar.`,
      confirmButtonText: authorize ? "Si, autorizar" : "Si, regresar",
      confirmButtonColor: authorize ? "#2563eb" : "#f59e0b"
    });

    if (confirmed) {
      await executeAuthorizeBlock(blockName, authorize);
    }
  };

  const fetchAllData = async (forceRefresh = false, silent = false) => {
    if (isFetchingRef.current) {
      console.log("Fetch en progreso, omitiendo petición concurrente.");
      return;
    }
    isFetchingRef.current = true;
    const requestId = ++lastRequestRef.current;

    if (!forceRefresh && !silent && cachedInvoicesByDriver[driverFilter]) {
      setInvoices(cachedInvoicesByDriver[driverFilter]);
      setIsLoading(false);
      isFetchingRef.current = false;
      return;
    }

    try {
      setIsRefreshing(true);
      if (!silent) setIsLoading(true);
      setError(null);

      const catalogsNeeded = forceRefresh || !cachedUnidades || !cachedDrivers || !cachedBlocks;

      let routesUrl = '/api/routes';
      if (driverFilter && driverFilter !== 'all') {
        routesUrl += `?iIdDriver=${driverFilter}`;
      }

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

      if (catalogsResults) {
        const [blocksRes, unitsRes, driversRes] = catalogsResults;

        if (blocksRes.ok) {
          const blocksData: ApiBlockStatus[] = await blocksRes.json();
          setApiBlocks(blocksData);
          cachedBlocks = blocksData;

          const initialAssignments: Record<string, AvailableUnit> = {};
          blocksData.forEach(b => {
            if (b.sUnidad && b.iIdUnit && b.sEstatus !== 'En Ruta') {
              const blockScopeKey = getBlockScopeKey(b.sDeliveryBlock, b.iIdLogisticsBranch);
              initialAssignments[blockScopeKey] = {
                id: `${b.sUnidad}-${b.iIdUnit}-${b.iTripNumber || 1}`,
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
            .filter((u: any) => u.sEstatus !== "Asignado" && u.sEstatus !== "Mantenimiento")
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

      if (requestId !== lastRequestRef.current) return;

      if (!routesResponse.ok) throw new Error('No se pudo conectar con el servidor de rutas');
      const data: ApiRutaInvoice[] = await routesResponse.json();

      const groupedMap = new Map<string, RutaPedido & { block: string }>();

      data.forEach((row) => {
        const isFactura = row.factura && row.factura.trim() !== "";
        const displayId = isFactura ? row.factura : `ORDER-${row.orderNum}`;
        const rawSucursal = row.sucursal?.trim().toUpperCase() || "";
        const mappedSucursal = rawSucursal === "SIN SUCURSAL" ? "SANTA CATARINA" : rawSucursal;
        const logisticsBranchId = row.iIdLogisticsBranch ?? getLogisticsBranchId(mappedSucursal);
        const groupKey = isFactura
          ? `${displayId}|${logisticsBranchId || mappedSucursal || 'SIN_SUCURSAL'}`
          : displayId;

        if (!groupedMap.has(groupKey)) {
          const type: RutaInvoiceType = row.tipoFactura === "ANTICIPADA" ? "anticipada" : "normal";

          let status: RutaStatus = 'pending';
          const rawStatus = (row.estatusEmbarque || "").toLowerCase();
          if (rawStatus === 'listo') status = 'ready';
          else if (rawStatus === 'en proceso' || rawStatus === 'embarcado') status = 'in-progress';
          else status = 'pending';

          groupedMap.set(groupKey, {
            id: displayId,
            clientName: row.cliente,
            date: isFactura ? row.fecha : row.orderDate,
            warehouses: [],
            vendedor: row.vendedor,
            deliveryType: (row.metodo === 'RES' || (row.metodo && row.metodo.includes('M01'))) ? 'sucursal' : 'domicilio',
            block: (row.bloque || "GENERAL").trim().toUpperCase(),
            estadoGeneral: status,
            type: type,
            completedDeliveries: type === 'anticipada' ? (row.montoAnticipado > 0 ? 1 : 0) : undefined,
            hasGlassCut: false,
            montoTotal: row.monto_Factura,
            orderNum: row.orderNum,
            sucursal: mappedSucursal,
            logisticsBranchId
          });
        }

        const current = groupedMap.get(groupKey)!;

        let warehouseName = (row.almacen || "").trim().toUpperCase();
        let warehouseId: string | null = null;

        if (warehouseName.includes("ALUMINIO")) warehouseId = "Aluminio";
        else if (warehouseName.includes("VIDRIO")) warehouseId = "Vidrio";
        else if (warehouseName.includes("HERRAJE")) warehouseId = "Herrajes";

        if (warehouseId) {
          let itemStatus: RutaStatus = 'pending';
          const rawStatus = (row.estatusEmbarque || "").toLowerCase();
          if (rawStatus === 'listo') itemStatus = 'ready';
          else if (rawStatus === 'en proceso' || rawStatus === 'embarcado') itemStatus = 'in-progress';
          else itemStatus = 'pending';
          if (!current.warehouses.some(w => w.id === warehouseId)) {
            current.warehouses.push({
              id: warehouseId,
              status: itemStatus
            });
          } else {
            const existing = current.warehouses.find(w => w.id === warehouseId)!;
            if (itemStatus === 'pending') existing.status = 'pending';
            else if (itemStatus === 'in-progress' && existing.status === 'ready') existing.status = 'in-progress';
          }
          if (warehouseId === "Vidrio" && row.corte === 1) {
            current.hasGlassCut = true;
          }
        }
      });

      const allData = Array.from(groupedMap.values());

      cachedInvoicesByDriver[driverFilter] = allData;
      cachedInvoices = allData;
      setInvoices(allData);
      setError(null);
    } catch (err) {
      console.error("Error fetching routes:", err);
      setError("Error al cargar la información de rutas dinámica");
    } finally {
      isFetchingRef.current = false;
      setIsRefreshing(false);
      if (requestId === lastRequestRef.current) {
        setIsLoading(false);
      }
    }
  };

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
      prev.includes(status) ? [] : [status]
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
      if (p.deliveryType !== deliveryTypeFilter) return false;

      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        const matchesSearch =
          p.id.toLowerCase().includes(lowerQuery) ||
          p.clientName.toLowerCase().includes(lowerQuery) ||
          (p.block && p.block.toLowerCase().includes(lowerQuery)) ||
          (p.orderNum && p.orderNum.toString().includes(lowerQuery));
        if (!matchesSearch) return false;
      }

      if (p.type !== invoiceTypeFilter) return false;

      if (statusFilters.length > 0 && !p.warehouses.some(w => statusFilters.includes(w.status))) {
        return false;
      }

      if (fromDate) {
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

      if (branchFilter !== 'all') {
        if (!p.sucursal || p.sucursal.toUpperCase() !== branchFilter.toUpperCase()) return false;
      }

      return true;
    });

    if (deliveryTypeFilter === "sucursal") {
      return filtered.slice(0, 15);
    }

    return filtered;
  }, [invoices, deliveryTypeFilter, searchQuery, fromDate, statusFilters, invoiceTypeFilter, branchFilter]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors shrink-0">
          Gestion de rutas
        </h1>
        <div className="flex flex-row items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2 w-auto md:px-3 md:min-w-[180px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-all hover:bg-white dark:hover:bg-slate-900 shadow-sm flex items-center justify-center gap-1.5 md:justify-between group shrink-0"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <Building2 className="size-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                  <span className="truncate inline md:hidden">
                    SUCURSAL
                  </span>
                  <span className="truncate max-w-[200px] hidden md:inline">
                    {branchFilter === 'all' ? 'TODAS LAS SUCURSALES' : branchFilter}
                  </span>
                </div>
                <ChevronDown className="size-3 text-slate-400 shrink-0 ml-0.5 md:ml-2" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[240px] p-2 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl" align="end">
              <div className="flex flex-col gap-1">
                <p className="px-3 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                  Filtrar por Sucursal
                </p>
                <button
                  onClick={() => setBranchFilter('all')}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2",
                    branchFilter === 'all'
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  )}
                >
                  <div className={cn("size-2 rounded-full", branchFilter === 'all' ? "bg-white animate-pulse" : "bg-blue-500")} />
                  TODAS LAS SUCURSALES
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                <div className="flex flex-col gap-0.5">
                  {BRANCHES.map(branch => (
                    <button
                      key={branch}
                      onClick={() => setBranchFilter(branch)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group",
                        branchFilter === branch
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      )}
                    >
                      <div className={cn(
                        "size-6 rounded-lg flex items-center justify-center text-[10px] shrink-0",
                        branchFilter === branch
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600"
                      )}>
                        {branch.substring(0, 2)}
                      </div>
                      <span className="truncate">{branch}</span>
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-2 w-auto md:px-3 md:min-w-[180px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 transition-all hover:bg-white dark:hover:bg-slate-900 shadow-sm flex items-center justify-center gap-1.5 md:justify-between group shrink-0"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <User className="size-3.5 text-slate-400 group-hover:text-blue-500 transition-colors shrink-0" />
                  <span className="truncate inline md:hidden">
                    CHOFER
                  </span>
                  <span className="truncate max-w-[200px] hidden md:inline">
                    {driverFilter === 'all' ? 'TODOS LOS CHOFERES' : drivers.find(d => d.id === driverFilter)?.name || 'TODOS LOS CHOFERES'}
                  </span>
                </div>
                <ChevronDown className="size-3 text-slate-400 shrink-0 ml-0.5 md:ml-2" />
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

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block"></div>
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
            className="h-9 w-9 p-0 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900 transition-all shadow-sm flex items-center justify-center shrink-0 cursor-pointer"
          >
            <RefreshCw className={cn("size-3.5", isRefreshing && "animate-spin text-blue-500")} />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 md:gap-1.5 w-full bg-white/50 dark:bg-slate-900/40 py-2 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-row items-center gap-2 w-full md:w-auto md:flex-1">
          <div className="relative group flex-1 md:w-[320px] md:flex-initial">
            <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-500 transition-colors pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por factura, cliente u orden"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 h-9 text-xs focus-visible:ring-slate-500/20 shadow-sm transition-all placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>
        <LogisticsStatusFilters
          activeStatusFilters={statusFilters as any}
          onToggleStatusFilter={toggleStatusFilter as any}
          compact={true}
        />

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>
        <LogisticsTypeFilters
          invoiceTypeFilter={invoiceTypeFilter as any}
          onInvoiceTypeChange={setInvoiceTypeFilter as any}
        />

        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden md:block"></div>
        <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 h-9 shrink-0 w-full md:w-auto">
          {[
            { id: 'domicilio', label: 'Domicilio', Icon: Home },
            { id: 'sucursal', label: 'Sucursal', Icon: Building2 },
          ].map((btn) => (
            <button
              key={btn.id}
              onClick={() => setDeliveryTypeFilter(btn.id as any)}
              className={cn(
                "flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex-1 md:flex-initial",
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
                    <tr className="bg-slate-100/90 dark:bg-slate-800/70 border-y border-slate-300/80 dark:border-slate-700/80">
                      <td colSpan={6} className="px-6 py-3.5">
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
                        <tr key={`${p.id}-${p.logisticsBranchId || p.sucursal}`} onClick={() => handleOpenDetails(p.id)} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer">
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
                    const blockScopeKey = currentBlockScopeKey(blockName);
                    const apiBlock = getRouteBlockForDisplay(blockName);
                    const assignedUnit = getAssignedUnitForDisplay(blockName, apiBlock);
                    const isAllBranches = branchFilter === 'all';
                    const isAuthorized = !isAllBranches && isBlockAuthorizedForCurrentTrip(apiBlock);
                    const canAuthorize = !!assignedUnit && items.some(item => item.estadoGeneral === 'ready' && !item.id.startsWith('ORDER-'));
                    const isProcessing = authorizingBlockName === blockScopeKey;
                    return (
                      <Fragment key={blockName}>
                        <tr className="bg-slate-100/90 dark:bg-slate-800/70 border-y border-slate-300/80 dark:border-slate-700/80">
                          <td colSpan={6} className="px-6 py-3.5">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest">{blockName}</span>
                                <div className="size-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
                                  {items.length}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  variant={
                                    isAuthorized && canAuthorize
                                      ? "logistics-warning"
                                      : canAuthorize
                                        ? "logistics-success"
                                        : "logistics-action"
                                  }
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAuthorizeBlock(blockName, !isAuthorized);
                                  }}
                                  disabled={!canAuthorize || isProcessing}
                                  size="sm"
                                  className="h-8 px-3 text-[10px] font-black rounded-xl flex items-center gap-1.5 uppercase tracking-widest"
                                >
                                  {isProcessing ? (
                                    <RefreshCw className="size-3.5 animate-spin" />
                                  ) : (
                                    <Check className="size-3.5 transition-colors" />
                                  )}
                                  {isProcessing
                                    ? "Procesando..."
                                    : isAuthorized && canAuthorize
                                      ? "Regresar"
                                      : "Autorizar"}
                                </Button>

                                <Popover
                                  open={openPopoverId === `${blockScopeKey}-table`}
                                  onOpenChange={(open) => setOpenPopoverId(open ? `${blockScopeKey}-table` : null)}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      disabled={isAssigning === blockScopeKey || isAllBranches}
                                      className={cn(
                                        "h-8 px-3 text-[10px] font-black border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2 transition-all hover:bg-slate-50",
                                        assignedUnit
                                          ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-none ring-0 opacity-100"
                                          : "bg-white dark:bg-slate-800 shadow-sm opacity-80"
                                      )}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {isAssigning === blockScopeKey ? (
                                        <RefreshCw className="size-3.5 animate-spin" />
                                      ) : (
                                        <Truck className="size-3.5" />
                                      )}
                                      <span className="uppercase tracking-widest truncate max-w-[100px]">
                                        {assignedUnit ? assignedUnit.name : "Unidad"}
                                      </span>
                                      <ChevronDown className="size-3 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-48 p-2 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl" align="end" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex flex-col gap-1">
                                      <p className="px-2 py-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 mb-1">
                                        Seleccionar Unidad
                                      </p>
                                      <div className="grid grid-cols-1 gap-0.5 max-h-[240px] overflow-y-auto pr-1 select-none no-scrollbar">
                                        <button
                                          onClick={() => handleAssignUnit(blockName, null)}
                                          className={cn(
                                            "w-full text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                                            !assignedUnit
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
                                                assignedUnit?.id === unid.id
                                                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                                              )}
                                            >
                                              <span>{unid.name}</span>
                                              <span className={cn(
                                                "text-[8px] px-1.5 py-0.5 rounded-md truncate max-w-[80px]",
                                                assignedUnit?.id === unid.id
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
                            </div>
                          </td>
                        </tr>
                        {items.map(p => {
                          const aluminio = p.warehouses.find(w => w.id === 'Aluminio')?.status || 'none';
                          const vidrio = p.warehouses.find(w => w.id === 'Vidrio')?.status || 'none';
                          const herrajes = p.warehouses.find(w => w.id === 'Herrajes')?.status || 'none';

                          return (
                            <tr key={`${p.id}-${p.logisticsBranchId || p.sucursal}`} onClick={() => handleOpenDetails(p.id)} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer">
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
                Reintentar carga
              </Button>
            </div>
          ) : (
            BLOCKS_LIST.filter(blockName => (groupedData[blockName] || []).length > 0).map((blockName) => {
              const items = groupedData[blockName] || [];
              const blockScopeKey = currentBlockScopeKey(blockName);
              const apiBlock = getRouteBlockForDisplay(blockName);
              const assignedUnit = getAssignedUnitForDisplay(blockName, apiBlock);
              const isAllBranches = branchFilter === 'all';
              const isAuthorized = !isAllBranches && isBlockAuthorizedForCurrentTrip(apiBlock);
              const canAuthorize = !!assignedUnit && items.some(item => item.estadoGeneral === 'ready' && !item.id.startsWith('ORDER-'));
              const isProcessing = authorizingBlockName === blockScopeKey;

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

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant={
                            isAuthorized && canAuthorize
                              ? "logistics-warning"
                              : canAuthorize
                                ? "logistics-success"
                                : "logistics-action"
                          }
                          onClick={() => handleAuthorizeBlock(blockName, !isAuthorized)}
                          disabled={!canAuthorize || isProcessing}
                          size="sm"
                          className="h-8 px-3 text-[10px] font-black rounded-xl flex items-center gap-1.5 uppercase tracking-widest"
                        >
                          {isProcessing ? (
                            <RefreshCw className="size-3.5 animate-spin" />
                          ) : (
                            <Check className="size-3.5 transition-colors" />
                          )}
                          {isProcessing
                            ? "Procesando..."
                            : isAuthorized && canAuthorize
                              ? "Regresar"
                              : "Autorizar"}
                        </Button>

                        <Popover
                          open={openPopoverId === blockScopeKey}
                          onOpenChange={(open) => setOpenPopoverId(open ? blockScopeKey : null)}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isAssigning === blockScopeKey || isAllBranches}
                              className={cn(
                                "h-8 px-3 text-[10px] font-black border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2 transition-all hover:bg-slate-50",
                                assignedUnit
                                  ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-none ring-0 opacity-100"
                                  : "bg-white dark:bg-slate-800 shadow-sm opacity-80"
                              )}
                            >
                              {isAssigning === blockScopeKey ? (
                                <RefreshCw className="size-3.5 animate-spin" />
                              ) : (
                                <Truck className="size-3.5" />
                              )}
                              <span className="uppercase tracking-widest truncate max-w-[100px]">
                                {assignedUnit ? assignedUnit.name : "Unidad"}
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
                                    !assignedUnit
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
                                        assignedUnit?.id === unid.id
                                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                                      )}
                                    >
                                      <span>{unid.name}</span>
                                      <span className={cn(
                                        "text-[8px] px-1.5 py-0.5 rounded-md truncate max-w-[80px]",
                                        assignedUnit?.id === unid.id
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
                          <div key={`${p.id}-${p.logisticsBranchId || p.sucursal}`} className="shrink-0">
                            <RutaOrderCard pedido={p} activeStatusFilters={statusFilters} onClick={() => handleOpenDetails(p.id)} />
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
                <RutaOrderCard key={`${p.id}-${p.logisticsBranchId || p.sucursal}`} pedido={p} activeStatusFilters={statusFilters} onClick={() => handleOpenDetails(p.id)} />
              ))
            ) : (
              <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center opacity-50">
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">No hay pedidos pendientes en sucursal</p>
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={!!selectedInvoiceId} onOpenChange={(open) => !open && setSelectedInvoiceId(null)}>
        <DialogContent className="w-full h-full sm:h-auto sm:max-w-[500px] p-0 overflow-y-auto sm:overflow-hidden bg-white dark:bg-slate-900 border-none shadow-2xl rounded-none sm:rounded-3xl">
          <div className="p-4 sm:p-6 space-y-6">
            <div className="text-center space-y-2 px-2">
              <DialogTitle className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
                Detalles de Factura
              </DialogTitle>
              <p className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                {selectedInvoiceId?.startsWith('ORDER-') ? `Orden: ${selectedInvoiceId.split('-')[1]}` : `Factura: ${selectedInvoiceId}`}
              </p>
            </div>

            <div className="space-y-4 max-h-[60vh] sm:max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {isLoadingDetails ? (
                <div className="flex flex-col justify-center items-center py-20 gap-3">
                  <RefreshCw className="size-8 text-blue-500 animate-spin" />
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Cargando detalles...</p>
                </div>
              ) : invoiceDetails && invoiceDetails.almacenes?.length > 0 ? (
                invoiceDetails.almacenes.map((group, gIdx) => (
                  <div key={gIdx} className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                        Almacén: {group.almacen}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 capitalize">
                        {group.materiales.length} productos
                      </span>
                    </div>
                    <table className="w-full text-left">
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {group.materiales.map((mat, mIdx) => (
                          <tr key={mIdx}>
                            <td className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                              {mat.material}
                            </td>
                            <td className="px-4 py-3 text-sm font-black text-slate-900 dark:text-slate-100 text-right">
                              {mat.cantidad} {mat.unidadVenta}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-500 font-bold uppercase text-xs">
                  No se encontraron detalles para esta factura
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                className="w-full h-12 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 shadow-md"
                onClick={() => setSelectedInvoiceId(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
