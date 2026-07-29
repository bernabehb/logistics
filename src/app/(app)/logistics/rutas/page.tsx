"use client";

import { useState, useMemo, useEffect, Fragment, useRef } from "react";
import { createPortal } from "react-dom";
import { Building2, Home, Search as SearchIcon, Truck, ChevronDown, RefreshCw, LayoutGrid, List, User, Check, MapPin, Printer, History, Clock3 } from "lucide-react";
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
import { closeSwal, getSwalTheme, MySwal, showConfirm, showError, showLoading, showSuccess } from "@/lib/mySwal";

const BLOCKS_LIST_FALLBACK = [
  "AZTLAN 1", "AZTLAN 2", "AZTLAN 3", "AZTLAN 4",
  "CAMINO REAL 1", "CAMINO REAL 2", "CAMINO REAL 3", "CAMINO REAL 4",
  "FELIX U. GOMEZ", "GENERAL ESCOBEDO", "LA AURORA"
];

const BRANCHES = ["APODACA", "GUADALUPE", "MONTERREY", "SANTA CATARINA"];

interface RouteTicketLine {
  description: string;
  quantity: number;
  unit: string;
}

interface RouteTicketWarehouse {
  warehouse: string;
  lines: RouteTicketLine[];
}

interface RouteTicket {
  orderNum: number;
  clientName: string;
  vendor: string;
  dateLabel: string;
  warehouses: RouteTicketWarehouse[];
  totalPieces: number;
}

const CODE39_PATTERNS: Record<string, string> = {
  "0": "nnnwwnwnn",
  "1": "wnnwnnnnw",
  "2": "nnwwnnnnw",
  "3": "wnwwnnnnn",
  "4": "nnnwwnnnw",
  "5": "wnnwwnnnn",
  "6": "nnwwwnnnn",
  "7": "nnnwnnwnw",
  "8": "wnnwnnwnn",
  "9": "nnwwnnwnn",
  "*": "nwnnwnwnn"
};

const formatTicketDate = (date = new Date()) => {
  const day = date.getDate().toString().padStart(2, "0");
  const month = date.toLocaleString("es-MX", { month: "short" }).replace(".", "").toUpperCase();
  const year = date.getFullYear().toString().slice(-2);
  const time = date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: true }).toLowerCase();
  return `${day}/${month}/${year} - ${time}`;
};

const formatTicketQuantity = (value: number) =>
  value.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Code39Barcode({ value }: { value: string }) {
  const normalizedValue = value.replace(/[^0-9]/g, "");
  const encodedValue = `*${normalizedValue}*`;
  const narrow = 1;
  const wide = 3;
  const height = 40;
  const bars: { x: number; width: number }[] = [];
  let x = 0;

  for (const char of encodedValue) {
    const pattern = CODE39_PATTERNS[char] || CODE39_PATTERNS["0"];

    pattern.split("").forEach((part, index) => {
      const width = part === "w" ? wide : narrow;
      if (index % 2 === 0) {
        bars.push({ x, width });
      }
      x += width;
    });

    x += narrow;
  }

  return (
    <svg className="ticket-barcode" viewBox={`0 0 ${x} 56`} role="img" aria-label={`Codigo de barras ${normalizedValue}`}>
      {bars.map((bar, index) => (
        <rect key={index} x={bar.x} y="0" width={bar.width} height={height} fill="currentColor" />
      ))}
      <text x={x / 2} y="53" textAnchor="middle" fontSize="8" fontFamily="Arial, sans-serif" fill="currentColor">
        {normalizedValue}
      </text>
    </svg>
  );
}

function TicketPages({ tickets }: { tickets: RouteTicket[] }) {
  return (
    <>
      {tickets.map((ticket) => (
        <section key={ticket.orderNum} className="route-ticket-page">
          <div className="ticket-header">
            <div className="ticket-company">COMPERS</div>
            <div>Fecha: {ticket.dateLabel}</div>
            <div>OV #{ticket.orderNum}</div>
            <div>Cliente: {ticket.clientName}</div>
            <div>Vendedor: {ticket.vendor}</div>
            <div className="ticket-route-title">RUTA</div>
          </div>

          {ticket.warehouses.map((warehouse) => (
            <div key={`${ticket.orderNum}-${warehouse.warehouse}`} className="ticket-warehouse">
              <div className="ticket-warehouse-title">**ALMACEN {warehouse.warehouse}**</div>
              <div className="ticket-table-header">
                <span>Descripcion</span>
                <span>Cant</span>
              </div>
              {warehouse.lines.map((line, index) => (
                <div key={`${line.description}-${line.unit}-${index}`} className="ticket-row">
                  <span>{line.description}</span>
                  <strong>{formatTicketQuantity(line.quantity)} {line.unit}</strong>
                </div>
              ))}
            </div>
          ))}

          <div className="ticket-total">
            <span>TOTAL DE PIEZAS</span>
            <strong>{formatTicketQuantity(ticket.totalPieces)} PZ</strong>
          </div>

          <div className="ticket-barcode-wrap">
            <Code39Barcode value={String(ticket.orderNum)} />
          </div>
        </section>
      ))}
    </>
  );
}

