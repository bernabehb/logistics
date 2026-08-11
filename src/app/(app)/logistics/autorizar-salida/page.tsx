"use client";

import { useState, useEffect } from "react";
import { Search, CheckCircle2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DepartureCard, ReadyDeparture } from "@/features/logistics/components/cards/DepartureCard";
import { LogisticsBranchFilter } from "@/features/logistics/components";
import { RefreshCw } from "lucide-react";
import { showError, showSuccess } from "@/lib/mySwal";
interface FacturaObj {
  factura?: string;
  Factura?: string;
  orderNum?: number;
  OrderNum?: number;
  monto?: number;
  Monto?: number;
  autorizada?: boolean;
  Autorizada?: boolean;
  escaneada?: boolean;
  Escaneada?: boolean;
  entregada?: boolean;
  Entregada?: boolean;
  delivered?: boolean;
  Delivered?: boolean;
  routeDocumentType?: string | null;
  RouteDocumentType?: string | null;
  routeDocumentNum?: string | null;
  RouteDocumentNum?: string | null;
  esNueva?: boolean;
  EsNueva?: boolean;
}

interface ApiDepartureHome {
  unidad: string;
  chofer: string;
  sucursalLogistica?: string;
  SucursalLogistica?: string;
  estatus: string;
  facturas: FacturaObj[];
  pesoTotal: number;
  montoTotal: number;
  direccionesEntrega: string[];
}


type DepartureStatusFilter = "Pendiente" | "Escaneada" | "En ruta";

const ROUTES_CACHE_BUST_STORAGE_KEY = "logistics_routes_cache_bust";

type RouteDocumentPayload = {
  documentType: "INVOICE" | "ORDER";
  documentNum: string;
  invoiceNum?: string | null;
  orderNum?: number | null;
};
interface ApiDepartureBranch {
  cliente: string;
  sucursalLogistica?: string;
  SucursalLogistica?: string;
  estatus: string;
  facturas: FacturaObj[];
  pesoTotal: number;
  montoTotal: number;
}

let cachedDepartures: ReadyDeparture[] | null = null;
let cachedBranchFilter: string = "all";

const isAuthorizedInvoice = (invoice: FacturaObj | string) => {
  if (typeof invoice === 'string') return false;
  return typeof invoice.autorizada === 'boolean' ? invoice.autorizada : invoice.Autorizada === true;
};

const isScannedInvoice = (invoice: FacturaObj | string) => {
  if (typeof invoice === 'string') return false;
  return typeof invoice.escaneada === 'boolean' ? invoice.escaneada : invoice.Escaneada === true;
};

const isDeliveredInvoice = (invoice: FacturaObj | string) => {
  if (typeof invoice === 'string') return false;
  if (typeof invoice.entregada === 'boolean') return invoice.entregada;
  if (typeof invoice.Entregada === 'boolean') return invoice.Entregada;
  if (typeof invoice.delivered === 'boolean') return invoice.delivered;
  return invoice.Delivered === true;
};

const getInvoiceId = (invoice: FacturaObj | string) => (
  typeof invoice === 'string' ? invoice : (invoice.factura || invoice.Factura || "")
);

const getOrderNum = (invoice: FacturaObj | string) => (
  typeof invoice === 'string' ? undefined : (invoice.orderNum || invoice.OrderNum || undefined)
);

const getInvoiceAmount = (invoice: FacturaObj | string) => {
  if (typeof invoice === 'string') return undefined;
  const amount = typeof invoice.monto === 'number' ? invoice.monto : invoice.Monto;
  return typeof amount === 'number' ? amount : undefined;
};
const normalizeRouteDocumentType = (value?: string | null): "INVOICE" | "ORDER" => {
  const normalized = (value || "").trim().toUpperCase();
  return normalized === "ORDER" ? "ORDER" : "INVOICE";
};