function RouteTicketsDialog({
  tickets,
  open,
  onOpenChange
}: {
  tickets: RouteTicket[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [currentTicketIndex, setCurrentTicketIndex] = useState(0);
  const [printedTickets, setPrintedTickets] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (open) {
      setCurrentTicketIndex(0);
      setPrintedTickets(new Set());
    }
  }, [open, tickets.length]);

  const currentTicket = tickets[currentTicketIndex];
  const currentTicketList = currentTicket ? [currentTicket] : [];
  const hasPrevious = currentTicketIndex > 0;
  const hasNext = currentTicketIndex < tickets.length - 1;

  const handlePrevious = () => {
    setCurrentTicketIndex((current) => Math.max(current - 1, 0));
  };

  const handleNext = () => {
    setCurrentTicketIndex((current) => Math.min(current + 1, tickets.length - 1));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          className="max-w-[420px] max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl"
        >
          <DialogHeader className="route-ticket-screen-controls">
            <DialogTitle className="text-base font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">
              Tickets de salida
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {tickets.map((_, idx) => {
                const isPrinted = printedTickets.has(idx);
                const isCurrent = idx === currentTicketIndex;
                let circleClass = "";
                if (isCurrent && isPrinted) {
                  circleClass = "border-slate-900 bg-green-500 text-white dark:border-slate-100";
                } else if (isPrinted) {
                  circleClass = "border-green-500 bg-green-500 text-white";
                } else if (isCurrent) {
                  circleClass = "border-slate-800 text-slate-800 dark:border-slate-200 dark:text-slate-200";
                } else {
                  circleClass = "border-slate-300 text-slate-400 dark:border-slate-700 dark:text-slate-500";
                }

                return (
                  <div
                    key={idx}
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold transition-colors",
                      circleClass
                    )}
                  >
                    {isPrinted ? <Check className="size-3.5 stroke-[3]" /> : idx + 1}
                  </div>
                );
              })}
            </div>
            <DialogDescription className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Ticket {tickets.length > 0 ? currentTicketIndex + 1 : 0} de {tickets.length}. Imprime uno por uno.
            </DialogDescription>
          </DialogHeader>

          <div className="route-ticket-preview-root mx-auto flex flex-col items-center gap-4 py-2">
            <TicketPages tickets={currentTicketList} />
          </div>

          <DialogFooter className="route-ticket-screen-controls flex-col gap-2 sm:flex-col sm:gap-2">
            <div className="grid w-full grid-cols-2 gap-2">
              <Button variant="outline" onClick={handlePrevious} disabled={!hasPrevious} className="h-10 rounded-xl text-xs font-black uppercase tracking-widest">
                Anterior
              </Button>
              <Button variant="outline" onClick={handleNext} disabled={!hasNext} className="h-10 rounded-xl text-xs font-black uppercase tracking-widest">
                Siguiente
              </Button>
            </div>
            <Button onClick={() => {
              window.print();
              setPrintedTickets((prev) => {
                const next = new Set(prev);
                next.add(currentTicketIndex);
                return next;
              });
            }} disabled={!currentTicket} className="w-full h-10 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950">
              <Printer className="size-4 mr-2" />
              Imprimir ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {open && currentTicket && typeof document !== "undefined"
        ? createPortal(
          <div className="route-ticket-print-root" aria-hidden="true">
            <TicketPages tickets={currentTicketList} />
          </div>,
          document.body
        )
        : null}
    </>
  );
}
const getLogisticsBranchId = (branch?: string) => {
  const normalized = branch?.trim().toUpperCase() || "";
  if (normalized.includes("MONTERREY")) return 1;
  if (normalized.includes("APODACA")) return 2;
  if (normalized.includes("GUADALUPE")) return 3;
  if (normalized.includes("SANTA CATARINA")) return 4;
  return 0;
};
const readApiErrorMessage = async (response: Response, fallback: string) => {
  try {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const errJson = await response.json();
      const possibleMessages = [
        errJson?.error,
        errJson?.message,
        errJson?.detail,
        errJson?.title
      ].filter(Boolean);

      if (possibleMessages.length > 0) {
        return String(possibleMessages[0]);
      }

      if (errJson && typeof errJson === "object") {
        return JSON.stringify(errJson);
      }
    }

    const text = await response.text();
    if (text) return text;
  } catch {
    // Keep the original fallback if the response body cannot be parsed.
  }

  return fallback;
};

const isAddressValidationError = (message: string) => {
  const normalized = message
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return normalized.includes("google maps")
    || normalized.includes("validar una direccion")
    || normalized.includes("direccion incorrecta")
    || normalized.includes("no se pudo validar una direccion");
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
  dDateRouteAuthorized?: string | null;
  isPreviousPending?: boolean | number | string;
  IsPreviousPending?: boolean | number | string;
}

interface AvailableUnit {
  id: string;
  name: string;
  sucursal: string;
  iId: number;
  capacityKg?: number | null;
}

interface FetchedInvoiceDetails {
  factura: string;
  almacenes: {
    almacen: string;
    materiales: {
      material: string;
      cantidad: number;
      unidadVenta: string;
      corte?: number;
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

const DEFAULT_PREVIOUS_PENDING_DAYS = 7;
const getRoutesCacheKey = (driverFilter: string, includePreviousPending: boolean) =>
  `${driverFilter || 'all'}|previous:${includePreviousPending ? '1' : '0'}`;

const isTruthyPreviousPending = (value: unknown) => {
  if (value === true || value === 1) return true;
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true';
};

const getTodayDateKey = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isBeforeToday = (dateValue?: string | null) => {
  if (!dateValue) return false;
  const dateKey = dateValue.slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) && dateKey < getTodayDateKey();
};

let cachedInvoices: RutaPedido[] | null = null;
let cachedUnidades: AvailableUnit[] | null = null;
let cachedUnitCatalog: AvailableUnit[] | null = null;
let cachedAssignedUnits: Record<string, AvailableUnit> | null = null;
let cachedDrivers: Driver[] | null = null;
let cachedBlocks: ApiBlockStatus[] | null = null;
const cachedInvoicesByDriver: Record<string, RutaPedido[]> = {};
const cachedRouteRowsByDriver: Record<string, ApiRutaInvoice[]> = {};
let lastDriverFilter: string = 'all';
let lastBranchFilter: string = 'all';
let lastIncludePreviousPending = false;
let lastViewMode: 'cards' | 'table' = 'cards';

export default function RutasPage() {
  const initialRoutesCacheKey = getRoutesCacheKey(lastDriverFilter, lastIncludePreviousPending);
  const [invoices, setInvoices] = useState<RutaPedido[]>(cachedInvoicesByDriver[initialRoutesCacheKey] || []);
  const [routeTicketRows, setRouteTicketRows] = useState<ApiRutaInvoice[]>(cachedRouteRowsByDriver[initialRoutesCacheKey] || []);
  const [unidadesDisponibles, setUnidadesDisponibles] = useState<AvailableUnit[]>(cachedUnidades || []);
  const [unitCatalog, setUnitCatalog] = useState<AvailableUnit[]>(cachedUnitCatalog || cachedUnidades || []);
  const [isLoading, setIsLoading] = useState(!cachedInvoicesByDriver[initialRoutesCacheKey]);
  const [error, setError] = useState<string | null>(null);

  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<'sucursal' | 'domicilio'>('domicilio');
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [statusFilters, setStatusFilters] = useState<RutaStatus[]>([]);
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState<RutaInvoiceType>('normal');
  const [assignedUnits, setAssignedUnits] = useState<Record<string, AvailableUnit>>(cachedAssignedUnits || {});
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(lastViewMode);
  const [driverFilter, setDriverFilter] = useState<string>(lastDriverFilter);
  const [branchFilter, setBranchFilter] = useState<string>(lastBranchFilter);
  const [includePreviousPending, setIncludePreviousPending] = useState(lastIncludePreviousPending);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 15;
  const [drivers, setDrivers] = useState<Driver[]>(cachedDrivers || []);
  const [apiBlocks, setApiBlocks] = useState<ApiBlockStatus[]>(cachedBlocks || []);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [invoiceDetails, setInvoiceDetails] = useState<FetchedInvoiceDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [authorizingBlockName, setAuthorizingBlockName] = useState<string | null>(null);
  const [selectedInvoicesByBlock, setSelectedInvoicesByBlock] = useState<Record<string, string[]>>({});
  const [routeTickets, setRouteTickets] = useState<RouteTicket[]>([]);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [authorizingBranchPickupKey, setAuthorizingBranchPickupKey] = useState<string | null>(null);
  const authorizingBranchPickupRef = useRef(false);
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

  const findUnitInCatalog = (unit?: Pick<AvailableUnit, 'iId' | 'name'> | null) => {
    if (!unit) return undefined;

    return unitCatalog.find(u => u.iId === Number(unit.iId))
      || unitCatalog.find(u => u.name.trim().toUpperCase() === unit.name.trim().toUpperCase())
      || unidadesDisponibles.find(u => u.iId === Number(unit.iId))
      || unidadesDisponibles.find(u => u.name.trim().toUpperCase() === unit.name.trim().toUpperCase());
  };

  const getAssignedUnitForDisplay = (blockName: string, apiBlock?: ApiBlockStatus) => {
    const displayBranchId = branchFilter === 'all'
      ? apiBlock?.iIdLogisticsBranch || 0
      : currentLogisticsBranchId();

    const scopedUnit = assignedUnits[getBlockScopeKey(blockName, displayBranchId)];
    if (scopedUnit) {
      const catalogUnit = findUnitInCatalog(scopedUnit);
      return {
        ...scopedUnit,
        sucursal: scopedUnit.sucursal || catalogUnit?.sucursal || "",
        capacityKg: scopedUnit.capacityKg ?? catalogUnit?.capacityKg ?? null
      };
    }

    if (apiBlock?.iIdUnit && apiBlock.sUnidad) {
      const catalogUnit = findUnitInCatalog({
        iId: Number(apiBlock.iIdUnit),
        name: apiBlock.sUnidad
      });

      return {
        id: `${apiBlock.sUnidad}-${apiBlock.iIdUnit}-${apiBlock.iTripNumber || 1}`,
        name: apiBlock.sUnidad,
        sucursal: apiBlock.sLogisticsBranch || catalogUnit?.sucursal || "",
        iId: Number(apiBlock.iIdUnit),
        capacityKg: catalogUnit?.capacityKg ?? null
      };
    }

    return undefined;
  };

  useEffect(() => {
    cachedAssignedUnits = assignedUnits;
  }, [assignedUnits]);

  useEffect(() => {
    setCurrentPage(1);
  }, [deliveryTypeFilter, searchQuery, fromDate, statusFilters, invoiceTypeFilter, branchFilter, driverFilter, viewMode]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("rutas_view_mode") as 'cards' | 'table';
      if (saved === 'cards' || saved === 'table') {
        setViewMode(saved);
        lastViewMode = saved;
      }
    }
  }, []);