const getRouteDocumentType = (invoice: FacturaObj | string): "INVOICE" | "ORDER" => {
  if (typeof invoice === 'string') return "INVOICE";
  const explicitType = invoice.routeDocumentType || invoice.RouteDocumentType;
  if (explicitType) return normalizeRouteDocumentType(explicitType);
  return getInvoiceId(invoice) ? "INVOICE" : "ORDER";
};

const getRouteDocumentNum = (invoice: FacturaObj | string) => {
  if (typeof invoice === 'string') return invoice;
  const explicitNum = (invoice.routeDocumentNum || invoice.RouteDocumentNum || "").trim();
  if (explicitNum) return explicitNum;

  const invoiceNum = getInvoiceId(invoice);
  const orderNum = getOrderNum(invoice);
  return getRouteDocumentType(invoice) === "ORDER" ? String(orderNum || invoiceNum || "") : invoiceNum;
};

const getRouteDocumentDisplayId = (invoice: FacturaObj | string) => {
  const invoiceNum = getInvoiceId(invoice).trim();
  if (invoiceNum) return invoiceNum;

  return getRouteDocumentType(invoice) === "ORDER" ? getRouteDocumentNum(invoice).trim() : "";
};

const toRouteDocumentPayload = (invoice: ReadyDeparture["invoices"][number]): RouteDocumentPayload | null => {
  const documentType = normalizeRouteDocumentType(invoice.routeDocumentType);
  const invoiceNum = (invoice.id || "").trim();
  const documentNum = String(invoice.routeDocumentNum || (documentType === "ORDER" ? invoice.orderNum : invoiceNum) || invoiceNum || "").trim();
  if (!documentNum) return null;

  const parsedOrderNum = documentType === "ORDER" && /^\d+$/.test(documentNum)
    ? Number(documentNum)
    : invoice.orderNum ?? null;

  return {
    documentType,
    documentNum,
    invoiceNum: documentType === "INVOICE" ? (invoiceNum || documentNum) : null,
    orderNum: documentType === "ORDER" ? parsedOrderNum : invoice.orderNum ?? null,
  };
};

const getDepartureRouteDocuments = (departure?: ReadyDeparture | null) => (
  departure?.invoices.map(toRouteDocumentPayload).filter((doc): doc is RouteDocumentPayload => !!doc) || []
);

export default function AutorizarSalidaPage() {
  const [departures, setDepartures] = useState<ReadyDeparture[]>(cachedDepartures || []);
  const [isRefreshing, setIsRefreshing] = useState(!cachedDepartures);
  const [isSyncingDeliveries, setIsSyncingDeliveries] = useState(false);
  const [materialReviewAutoCreateEnabled, setMaterialReviewAutoCreateEnabled] = useState<boolean | null>(null);

  const fetchDepartures = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      const [homeRes, branchRes] = await Promise.all([
        fetch('/api/logistics/authorizations-home'),
        fetch('/api/logistics/authorizations-branch')
      ]);

      let newDepartures: ReadyDeparture[] = [];

      if (homeRes.ok) {
        const homeData: ApiDepartureHome[] = await homeRes.json();
        const mappedHome = homeData.map((d, i) => {
          const allInvoices = d.facturas || [];
          const activeInvoices = allInvoices.filter(f => !isDeliveredInvoice(f));
          const pendingInvoices = activeInvoices.filter(f => !isAuthorizedInvoice(f) && !isScannedInvoice(f));
          const scannedInvoices = activeInvoices.filter(f => !isAuthorizedInvoice(f) && isScannedInvoice(f));

          const isFullyAuthorized = allInvoices.some(f => isAuthorizedInvoice(f) && !isDeliveredInvoice(f));
          const isFullyScanned = activeInvoices.length > 0 && !isFullyAuthorized && pendingInvoices.length === 0 && scannedInvoices.length > 0;
          let computedStatus = (d.estatus?.toUpperCase() === "PENDIENTE" || d.estatus?.toUpperCase() === "LISTO") ? "Pendiente" : "En ruta";
          if (isFullyAuthorized) computedStatus = "En ruta";
          else if (isFullyScanned) computedStatus = "Escaneada";

          const invoicesToMap = computedStatus === "En ruta"
            ? allInvoices
            : computedStatus === "Escaneada"
              ? scannedInvoices
              : activeInvoices;
          const mappedInvoices = invoicesToMap.map(f => ({
            id: getRouteDocumentDisplayId(f),
            orderNum: getOrderNum(f),
            routeDocumentType: getRouteDocumentType(f),
            routeDocumentNum: getRouteDocumentNum(f),
            amount: getInvoiceAmount(f),
            groups: [],
            isNew: typeof f === 'string' ? false : (!!f.esNueva || !!f.EsNueva),
            isScanned: isScannedInvoice(f),
            isDelivered: isDeliveredInvoice(f)
          }));

          const invoiceIds = mappedInvoices.map(inv => inv.id).join("_");
          const logisticsBranch = (d.sucursalLogistica || d.SucursalLogistica || "").trim().toUpperCase();
          return {
            id: `home-${d.unidad.trim()}-${d.chofer.trim()}-${computedStatus}-${invoiceIds}-${i}`,
            unitName: d.unidad,
            type: "Reparto",
            driverName: d.chofer,
            destination: d.direccionesEntrega?.[0] || "Destinos múltiples",
            invoices: mappedInvoices,
            totalWeightTons: d.pesoTotal,
            totalAmount: d.montoTotal,
            deliveryType: "domicilio" as const,
            locations: d.direccionesEntrega || [],
            status: computedStatus as ReadyDeparture["status"],
            logisticsBranch,
          };
        }).filter(d => d.invoices.length > 0 && d.invoices.some(inv => !inv.isDelivered));
        newDepartures = [...newDepartures, ...mappedHome];
      }

      if (branchRes.ok) {
        const branchData: ApiDepartureBranch[] = await branchRes.json();
        const mappedBranch = branchData.map((d, i) => {
          const allInvoices = d.facturas || [];
          const activeInvoices = allInvoices.filter(f => !isDeliveredInvoice(f));
          const pendingInvoices = activeInvoices.filter(f => !isAuthorizedInvoice(f) && !isScannedInvoice(f));
          const scannedInvoices = activeInvoices.filter(f => !isAuthorizedInvoice(f) && isScannedInvoice(f));

          const isFullyAuthorized = allInvoices.some(f => isAuthorizedInvoice(f) && !isDeliveredInvoice(f));
          const isFullyScanned = activeInvoices.length > 0 && !isFullyAuthorized && pendingInvoices.length === 0 && scannedInvoices.length > 0;
          let computedStatus = (d.estatus?.toUpperCase() === "PENDIENTE" || d.estatus?.toUpperCase() === "LISTO") ? "Pendiente" : "En ruta";
          if (isFullyAuthorized) computedStatus = "En ruta";
          else if (isFullyScanned) computedStatus = "Escaneada";

          const invoicesToMap = computedStatus === "En ruta"
            ? allInvoices
            : computedStatus === "Escaneada"
              ? scannedInvoices
              : activeInvoices;
          const mappedInvoices = invoicesToMap.map(f => ({
            id: getRouteDocumentDisplayId(f),
            orderNum: getOrderNum(f),
            routeDocumentType: getRouteDocumentType(f),
            routeDocumentNum: getRouteDocumentNum(f),
            amount: getInvoiceAmount(f),
            groups: [],
            isScanned: isScannedInvoice(f),
            isDelivered: isDeliveredInvoice(f)
          }));

          const invoiceIds = mappedInvoices.map(inv => inv.id).join("_");
          const logisticsBranch = (d.sucursalLogistica || d.SucursalLogistica || "").trim().toUpperCase();
          return {
            id: `branch-${d.cliente.trim()}-${computedStatus}-${invoiceIds}-${i}`,
            unitName: "SUCURSAL",
            type: "Recolección",
            driverName: "Cliente",
            clientName: d.cliente,
            destination: "Sucursal",
            invoices: mappedInvoices,
            totalWeightTons: d.pesoTotal,
            totalAmount: d.montoTotal,
            deliveryType: "sucursal" as const,
            locations: [],
            status: computedStatus as ReadyDeparture["status"],
            logisticsBranch,
          };
        }).filter(d => d.invoices.length > 0 && d.invoices.some(inv => !inv.isDelivered));
        newDepartures = [...newDepartures, ...mappedBranch];
      }

      setDepartures(newDepartures);
      cachedDepartures = newDepartures;
    } catch (err) {
      console.error("Error fetching departures:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchMaterialReviewDocumentStatus = async () => {
    try {
      const response = await fetch('/api/logistics/material-review-document-status');
      const data = await response.json().catch(() => null);
      setMaterialReviewAutoCreateEnabled(response.ok && data?.enabled === true);
    } catch (err) {
      console.warn("Error consultando estado de documento automático:", err);
      setMaterialReviewAutoCreateEnabled(false);
    }
  };

  useEffect(() => {
    fetchDepartures(!!cachedDepartures);
    fetchMaterialReviewDocumentStatus();
  }, []);

  const markDeliveredInvoicesInState = (invoiceNums: string[]) => {
    const deliveredSet = new Set(invoiceNums.map(inv => inv.trim()).filter(Boolean));
    if (deliveredSet.size === 0) return;

    setDepartures(prev => {
      const updated = prev
        .map(dep => ({
          ...dep,
          invoices: dep.invoices.map(inv =>
            deliveredSet.has(inv.id.trim()) ? { ...inv, isDelivered: true } : inv
          ),
        }))
        .filter(dep => dep.invoices.some(inv => !inv.isDelivered));

      cachedDepartures = updated;
      return updated;
    });
  };
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const syncResponse = await fetch("/api/logistics/sync-started-samsara-routes", {
        method: "POST",
      });

      if (!syncResponse.ok) {
        console.warn("No se pudo sincronizar rutas iniciadas desde Samsara.");
      }
    } catch (err) {
      console.warn("Error sincronizando rutas iniciadas desde Samsara:", err);
    } finally {
      await Promise.all([
        fetchDepartures(true),
        fetchMaterialReviewDocumentStatus(),
      ]);
    }
  };
  const handleSyncMaterialDeliveries = async () => {
    setIsSyncingDeliveries(true);
    try {
      const response = await fetch("/api/logistics/sync-material-deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ daysBack: 1, invoiceNums: [] }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || data?.success === false) {
        throw new Error(data?.message || data?.error || "No se pudieron sincronizar las entregas desde Samsara.");
      }

      const deliveredInvoiceNums = Array.isArray(data?.deliveredInvoiceNums) ? data.deliveredInvoiceNums : [];
      markDeliveredInvoicesInState(deliveredInvoiceNums);

      const deliveredCount = data?.deliveredInvoices ?? deliveredInvoiceNums.length;
      if (deliveredCount > 0) {
        await showSuccess({
          title: "Entregas sincronizadas",
          text: `Se sincronizaron ${deliveredCount} facturas entregadas desde Samsara.`,
        });
      } else {
        await showSuccess({
          title: "Sin entregas nuevas",
          text: "No se encontraron facturas en ruta pendientes de marcar como entregadas.",
        });
      }
    } catch (err) {
      console.warn("Error sincronizando entregas desde Samsara:", err);
      await showError({
        title: "No se pudo sincronizar",
        text: err instanceof Error ? err.message : "No se pudieron sincronizar las entregas desde Samsara.",
      });
    } finally {
      setIsSyncingDeliveries(false);
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<DepartureStatusFilter>("Pendiente");
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<"domicilio" | "sucursal">("domicilio");
  const [branchFilter, setBranchFilter] = useState<string>(cachedBranchFilter);

  useEffect(() => {
    cachedBranchFilter = branchFilter;
  }, [branchFilter]);

  const handleAuthorize = (id: string) => {
    const updated = departures.map(dep => {
      if (dep.id !== id) return dep;

      return {
        ...dep,
        status: "Escaneada" as ReadyDeparture["status"],
        invoices: dep.invoices.map(inv => ({
          ...inv,
          isScanned: true,
        })),
      };
    });

    setDepartures(updated);
    cachedDepartures = updated;
    window.setTimeout(() => {
      fetchDepartures(true);
    }, 800);
  };

  const handleDelivered = (id: string) => {
    const updated = departures.filter(dep => dep.id !== id);
    setDepartures(updated);
    cachedDepartures = updated;
    fetchDepartures(true);
  };

  const handleSendScannedInRouteManual = async (id: string) => {
    const departure = departures.find(dep => dep.id === id);
    const routeDocuments = getDepartureRouteDocuments(departure);
    const invoiceNums = routeDocuments
      .map(doc => doc.invoiceNum || (doc.documentType === "INVOICE" ? doc.documentNum : ""))
      .filter(Boolean);

    if (!departure || routeDocuments.length === 0) {
      throw new Error("No hay documentos escaneados para mandar en ruta.");
    }

    const response = await fetch("/api/logistics/mark-scanned-invoices-in-route-manual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceNums, routeDocuments }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || data?.error || "No se pudo mandar la carga escaneada en ruta.");
    }

    const updated = departures.map(dep => {
      if (dep.id !== id) return dep;

      return {
        ...dep,
        status: "En ruta" as ReadyDeparture["status"],
      };
    });

    setDepartures(updated);
    cachedDepartures = updated;
    window.setTimeout(() => {
      fetchDepartures(true);
    }, 600);
  };


  const handleReturnBranchPickupToRoutes = async (id: string) => {
    const departure = departures.find(dep => dep.id === id);
    const invoiceNums = departure?.invoices.map(inv => inv.id).filter(Boolean) || [];

    if (!departure || departure.deliveryType !== "sucursal" || invoiceNums.length === 0) {
      throw new Error("No hay facturas de sucursal para regresar a Rutas.");
    }

    const response = await fetch("/api/logistics/return-branch-pickup-to-routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceNums }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || data?.error || "No se pudo regresar la factura a Rutas.");
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(ROUTES_CACHE_BUST_STORAGE_KEY, String(Date.now()));
      window.dispatchEvent(new Event("logistics-routes-cache-bust"));
    }

    const updated = departures.filter(dep => dep.id !== id);
    setDepartures(updated);
    cachedDepartures = updated;
    window.setTimeout(() => {
      fetchDepartures(true);
    }, 600);
  };

  const handleReturnInvoiceToRoutes = async (document: RouteDocumentPayload) => {
    const response = await fetch("/api/logistics/return-document-to-routes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(document),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || data?.error || "No se pudo regresar el documento a Rutas.");
    }

    const documentKey = `${document.documentType}:${document.documentNum.trim()}`;
    setDepartures(prev => {
      const updated = prev
        .map(dep => {
          const removedIndex = dep.invoices.findIndex(inv => {
            const invDocument = toRouteDocumentPayload(inv);
            return invDocument && `${invDocument.documentType}:${invDocument.documentNum.trim()}` === documentKey;
          });
          if (removedIndex < 0) return dep;

          const remainingInvoices = dep.invoices.filter(inv => {
            const invDocument = toRouteDocumentPayload(inv);
            return !invDocument || `${invDocument.documentType}:${invDocument.documentNum.trim()}` !== documentKey;
          });
          const allRemainingHaveAmount = remainingInvoices.every(inv => typeof inv.amount === "number");
          const nextLocations = dep.locations.length === dep.invoices.length
            ? dep.locations.filter((_, index) => index !== removedIndex)
            : dep.locations;

          return {
            ...dep,
            invoices: remainingInvoices,
            locations: nextLocations,
            totalAmount: allRemainingHaveAmount
              ? remainingInvoices.reduce((total, inv) => total + (inv.amount || 0), 0)
              : dep.totalAmount,
          };
        })
        .filter(dep => dep.invoices.length > 0);

      cachedDepartures = updated;
      return updated;
    });

    if (typeof window !== "undefined") {
      window.localStorage.setItem(ROUTES_CACHE_BUST_STORAGE_KEY, String(Date.now()));
      window.dispatchEvent(new Event("logistics-routes-cache-bust"));
    }

    await new Promise<void>(resolve => window.requestAnimationFrame(() => resolve()));
    window.setTimeout(() => {
      fetchDepartures(true);
    }, 600);
  };
  const branchFilteredDepartures = departures.filter(dep => {
    if (branchFilter === "all") return true;
    return (dep.logisticsBranch || "").trim().toUpperCase() === branchFilter;
  });

  const filteredDepartures = branchFilteredDepartures.filter(dep =>
    dep.status === statusFilter &&
    dep.deliveryType === deliveryTypeFilter && (
      dep.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dep.unitName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dep.clientName && dep.clientName.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  );

  const pendingCount = branchFilteredDepartures.filter(d => d.status === "Pendiente" && d.deliveryType === deliveryTypeFilter).length;
  const scannedCount = branchFilteredDepartures.filter(d => d.status === "Escaneada" && d.deliveryType === deliveryTypeFilter).length;
  const enRutaCount = branchFilteredDepartures.filter(d => d.status === "En ruta" && d.deliveryType === deliveryTypeFilter).length;
  const statusOptions: Array<{ id: DepartureStatusFilter; label: string; count: number }> = [
    { id: "Pendiente", label: "Pendientes", count: pendingCount },
    { id: "Escaneada", label: "Escaneadas", count: scannedCount },
    ...(deliveryTypeFilter === "sucursal"
      ? []
      : [{ id: "En ruta" as DepartureStatusFilter, label: "En Ruta", count: enRutaCount }]),
  ];

  return (
    <div className="w-full flex flex-col gap-4 min-h-full pb-12 -mt-2 md:-mt-4">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
            Autorizar Salidas
          </h1>
          <div
            title={materialReviewAutoCreateEnabled ? "Documento automatico activo" : "Documento automatico inactivo"}
            className="inline-flex h-8 items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 text-[10px] font-black uppercase tracking-widest text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300"
          >
            <FileText className="size-3.5 text-slate-400 dark:text-slate-500" />
            <span>Documento</span>
            <span
              className={cn(
                "size-2.5 rounded-full shadow-sm",
                materialReviewAutoCreateEnabled
                  ? "bg-emerald-500 shadow-emerald-500/40"
                  : "bg-red-500 shadow-red-500/40"
              )}
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {deliveryTypeFilter === "domicilio" && statusFilter === "En ruta" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncMaterialDeliveries}
              disabled={isSyncingDeliveries || isRefreshing}
              className="h-9 rounded-xl font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900/70 dark:text-emerald-300 dark:hover:bg-emerald-950/30 transition-all shadow-sm"
            >
              <CheckCircle2 className={cn("size-3.5 mr-2", isSyncingDeliveries && "animate-pulse")} />
              Sincronizar entregas
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing || isSyncingDeliveries}
            className="h-9 rounded-xl font-bold border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-sm"
          >
            <RefreshCw className={cn("size-3.5 mr-2", isRefreshing && "animate-spin text-blue-500")} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Unified Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-4 md:gap-6 w-full bg-white/50 dark:bg-slate-900/40 py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* 1. Master Search Bar (Left) */}
        <div className="relative group w-full lg:w-auto lg:min-w-[320px] flex-1 max-w-md shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-slate-500 transition-colors pointer-events-none" />
          <Input
            type="text"
            placeholder="Buscar por chofer o unidad..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 h-10 text-xs focus-visible:ring-slate-500/20 shadow-sm transition-all placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* 2. Filters Group (Right) */}
        <div className="flex flex-wrap items-center gap-2.5 lg:gap-1.5 w-full lg:w-auto justify-between lg:justify-end">
          <LogisticsBranchFilter
            branchFilter={branchFilter}
            onBranchChange={setBranchFilter}
            className="h-8 w-full sm:w-auto justify-between"
          />

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden min-[1400px]:block"></div>

          {/* Delivery Type (Domicilio/Sucursal) */}
          <div className="flex items-center justify-center gap-1 bg-slate-100/50 dark:bg-[#1E293B] p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 h-9 w-full sm:w-auto shrink-0">
            {([
              { id: 'domicilio', label: 'Domicilio' },
              { id: 'sucursal', label: 'Sucursal' },
            ] as const).map((btn) => (
              <button
                key={btn.id}
                onClick={() => {
                  setDeliveryTypeFilter(btn.id);
                  if (btn.id === 'sucursal') {
                    setStatusFilter(prev => prev === 'En ruta' ? 'Pendiente' : prev);
                  }
                }}
                className={cn(
                  "flex-1 h-full px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap text-center flex items-center justify-center cursor-pointer border",
                  deliveryTypeFilter === btn.id
                    ? "bg-blue-100/70 text-blue-800 border-blue-300 shadow-sm dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40 hover:bg-blue-100 dark:hover:bg-blue-500/30"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-700 mx-1 hidden min-[1400px]:block"></div>

          {/* Status Filter (Pendientes/Escaneadas/En Ruta) */}
          <div className="flex items-center justify-center gap-1 bg-slate-100/50 dark:bg-[#1E293B] p-1 rounded-xl border border-slate-200/60 dark:border-slate-800 h-9 w-full sm:w-auto shrink-0">
            {statusOptions.map((status) => (
              <button
                key={status.id}
                onClick={() => setStatusFilter(status.id)}
                className={cn(
                  "flex-1 h-full px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer border",
                  statusFilter === status.id
                    ? "bg-blue-100/70 text-blue-800 border-blue-300 shadow-sm dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/40 hover:bg-blue-100 dark:hover:bg-blue-500/30"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {status.label}
                <span className={cn(
                  "px-1.5 py-0.5 rounded-md text-[9px] min-w-[1.2rem] text-center",
                  statusFilter === status.id
                    ? "bg-blue-200/60 dark:bg-blue-500/30 text-blue-800 dark:text-blue-200"
                    : "bg-slate-200 dark:bg-slate-800 text-slate-500"
                )}>
                  {status.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Section */}
      <div className="flex-1 mt-1">
        {filteredDepartures.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400 w-full">
            <CheckCircle2 className="size-12 mb-4 text-emerald-500 opacity-50" />
            <p className="text-lg font-medium">
              {statusFilter === "Pendiente"
                ? "No hay salidas pendientes"
                : statusFilter === "Escaneada"
                  ? "No hay cargas escaneadas"
                  : deliveryTypeFilter === "sucursal"
                    ? "No hay recolecciones autorizadas actualmente"
                    : "No hay unidades en ruta actualmente"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(360px,1fr))] gap-6 auto-rows-max">
            {filteredDepartures.map((dep) => (
              <DepartureCard
                key={dep.id}
                departure={dep}
                onAuthorize={handleAuthorize}
                onDelivered={handleDelivered}
                onSendScannedInRouteManual={handleSendScannedInRouteManual}
                onReturnToRoutes={handleReturnBranchPickupToRoutes}
                onReturnInvoiceToRoutes={handleReturnInvoiceToRoutes}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