  const handleViewModeChange = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    lastViewMode = mode;
    if (typeof window !== "undefined") {
      localStorage.setItem("rutas_view_mode", mode);
    }
  };

  const isInitialMount = useRef(true);

  useEffect(() => {
    lastDriverFilter = driverFilter;
    lastIncludePreviousPending = includePreviousPending;
    const routesCacheKey = getRoutesCacheKey(driverFilter, includePreviousPending);
    if (isInitialMount.current) {
      isInitialMount.current = false;
      // Al montar por primera vez, forzar un refresco silencioso en segundo plano
      // para traer los catalogos y asignaciones más recientes de la BD
      fetchAllData(true, true);
    } else {
      fetchAllData(false, !!cachedInvoicesByDriver[routesCacheKey] && !!cachedRouteRowsByDriver[routesCacheKey]);
    }
  }, [driverFilter, includePreviousPending]);

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
  }, [driverFilter, includePreviousPending]);

  const getVisibleBlockInvoiceItems = (blockName: string) => {
    return (groupedData[blockName] || [])
      .filter(p => !p.id.startsWith('ORDER-'));
  };

  const getVisibleBlockInvoiceNums = (blockName: string) => {
    return getVisibleBlockInvoiceItems(blockName)
      .map(p => p.id.trim().toUpperCase())
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index);
  };

  const getVisibleBlockWeightKg = (blockName: string) => {
    return getVisibleBlockInvoiceItems(blockName)
      .reduce((sum, p) => sum + (Number(p.totalWeightKg) || 0), 0);
  };

  const isInvoiceSelectableForPartialRoute = (pedido: RutaPedido) => {
    return !pedido.id.startsWith('ORDER-') && pedido.estadoGeneral === 'ready';
  };

  const getSelectableBlockInvoiceNums = (blockName: string) => {
    return getVisibleBlockInvoiceItems(blockName)
      .filter(isInvoiceSelectableForPartialRoute)
      .map(p => p.id.trim().toUpperCase())
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index);
  };

  const getSelectedBlockInvoiceNums = (blockName: string) => {
    const selected = selectedInvoicesByBlock[currentBlockScopeKey(blockName)] || [];
    const selectable = new Set(getSelectableBlockInvoiceNums(blockName));

    return selected
      .map(x => x.trim().toUpperCase())
      .filter(invoice => selectable.has(invoice))
      .filter((value, index, array) => array.indexOf(value) === index);
  };

  const getSelectedBlockWeightKg = (blockName: string) => {
    const selected = new Set(getSelectedBlockInvoiceNums(blockName));
    if (selected.size === 0) return 0;

    return getVisibleBlockInvoiceItems(blockName)
      .filter(p => selected.has(p.id.trim().toUpperCase()))
      .reduce((sum, p) => sum + (Number(p.totalWeightKg) || 0), 0);
  };

  const isBlockInvoiceSelected = (blockName: string, invoiceId: string) => {
    return getSelectedBlockInvoiceNums(blockName).includes(invoiceId.trim().toUpperCase());
  };

  const toggleBlockInvoiceSelection = (blockName: string, pedido: RutaPedido) => {
    if (!isInvoiceSelectableForPartialRoute(pedido)) return;

    const invoiceNum = pedido.id.trim().toUpperCase();
    const blockScopeKey = currentBlockScopeKey(blockName);

    setSelectedInvoicesByBlock(prev => {
      const current = prev[blockScopeKey] || [];
      const exists = current.includes(invoiceNum);
      const nextInvoices = exists
        ? current.filter(x => x !== invoiceNum)
        : [...current, invoiceNum];
      const next = { ...prev };

      if (nextInvoices.length > 0) {
        next[blockScopeKey] = nextInvoices;
      } else {
        delete next[blockScopeKey];
      }

      return next;
    });
  };

  const clearBlockInvoiceSelection = (blockScopeKey: string) => {
    setSelectedInvoicesByBlock(prev => {
      if (!prev[blockScopeKey]) return prev;
      const next = { ...prev };
      delete next[blockScopeKey];
      return next;
    });
  };
  const getDistinctInvoiceNums = (items: RutaPedido[]) => {
    return items
      .filter(item => !item.id.startsWith('ORDER-'))
      .map(item => item.id.trim().toUpperCase())
      .filter(Boolean)
      .filter((value, index, array) => array.indexOf(value) === index);
  };

  const getBranchPickupAuthorizeKey = (items: RutaPedido[]) => {
    return items
      .filter(Boolean)
      .map(item => `${item.id.trim().toUpperCase()}|${item.logisticsBranchId || item.sucursal || ""}`)
      .join("||");
  };

  const removeAuthorizedBranchPickupFromRoutes = (invoiceNums: string[]) => {
    const authorizedInvoices = new Set(invoiceNums.map(invoice => invoice.trim().toUpperCase()).filter(Boolean));

    const shouldRemovePedido = (pedido: RutaPedido) => {
      if (pedido.deliveryType !== 'sucursal') return false;
      return authorizedInvoices.has(pedido.id.trim().toUpperCase());
    };

    const shouldRemoveRow = (row: ApiRutaInvoice) => {
      const invoiceNum = row.factura?.trim().toUpperCase();
      return !!invoiceNum && authorizedInvoices.has(invoiceNum);
    };

    setInvoices(prev => prev.filter(pedido => !shouldRemovePedido(pedido)));
    setRouteTicketRows(prev => prev.filter(row => !shouldRemoveRow(row)));

    cachedInvoices = cachedInvoices ? cachedInvoices.filter(pedido => !shouldRemovePedido(pedido)) : cachedInvoices;
    Object.keys(cachedInvoicesByDriver).forEach(key => {
      cachedInvoicesByDriver[key] = cachedInvoicesByDriver[key].filter(pedido => !shouldRemovePedido(pedido));
    });

    Object.keys(cachedRouteRowsByDriver).forEach(key => {
      cachedRouteRowsByDriver[key] = cachedRouteRowsByDriver[key].filter(row => !shouldRemoveRow(row));
    });
  };

  const handleAuthorizeBranchPickup = async (items: RutaPedido[], blockName?: string) => {
    const targetItems = items.filter(Boolean);
    if (targetItems.length === 0 || authorizingBranchPickupRef.current) return;

    const authorizeKey = getBranchPickupAuthorizeKey(targetItems);
    authorizingBranchPickupRef.current = true;
    setAuthorizingBranchPickupKey(authorizeKey);

    try {
      const itemBranchIds = targetItems
        .map(item => Number(item.logisticsBranchId || 0))
        .filter(branchId => branchId > 0)
        .filter((branchId, index, array) => array.indexOf(branchId) === index);
      const logisticsBranchId = currentLogisticsBranchId() || (itemBranchIds.length === 1 ? itemBranchIds[0] : 0);
      if (!logisticsBranchId) {
        await showError({
          title: "Selecciona una sucursal",
          text: "Para autorizar una recoleccion en sucursal debes filtrar por una sucursal especifica.",
          timer: 2600
        });
        return;
      }

      const invoiceNums = getDistinctInvoiceNums(targetItems);
      if (invoiceNums.length === 0) {
        await showError({
          title: "Sin facturas para ticket",
          text: "No se encontraron facturas para generar el ticket de recoleccion en sucursal.",
          timer: 2600
        });
        return;
      }

      const ticketBlockName = blockName || targetItems[0]?.block || "";
      const ticketsToPrint = buildRouteTickets(ticketBlockName, invoiceNums);
      if (ticketsToPrint.length === 0) {
        await showError({
          title: "No se pudo generar el ticket",
          text: "No se encontraron detalles de la orden de venta para imprimir el ticket.",
          timer: 2800
        });
        return;
      }

      const authorizeResponse = await fetch('/api/logistics/authorize-branch-pickup-delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          iIdLogisticsBranch: logisticsBranchId,
          invoiceNums
        })
      });

      if (!authorizeResponse.ok) {
        const errorMessage = await readApiErrorMessage(
          authorizeResponse,
          "No se pudo autorizar la recoleccion en sucursal."
        );
        await showError({
          title: "No se pudo autorizar",
          text: errorMessage,
          timer: 3200
        });
        return;
      }

      removeAuthorizedBranchPickupFromRoutes(invoiceNums);
      setRouteTickets(ticketsToPrint);
      setIsTicketDialogOpen(true);

      if (blockName) {
        clearBlockInvoiceSelection(currentBlockScopeKey(blockName));
      }
    } finally {
      authorizingBranchPickupRef.current = false;
      setAuthorizingBranchPickupKey(null);
    }
  };

  const renderInvoiceSelectionButton = (blockName: string, pedido: RutaPedido, className?: string) => {
    if (pedido.id.startsWith('ORDER-')) return null;

    const isSelectable = isInvoiceSelectableForPartialRoute(pedido);
    const isSelected = isBlockInvoiceSelected(blockName, pedido.id);

    return (
      <button
        type="button"
        title={isSelectable ? "Seleccionar factura" : "Factura no lista para salida"}
        aria-label={isSelectable ? `Seleccionar factura ${pedido.id}` : `Factura ${pedido.id} no lista para salida`}
        aria-pressed={isSelected}
        disabled={!isSelectable}
        onClick={(e) => {
          e.stopPropagation();
          toggleBlockInvoiceSelection(blockName, pedido);
        }}
        className={cn(
          "size-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all",
          isSelected
            ? "bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-500/30"
            : "bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 text-transparent hover:border-blue-400 dark:hover:border-blue-500",
          !isSelectable && "opacity-30 cursor-not-allowed hover:border-slate-300 dark:hover:border-slate-700",
          className
        )}
      >
        <Check className="size-3.5 stroke-[4]" />
      </button>
    );
  };

  const formatKg = (value: number) =>
    `${value.toLocaleString("es-MX", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} kg`;
  const buildRouteTickets = (blockName: string, invoiceNums: string[]) => {
    const invoiceSet = new Set(invoiceNums.map(invoice => invoice.trim().toUpperCase()).filter(Boolean));
    const selectedBranchId = currentLogisticsBranchId();
    const dateLabel = formatTicketDate();

    const rows = routeTicketRows.filter(row => {
      const rowInvoice = (row.factura || "").trim().toUpperCase();
      if (!rowInvoice || !invoiceSet.has(rowInvoice)) return false;
      if (normalizeBlockName(row.bloque || "") !== normalizeBlockName(blockName)) return false;

      const rawSucursal = row.sucursal?.trim().toUpperCase() || "";
      const mappedSucursal = rawSucursal === "SIN SUCURSAL" ? "SANTA CATARINA" : rawSucursal;
      const rowBranchId = row.iIdLogisticsBranch ?? getLogisticsBranchId(mappedSucursal);
      return !selectedBranchId || selectedBranchId <= 0 || rowBranchId === selectedBranchId;
    });

    const ticketsByOrder = new Map<number, RouteTicket & { warehouseMap: Map<string, Map<string, RouteTicketLine>> }>();

    rows.forEach(row => {
      if (!row.orderNum) return;

      if (!ticketsByOrder.has(row.orderNum)) {
        ticketsByOrder.set(row.orderNum, {
          orderNum: row.orderNum,
          clientName: row.cliente || "SIN CLIENTE",
          vendor: row.vendedor || "SIN VENDEDOR",
          dateLabel,
          warehouses: [],
          totalPieces: 0,
          warehouseMap: new Map()
        });
      }

      const ticket = ticketsByOrder.get(row.orderNum)!;
      const warehouse = (row.almacen || row.almacenDescripcionEpicor || "GENERAL").trim().toUpperCase();
      const description = (row.material || row.partNum || "SIN DESCRIPCION").trim().toUpperCase();
      const unit = (row.unidadEmbarque || row.salesUM || "PZ").trim().toUpperCase();
      const quantity = Number(row.cantidad ?? row.orderQty ?? 0) || 0;
      const lineKey = `${description}|${unit}`;

      if (!ticket.warehouseMap.has(warehouse)) {
        ticket.warehouseMap.set(warehouse, new Map());
      }

      const warehouseLines = ticket.warehouseMap.get(warehouse)!;
      const existingLine = warehouseLines.get(lineKey);
      if (existingLine) {
        existingLine.quantity += quantity;
      } else {
        warehouseLines.set(lineKey, { description, quantity, unit });
      }

      if (unit === "PZ") {
        ticket.totalPieces += quantity;
      }
    });

    return Array.from(ticketsByOrder.values())
      .sort((a, b) => a.orderNum - b.orderNum)
      .map(ticket => {
        const warehouses = Array.from(ticket.warehouseMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([warehouse, lines]) => ({
            warehouse,
            lines: Array.from(lines.values()).sort((a, b) => a.description.localeCompare(b.description))
          }));

        const totalPieces = ticket.totalPieces > 0
          ? ticket.totalPieces
          : warehouses.flatMap(warehouse => warehouse.lines).reduce((sum, line) => sum + line.quantity, 0);

        return {
          orderNum: ticket.orderNum,
          clientName: ticket.clientName,
          vendor: ticket.vendor,
          dateLabel: ticket.dateLabel,
          warehouses,
          totalPieces
        };
      })
      .filter(ticket => ticket.warehouses.length > 0);
  };

  const getSuggestedUnits = (requiredWeightKg: number, selectedUnit?: AvailableUnit) => {
    const selectedBranch = branchFilter === 'all' ? "" : branchFilter.toUpperCase();

    return unidadesDisponibles
      .filter(unit => {
        const capacityKg = Number(unit.capacityKg || 0);
        if (capacityKg < requiredWeightKg) return false;
        if (selectedUnit && unit.iId === selectedUnit.iId) return false;
        if (selectedBranch && unit.sucursal?.toUpperCase() !== selectedBranch) return false;
        return true;
      })
      .sort((a, b) => Number(a.capacityKg || 0) - Number(b.capacityKg || 0))
      .slice(0, 5);
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
      const selectedInvoiceNums = getSelectedBlockInvoiceNums(blockName);
      const invoiceNums = useInvoiceAuthorization
        ? authorize
          ? (selectedInvoiceNums.length > 0 ? selectedInvoiceNums : visibleInvoiceNums)
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

      const ticketsToPrint = authorize ? buildRouteTickets(blockName, invoiceNums) : [];

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
        const errorMessage = await readApiErrorMessage(
          response,
          "Error al cambiar la autorizacion del bloque"
        );
        throw new Error(errorMessage);
      }

      await showSuccess({
        title: authorize ? "Ruta sincronizada" : "Bloque regresado",
        html: authorize
          ? `El bloque <b>${blockName}</b> fue autorizado y la ruta quedo lista en Samsara.`
          : `Las facturas del bloque <b>${blockName}</b> regresaron correctamente.`,
        timer: 1800
      });

      if (authorize && ticketsToPrint.length > 0) {
        setRouteTickets(ticketsToPrint);
        setIsTicketDialogOpen(true);
      }

      clearBlockInvoiceSelection(blockScopeKey);
      await fetchAllData(true, true);
    } catch (err: unknown) {
      console.error("Error authorizing block:", err);
      closeSwal();

      const errorMessage = err instanceof Error ? err.message : "Hubo un error al cambiar la autorizacion del bloque.";
      const addressError = isAddressValidationError(errorMessage);

      await showError({
        title: addressError
          ? "No se pudo validar la direccion"
          : authorize ? "No se pudo autorizar el bloque" : "No se pudo regresar el bloque",
        text: addressError
          ? `${errorMessage} Si el problema continua, verifica la direccion o crea la ruta directamente en Samsara.`
          : errorMessage
      });
    } finally {
      setIsRefreshing(false);
      setAuthorizingBlockName(null);
    }
  };

  const handleAuthorizeBlock = async (blockName: string, authorize: boolean) => {
    const selectedInvoiceNums = getSelectedBlockInvoiceNums(blockName);
    const selectedCount = selectedInvoiceNums.length;

    if (authorize) {
      if (branchFilter === 'all') {
        await showError({
          title: "Selecciona una sucursal",
          text: "Para autorizar debes filtrar por una sucursal especifica. Asi solo se autoriza el material que sale de esa sucursal.",
          timer: 2600
        });
        return;
      }

      const apiBlock = getRouteBlockForDisplay(blockName);
      const assignedUnit = getAssignedUnitForDisplay(blockName, apiBlock);
      const selectedWeightKg = getSelectedBlockWeightKg(blockName);
      const requiredWeightKg = selectedCount > 0 ? selectedWeightKg : getVisibleBlockWeightKg(blockName);
      const capacityKg = Number(assignedUnit?.capacityKg || 0);

      if (assignedUnit && requiredWeightKg > 0 && capacityKg > 0 && requiredWeightKg > capacityKg) {
        const suggestions = getSuggestedUnits(requiredWeightKg, assignedUnit);
        const suggestionsHtml = suggestions.length > 0
          ? `<div style="margin-top:14px;text-align:left;border-top:1px solid rgba(148,163,184,.35);padding-top:12px;">
              <div style="font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Unidades compatibles disponibles</div>
              ${suggestions.map(unit => `<div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0;font-size:13px;color:#16a34a;"><b>${unit.name}</b><span>${unit.sucursal || "SIN SUCURSAL"} - ${formatKg(Number(unit.capacityKg || 0))}</span></div>`).join("")}
            </div>`
          : `<div style="margin-top:14px;text-align:left;border-top:1px solid rgba(148,163,184,.35);padding-top:12px;font-size:13px;">No hay unidades disponibles con capacidad suficiente para la sucursal seleccionada.</div>`;

        await showError({
          title: "Capacidad insuficiente",
          html: `La carga del bloque <b>${blockName}</b> pesa <b>${formatKg(requiredWeightKg)}</b> y la unidad <b>${assignedUnit.name}</b> soporta <b>${formatKg(capacityKg)}</b>.<br/>Selecciona una unidad con mayor capacidad.${suggestionsHtml}`
        });
        return;
      }
    }

    const confirmed = await showConfirm({
      icon: authorize ? "question" : "warning",
      iconColor: authorize ? "#60a5fa" : "#f59e0b",
      title: authorize ? "¿Autorizar bloque?" : "¿Regresar bloque?",
      html: authorize
        ? selectedCount > 0
          ? `Se creara la ruta en Samsara y se autorizaran <b>${selectedCount}</b> facturas seleccionadas del bloque <b>${blockName}</b>.`
          : `Se creara la ruta en Samsara y se autorizaran solo las facturas visibles de la sucursal seleccionada para el bloque <b>${blockName}</b>.`
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
    const routesCacheKey = getRoutesCacheKey(driverFilter, includePreviousPending);

    if (!forceRefresh && !silent && cachedInvoicesByDriver[routesCacheKey] && cachedRouteRowsByDriver[routesCacheKey]) {
      setInvoices(cachedInvoicesByDriver[routesCacheKey]);
      setRouteTicketRows(cachedRouteRowsByDriver[routesCacheKey]);
      setIsLoading(false);
      isFetchingRef.current = false;
      return;
    }

    try {
      setIsRefreshing(true);
      if (!silent) setIsLoading(true);
      setError(null);

      const catalogsNeeded = forceRefresh || !cachedUnidades || !cachedUnitCatalog || !cachedDrivers || !cachedBlocks;

      const routesParams = new URLSearchParams();
      if (driverFilter && driverFilter !== 'all') {
        routesParams.set('iIdDriver', driverFilter);
      }
      if (includePreviousPending) {
        routesParams.set('includePreviousPending', 'true');
        routesParams.set('previousPendingDays', DEFAULT_PREVIOUS_PENDING_DAYS.toString());
      }
      const routesQuery = routesParams.toString();
      const routesUrl = routesQuery ? `/api/routes?${routesQuery}` : '/api/routes';

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
          const allUnits = unitsData.map((u: any, i: number) => ({
            id: `${u.sNombre_Unidad}-${u.sSucursal}-${i}`,
            name: u.sNombre_Unidad,
            sucursal: u.sSucursal,
            iId: Number(u.iId || u.sId || 0),
            capacityKg: u.fCapacityKg !== null && u.fCapacityKg !== undefined ? Number(u.fCapacityKg) : null
          }));
          const availableUnits = unitsData
            .filter((u: any) => u.sEstatus !== "Asignado" && u.sEstatus !== "Mantenimiento")
            .map((u: any, i: number) => ({
              id: `${u.sNombre_Unidad}-${u.sSucursal}-${i}`,
              name: u.sNombre_Unidad,
              sucursal: u.sSucursal,
              iId: Number(u.iId || u.sId || 0),
              capacityKg: u.fCapacityKg !== null && u.fCapacityKg !== undefined ? Number(u.fCapacityKg) : null
            }));
          setUnitCatalog(allUnits);
          cachedUnitCatalog = allUnits;
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
      const activeRouteRows = data.filter(row => {
        const isBranchPickup = row.metodo === 'RES' || (row.metodo && row.metodo.includes('M01'));
        return !(isBranchPickup && row.dDateRouteAuthorized);
      });
      cachedRouteRowsByDriver[routesCacheKey] = activeRouteRows;
      setRouteTicketRows(activeRouteRows);

      const groupedMap = new Map<string, RutaPedido & { block: string }>();

      activeRouteRows.forEach((row) => {
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
          const displayDate = isFactura ? row.fecha : row.orderDate;
          const isPreviousPendingRow =
            isTruthyPreviousPending(row.isPreviousPending) ||
            isTruthyPreviousPending(row.IsPreviousPending) ||
            (includePreviousPending && isBeforeToday(displayDate));

          let status: RutaStatus = 'pending';
          const rawStatus = (row.estatusEmbarque || "").toLowerCase();
          if (rawStatus === 'listo') status = 'ready';
          else if (rawStatus === 'en proceso' || rawStatus === 'embarcado') status = 'in-progress';
          else status = 'pending';

          groupedMap.set(groupKey, {
            id: displayId,
            clientName: row.cliente,
            date: displayDate,
            warehouses: [],
            vendedor: row.vendedor,
            deliveryType: (row.metodo === 'RES' || (row.metodo && row.metodo.includes('M01'))) ? 'sucursal' : 'domicilio',
            block: (row.bloque || "GENERAL").trim().toUpperCase(),
            estadoGeneral: status,
            type: type,
            completedDeliveries: type === 'anticipada' ? (row.montoAnticipado > 0 ? 1 : 0) : undefined,
            hasGlassCut: false,
            montoTotal: row.monto_Factura,
            totalWeightKg: 0,
            orderNum: row.orderNum,
            sucursal: mappedSucursal,
            logisticsBranchId,
            direccionEnvio: row.direccionEnvio,
            isPreviousPending: isPreviousPendingRow
          });
        }

        const current = groupedMap.get(groupKey)!;
        const rowWeightKg = Number(row.totalNetWeight || 0);
        if (!Number.isNaN(rowWeightKg)) {
          current.totalWeightKg = (current.totalWeightKg || 0) + rowWeightKg;
        }

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

      cachedInvoicesByDriver[routesCacheKey] = allData;
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

    return filtered;
  }, [invoices, deliveryTypeFilter, searchQuery, fromDate, statusFilters, invoiceTypeFilter, branchFilter]);

  const paginatedPedidos = useMemo(() => {
    if (viewMode !== 'table') {
      return filteredPedidos;
    }
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPedidos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPedidos, currentPage, viewMode]);

  const paginatedGroupedData = useMemo(() => {
    const groups: Record<string, RutaPedido[]> = {};
    BLOCKS_LIST.forEach(b => groups[b] = []);
    paginatedPedidos.forEach(p => {
      if (p.block && groups[p.block]) {
        groups[p.block].push(p);
      }
    });
    return groups;
  }, [paginatedPedidos, BLOCKS_LIST]);

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

  const totalPages = Math.ceil(filteredPedidos.length / ITEMS_PER_PAGE);
  const startItem = Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredPedidos.length);
  const endItem = Math.min(currentPage * ITEMS_PER_PAGE, filteredPedidos.length);

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
              onClick={() => handleViewModeChange('cards')}
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
              onClick={() => handleViewModeChange('table')}
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
        <button
          type="button"
          onClick={() => {
            setIncludePreviousPending((prev) => !prev);
            setCurrentPage(1);
          }}
          title={includePreviousPending ? "Ocultar pendientes anteriores" : "Mostrar pendientes anteriores"}
          className={cn(
            "inline-flex h-9 items-center justify-center gap-2 rounded-xl border px-3 text-[10px] font-black uppercase tracking-widest transition-all shrink-0 cursor-pointer",
            includePreviousPending
              ? "border-amber-300 bg-amber-50 text-amber-700 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300"
              : "border-slate-200 bg-white/70 text-slate-500 hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:text-slate-200"
          )}
        >
          <History className="size-3.5" />
          Anteriores
        </button>

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
                  <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">{deliveryTypeFilter === 'sucursal' ? 'Acción' : 'Estado General'}</th>
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
                    {paginatedPedidos.map(p => {
                      const aluminio = p.warehouses.find(w => w.id === 'Aluminio')?.status || 'none';
                      const vidrio = p.warehouses.find(w => w.id === 'Vidrio')?.status || 'none';
                      const herrajes = p.warehouses.find(w => w.id === 'Herrajes')?.status || 'none';

                      return (
                        <tr key={`${p.id}-${p.logisticsBranchId || p.sucursal}`} onClick={() => handleOpenDetails(p.id)} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer">
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="inline-flex items-center gap-1.5 text-sm font-black text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {p.id.startsWith('ORDER-') ? `Orden: ${p.id.split('-')[1]}` : `Factura: ${p.id}`}
                                {p.isPreviousPending && (
                                  <span className="inline-flex items-center justify-center size-6 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 shrink-0 shadow-sm">
                                    <Clock3 className="size-4 stroke-[2.5]" />
                                  </span>
                                )}
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{p.date}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-black text-slate-500 dark:text-slate-400 leading-tight whitespace-normal break-words max-w-[420px]">{p.clientName}</span>
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 opacity-70 truncate">{p.vendedor}</span>
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
                            {(() => {
                              const hasInvoice = !p.id.startsWith('ORDER-');
                              const authorizeKey = getBranchPickupAuthorizeKey([p]);
                              const isAuthorizing = authorizingBranchPickupKey === authorizeKey;

                              return (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={!!authorizingBranchPickupKey || !hasInvoice}
                                  className={cn(
                                    "h-9 px-4 text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-none ring-0",
                                    hasInvoice
                                      ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-60"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!hasInvoice) return;
                                    handleAuthorizeBranchPickup([p], p.block);
                                  }}
                                >
                                  {isAuthorizing && (
                                    <RefreshCw className="size-3.5 animate-spin" />
                                  )}
                                  {isAuthorizing ? "Autorizando..." : hasInvoice ? "Autorizar" : "Sin factura"}
                                </Button>
                              );
                            })()}
                          </td>
                        </tr>
                      );
                    })}
                  </>
                ) : (
                  BLOCKS_LIST.filter(blockName => (paginatedGroupedData[blockName] || []).length > 0).map((blockName) => {
                    const items = paginatedGroupedData[blockName] || [];
                    const blockScopeKey = currentBlockScopeKey(blockName);
                    const apiBlock = getRouteBlockForDisplay(blockName);
                    const assignedUnit = getAssignedUnitForDisplay(blockName, apiBlock);
                    const isAllBranches = branchFilter === 'all';
                    const isAuthorized = !isAllBranches && isBlockAuthorizedForCurrentTrip(apiBlock);
                    const selectedInvoiceNums = getSelectedBlockInvoiceNums(blockName);
                    const selectedCount = selectedInvoiceNums.length;
                    const canAuthorize = !!assignedUnit && (selectedCount > 0 || items.some(item => item.estadoGeneral === 'ready' && !item.id.startsWith('ORDER-')));
                    const isProcessing = authorizingBlockName === blockScopeKey;
                    const totalBlockWeightKg = getVisibleBlockWeightKg(blockName);
                    const selectedBlockWeightKg = getSelectedBlockWeightKg(blockName);
                    const displayBlockWeightKg = selectedCount > 0 ? selectedBlockWeightKg : totalBlockWeightKg;
                    return (
                      <Fragment key={blockName}>
                        <tr className="bg-slate-100/90 dark:bg-slate-800/70 border-y border-slate-300/80 dark:border-slate-700/80">
                          <td colSpan={6} className="px-6 py-3.5">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest whitespace-nowrap">{blockName}</span>
                                <div className="size-5 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900 shrink-0">
                                  {items.length}
                                </div>
                                {displayBlockWeightKg > 0 && (
                                  <span className="rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300 whitespace-nowrap shrink-0">
                                    {formatKg(displayBlockWeightKg)}
                                  </span>
                                )}
                                {selectedCount > 0 && (
                                  <span className="rounded-full border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-300 whitespace-nowrap shrink-0">
                                    {selectedCount} sel.
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAuthorizeBlock(blockName, !isAuthorized);
                                  }}
                                  disabled={!canAuthorize || isProcessing}
                                  size="sm"
                                  className={cn(
                                    "h-8 px-3 text-[10px] font-black rounded-xl flex items-center gap-1.5 uppercase tracking-widest transition-all shadow-none ring-0",
                                    isAuthorized && canAuthorize
                                      ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                                      : canAuthorize
                                        ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-60"
                                  )}
                                >
                                  {isProcessing && (
                                    <RefreshCw className="size-3.5 animate-spin" />
                                  )}
                                  {isProcessing
                                    ? "Procesando..."
                                    : isAuthorized && canAuthorize
                                      ? "Regresar"
                                      : "Autorizar"}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "h-8 px-3 text-[10px] font-black rounded-xl flex items-center gap-2 transition-all cursor-default",
                                    assignedUnit
                                      ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-none ring-0 opacity-100"
                                      : "bg-white dark:bg-slate-800 shadow-sm opacity-80"
                                  )}
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label="Unidad asignada desde Samsara"
                                >
                                  <Truck className="size-3.5" />
                                  <span className="uppercase tracking-widest truncate max-w-[100px]">
                                    {assignedUnit ? assignedUnit.name : "Sin unidad"}
                                  </span>
                                </Button>
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
                                <div className="flex items-start gap-3">
                                  {renderInvoiceSelectionButton(blockName, p, "mt-0.5")}
                                  <div className="flex flex-col">
                                    <span className="inline-flex items-center gap-1.5 text-sm font-black text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                      {p.id.startsWith('ORDER-') ? `Orden: ${p.id.split('-')[1]}` : `Factura: ${p.id}`}
                                      {p.isPreviousPending && (
                                        <span className="inline-flex items-center justify-center size-6 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 shrink-0 shadow-sm">
                                          <Clock3 className="size-4 stroke-[2.5]" />
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">{p.date}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-black text-slate-500 dark:text-slate-400 leading-tight whitespace-normal break-words max-w-[420px]">{p.clientName}</span>
                                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 opacity-70 truncate">{p.vendedor}</span>
                                  {p.direccionEnvio && (
                                    <div className="flex items-start gap-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-200 transition-colors" title={p.direccionEnvio}>
                                      <MapPin className="size-3.5 text-red-500 shrink-0 mt-0.5" />
                                      <span className="break-words max-w-[600px] leading-relaxed">
                                        {p.direccionEnvio}
                                      </span>
                                    </div>
                                  )}
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
              {filteredPedidos.length > 0
                ? `Mostrando ${startItem}-${endItem} de ${filteredPedidos.length} pedidos`
                : "Sin pedidos para mostrar"}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg cursor-pointer"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                  <ChevronDown className="size-4 rotate-90" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "ghost" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "h-8 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer",
                      currentPage === page
                        ? "bg-blue-600 text-white hover:bg-blue-700 hover:text-white"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100"
                    )}
                  >
                    {page}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg cursor-pointer"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  <ChevronDown className="size-4 -rotate-90" />
                </Button>
              </div>
            )}
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
              const selectedInvoiceNums = getSelectedBlockInvoiceNums(blockName);
              const selectedCount = selectedInvoiceNums.length;
              const canAuthorize = !!assignedUnit && (selectedCount > 0 || items.some(item => item.estadoGeneral === 'ready' && !item.id.startsWith('ORDER-')));
              const isProcessing = authorizingBlockName === blockScopeKey;
              const totalBlockWeightKg = getVisibleBlockWeightKg(blockName);
              const selectedBlockWeightKg = getSelectedBlockWeightKg(blockName);
              const displayBlockWeightKg = selectedCount > 0 ? selectedBlockWeightKg : totalBlockWeightKg;
              return (
                <Card key={blockName} className="border-2 border-slate-300 dark:border-slate-700 bg-white/50 dark:bg-slate-900/40 rounded-2xl overflow-hidden flex flex-col h-full shadow-md transition-all hover:shadow-lg">
                  <CardHeader className="p-4 pb-0">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <CardTitle className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider leading-tight break-words">
                            {blockName}
                          </CardTitle>
                          <div className="flex items-center justify-center size-5 rounded-full bg-blue-600 dark:bg-blue-500 text-[10px] font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900 shrink-0">
                            {items.length}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            onClick={() => handleAuthorizeBlock(blockName, !isAuthorized)}
                            disabled={!canAuthorize || isProcessing}
                            size="sm"
                            className={cn(
                              "h-8 px-3 text-[10px] font-black rounded-xl flex items-center gap-1.5 uppercase tracking-widest transition-all shadow-none ring-0",
                              isAuthorized && canAuthorize
                                ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40"
                                : canAuthorize
                                  ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-60"
                            )}
                          >
                            {isProcessing && (
                              <RefreshCw className="size-3.5 animate-spin" />
                            )}
                            {isProcessing
                              ? "Procesando..."
                              : isAuthorized && canAuthorize
                                ? "Regresar"
                                : "Autorizar"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-8 px-3 text-[10px] font-black rounded-xl flex items-center gap-2 transition-all cursor-default",
                              assignedUnit
                                ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 shadow-none ring-0 opacity-100"
                                : "bg-white dark:bg-slate-800 shadow-sm opacity-80"
                            )}
                            aria-label="Unidad asignada desde Samsara"
                          >
                            <Truck className="size-3.5" />
                            <span className="uppercase tracking-widest truncate max-w-[100px]">
                              {assignedUnit ? assignedUnit.name : "Sin unidad"}
                            </span>
                          </Button>
                        </div>
                      </div>

                      {displayBlockWeightKg > 0 ? (
                        <div className="flex items-center gap-1.5 h-5">
                          <span className="rounded-full border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300 whitespace-nowrap shrink-0">
                            {formatKg(displayBlockWeightKg)}
                          </span>
                          {selectedCount > 0 && (
                            <span className="rounded-full border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-300 whitespace-nowrap shrink-0">
                              {selectedCount} sel.
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="h-5" />
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="px-2 pt-1 pb-4 flex-1">
                    {items.length > 0 ? (
                      <div className={cn(
                        "flex flex-col gap-3",
                        items.length > 2
                          ? "max-h-[510px] overflow-y-auto pr-2 custom-scrollbar"
                          : "h-auto overflow-visible pr-0"
                      )}>
                        {items.map(p => {
                          const isSelected = isBlockInvoiceSelected(blockName, p.id);

                          return (
                            <div
                              key={`${p.id}-${p.logisticsBranchId || p.sucursal}`}
                              className={cn(
                                "shrink-0 relative rounded-2xl transition-all",
                                isSelected && "outline outline-2 outline-blue-500/80 outline-offset-[-2px] shadow-[inset_4px_0_0_rgba(37,99,235,0.95)]"
                              )}
                            >
                              <div className="absolute top-3 right-3 z-10">
                                {renderInvoiceSelectionButton(blockName, p)}
                              </div>
                              <RutaOrderCard pedido={p} activeStatusFilters={statusFilters} onClick={() => handleOpenDetails(p.id)} />
                            </div>
                          );
                        })}
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
              filteredPedidos.map(p => {
                const hasInvoice = !p.id.startsWith('ORDER-');
                const authorizeKey = getBranchPickupAuthorizeKey([p]);
                const isAuthorizing = authorizingBranchPickupKey === authorizeKey;

                return (
                  <div key={`${p.id}-${p.logisticsBranchId || p.sucursal}`} className="relative">
                    <div className="absolute right-3 top-3 z-10">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!!authorizingBranchPickupKey || !hasInvoice}
                        className={cn(
                          "h-8 px-3 text-[10px] font-black rounded-xl uppercase tracking-widest flex items-center gap-1.5 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-none ring-0",
                          hasInvoice
                            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                            : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 opacity-60"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!hasInvoice) return;
                          handleAuthorizeBranchPickup([p], p.block);
                        }}
                      >
                        {isAuthorizing && (
                          <RefreshCw className="size-3.5 animate-spin" />
                        )}
                        {isAuthorizing ? "Autorizando..." : hasInvoice ? "Autorizar" : "Sin factura"}
                      </Button>
                    </div>
                    <RutaOrderCard pedido={p} activeStatusFilters={statusFilters} onClick={() => handleOpenDetails(p.id)} />
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center opacity-50">
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">No hay pedidos pendientes en sucursal</p>
              </div>
            )}
          </div>
        </div>
      )}

      <RouteTicketsDialog
        tickets={routeTickets}
        open={isTicketDialogOpen}
        onOpenChange={setIsTicketDialogOpen}
      />

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
                              <div className="flex flex-wrap items-center gap-2">
                                <span>{mat.material}</span>
                                {Number(mat.corte) === 1 && (
                                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-700 dark:bg-red-500/15 dark:text-red-300">
                                    Corte
                                  </span>
                                )}
                              </div>
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


