"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { DEPARTURE_DRIVERS, ALL_TRIPS } from "@/features/admin/models/departureDrivers";
import { DriverCard } from "@/features/admin/components/DriverCard";
import {
  Truck, Package, MapPin, AlertCircle,
  CheckCircle2, Clock3, ChevronLeft, ChevronRight, ShieldCheck, Search, Calendar, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getStableTime(id: string) {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const slots = [9, 11, 14];
  const hour = slots[hash % slots.length].toString().padStart(2, '0');
  const minutes = (hash % 16).toString().padStart(2, '0');
  return `${hour}:${minutes}`;
}

// ─── Flat invoice row type ───────────────────────────────────────────────────
type InvoiceStatus = "delivered" | "in-progress" | "pending";

type FlatInvoice = {
  invoiceId: string;
  driverId: string;
  driverName: string;
  clientName: string;
  address: string;
  block: string;
  date: string;
  deliveryDate?: string;
  status: InvoiceStatus;
};

// From deliveries.json — one row per invoice (all "delivered")
const historicalRows: FlatInvoice[] = ALL_TRIPS.flatMap((trip) =>
  trip.invoices.map((inv) => ({
    invoiceId: inv.id,
    driverId: trip.driverId,
    driverName: trip.driverName,
    clientName: trip.clientName,
    address: trip.address,
    block: (trip as any).block || "S/A",
    date: trip.date,
    deliveryDate: (trip as any).deliveryDate,
    status: "delivered" as InvoiceStatus,
  }))
);

// From departures — one row per active/pending delivery (already one per invoice in departures)
const departureRows: FlatInvoice[] = DEPARTURE_DRIVERS.flatMap(({ driver, deliveries }) =>
  deliveries
    .filter((d) => d.id.includes("-active-"))
    .map((d) => ({
      invoiceId: d.orderId,
      driverId: driver.id,
      driverName: driver.name,
      clientName: d.clientName,
      address: d.address,
      block: (d as any).block || "S/A",
      date: d.date,
      deliveryDate: (d as any).deliveryDate,
      status: d.status as InvoiceStatus,
    }))
);

const ALL_INVOICES: FlatInvoice[] = [...historicalRows, ...departureRows].sort(
  (a, b) => b.date.localeCompare(a.date)
);

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<InvoiceStatus, { label: string; icon: React.ElementType; cls: string }> = {
  delivered:    { label: "Entregado", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" },
  "in-progress":{ label: "En ruta",  icon: Clock3,        cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  pending:      { label: "Pendiente",icon: AlertCircle,   cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" },
};

type FilterStatus = "todos" | "delivered" | "in-progress" | "pending";

const ROWS_PER_PAGE  = 10;

export default function AdminDashboardPage() {
  const [filter, setFilter]           = useState<FilterStatus>("todos");
  const [driverPage, setDriverPage]   = useState(0);
  const [tablePage, setTablePage]     = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom]       = useState("");
  const [dateTo, setDateTo]           = useState("");

  // Stat counts
  const totalCount     = ALL_INVOICES.length;
  const enRutaCount    = ALL_INVOICES.filter((r) => r.status === "in-progress").length;
  const pendienteCount = ALL_INVOICES.filter((r) => r.status === "pending").length;

  // Dynamic cards per page based on container width
  const carouselRef = useRef<HTMLDivElement>(null);
  const [cardsPerPage, setCardsPerPage] = useState(4);

  const [isMobile, setIsMobile] = useState(false);

  const updateCardsPerPage = useCallback(() => {
    if (!carouselRef.current) return;
    const w = carouselRef.current.offsetWidth;
    setIsMobile(w < 640);
    if (w >= 1536) setCardsPerPage(4);       // 2xl
    else if (w >= 900) setCardsPerPage(3);    // ~lg
    else if (w >= 580) setCardsPerPage(2);    // ~sm
    else setCardsPerPage(1);
  }, []);

  useEffect(() => {
    updateCardsPerPage();
    const ro = new ResizeObserver(updateCardsPerPage);
    if (carouselRef.current) ro.observe(carouselRef.current);
    return () => ro.disconnect();
  }, [updateCardsPerPage]);

  // Driver carousel (page-based)
  const totalDriverPages = Math.ceil(DEPARTURE_DRIVERS.length / cardsPerPage);
  const safeDriverPage   = Math.min(driverPage, totalDriverPages - 1);
  const visibleDrivers   = DEPARTURE_DRIVERS.slice(
    safeDriverPage * cardsPerPage,
    (safeDriverPage + 1) * cardsPerPage
  );

  // Table
  const filteredInvoices = useMemo(() => {
    let result = ALL_INVOICES;

    // 1. Status Filter
    if (filter !== "todos") {
      result = result.filter((r) => r.status === filter);
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => 
        r.invoiceId.toLowerCase().includes(q) ||
        r.clientName.toLowerCase().includes(q) ||
        r.driverName.toLowerCase().includes(q)
      );
    }

    // 3. Date Range Filter
    if (dateFrom) result = result.filter((r) => r.date >= dateFrom);
    if (dateTo) result = result.filter((r) => r.date <= dateTo);

    return result;
  }, [filter, searchQuery, dateFrom, dateTo]);

  const totalTablePages = Math.max(1, Math.ceil(filteredInvoices.length / ROWS_PER_PAGE));
  const safeTablePage   = Math.min(tablePage, totalTablePages);
  const pagedRows       = filteredInvoices.slice((safeTablePage - 1) * ROWS_PER_PAGE, safeTablePage * ROWS_PER_PAGE);

  const statCards = [
    { key: "todos"       as FilterStatus, value: totalCount,     label: "Total Facturas",  icon: Package,      activeColor: "border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-500/10",     activeNum: "text-blue-600 dark:text-blue-400"    },
    { key: "in-progress" as FilterStatus, value: enRutaCount,    label: "En Ruta",         icon: Truck,        activeColor: "border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-500/10",    activeNum: "text-blue-600 dark:text-blue-400"    },
    { key: "pending"     as FilterStatus, value: pendienteCount, label: "Pendientes",      icon: AlertCircle,  activeColor: "border-amber-400 dark:border-amber-500 bg-amber-50 dark:bg-amber-500/10", activeNum: "text-amber-600 dark:text-amber-400"  },
  ];

  return (
    <div className="w-full flex flex-col gap-6 pb-12 -mt-2 md:-mt-4">

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30">
          <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Panel de Administrador</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Control y seguimiento de choferes y entregas</p>
        </div>
      </div>

      {/* 3 Stat Cards */}
      <div className="flex gap-3 flex-wrap">
        {statCards.map((card) => {
          const isActive = filter === card.key;
          const Icon = card.icon;
          return (
            <button
              key={card.key}
              onClick={() => { setFilter(card.key); setTablePage(1); }}
              className={cn(
                "flex items-center gap-4 px-5 py-3.5 rounded-xl border transition-all duration-200 bg-white dark:bg-[#1E293B] shadow-sm hover:shadow-md",
                isActive ? card.activeColor : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              )}
            >
              <div className={cn("flex items-center justify-center w-9 h-9 rounded-lg", isActive ? "bg-white/50 dark:bg-white/10" : "bg-slate-100 dark:bg-slate-700/60")}>
                <Icon className={cn("w-5 h-5", isActive ? "text-current" : "text-slate-500 dark:text-slate-400")} />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide leading-none mb-1">{card.label}</p>
                <p className={cn("text-2xl font-black leading-none", isActive ? card.activeNum : "text-slate-700 dark:text-slate-300")}>{card.value}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Driver Carousel */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Todos los choferes
            <span className="ml-2 text-sm font-normal text-slate-400">({DEPARTURE_DRIVERS.length})</span>
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setDriverPage((p) => Math.max(0, p - 1))}
              disabled={safeDriverPage === 0}
              className={cn("flex items-center justify-center w-8 h-8 rounded-lg border transition-all",
                safeDriverPage === 0 ? "border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                  : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")}
            ><ChevronLeft className="w-4 h-4" /></button>
            <button
              onClick={() => setDriverPage((p) => Math.min(totalDriverPages - 1, p + 1))}
              disabled={safeDriverPage >= totalDriverPages - 1}
              className={cn("flex items-center justify-center w-8 h-8 rounded-lg border transition-all",
                safeDriverPage >= totalDriverPages - 1 ? "border-slate-200 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed"
                  : "border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800")}
            ><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
        <div ref={carouselRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 min-h-[160px]">
          {visibleDrivers.map(({ driver, deliveries, invoiceStats }) => (
            <DriverCard key={driver.id} driver={driver} deliveries={deliveries} invoiceStats={invoiceStats} />
          ))}
        </div>
      </div>

      {/* Invoices Table — one row per factura */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Historial de entregas
            <span className="ml-2 text-sm font-normal text-slate-400">({filteredInvoices.length} facturas)</span>
          </h2>
          {totalTablePages > 1 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">Página {safeTablePage} de {totalTablePages}</span>
          )}
        </div>

        {/* Filters Area */}
        <div className="flex flex-col md:flex-row items-center gap-3 mb-4">
          <div className="relative w-full md:w-80 lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por factura, cliente o chofer..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setTablePage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-700 dark:text-slate-300"
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 min-w-[130px] md:w-36">
              <input 
                type="date"
                title="Desde"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setTablePage(1); }}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-500 dark:text-slate-400 dark:[color-scheme:dark] cursor-pointer"
              />
            </div>
            <span className="text-slate-400 text-sm font-medium">al</span>
            <div className="relative flex-1 min-w-[130px] md:w-36">
              <input 
                type="date"
                title="Hasta"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setTablePage(1); }}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-500 dark:text-slate-400 dark:[color-scheme:dark] cursor-pointer"
              />
            </div>
            {(searchQuery || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDateFrom("");
                  setDateTo("");
                  setTablePage(1);
                }}
                className="p-2 ml-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0"
                title="Limpiar filtros"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] shadow-sm">
          <table className="w-full text-sm min-w-[1300px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B]/80">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 w-12">#</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Factura</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Chofer</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Dirección</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Bloque</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Fecha de Factura</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Fecha de Entrega</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pagedRows.length === 0 ? (
                <tr><td colSpan={7} className="py-16 text-center text-slate-400 dark:text-slate-500">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm font-medium">No hay facturas registradas</p>
                </td></tr>
              ) : pagedRows.map((row, i) => {
                const cfg = STATUS_CONFIG[row.status];
                const Icon = cfg.icon;
                const globalIndex = (safeTablePage - 1) * ROWS_PER_PAGE + i + 1;
                return (
                  <tr key={`${row.invoiceId}-${i}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">
                        {globalIndex.toString().padStart(2, '0')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[13px]">{row.invoiceId}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{row.driverName}</span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="text-slate-600 dark:text-slate-400">{row.clientName}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[12px] text-slate-500 dark:text-slate-400">{row.address}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 whitespace-nowrap">
                        {row.block}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-slate-700 dark:text-slate-300 font-medium text-[12px]">
                          {format(parseISO(row.date), "d MMM yyyy", { locale: es })}
                        </span>
                        <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">
                          {getStableTime(row.invoiceId)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col">
                        {row.status === "delivered" && row.deliveryDate ? (
                          <>
                            <span className="text-slate-700 dark:text-slate-300 font-medium text-[12px]">
                              {format(parseISO(row.deliveryDate), "d MMM yyyy", { locale: es })}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                              {format(parseISO(row.deliveryDate), "h:mm a").toUpperCase()}
                            </span>
                          </>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[12px] font-medium">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border", cfg.cls)}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalTablePages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setTablePage((p) => Math.max(1, p - 1))}
              disabled={safeTablePage === 1}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm",
                safeTablePage === 1 ? "border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/50"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800")}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalTablePages }, (_, i) => i + 1)
                .filter(p => {
                  if (!isMobile || totalTablePages <= 5) return true;
                  if (p === 1 || p === totalTablePages) return true;
                  return Math.abs(p - safeTablePage) <= 1;
                })
                .map((page, i, arr) => (
                  <div key={page} className="flex items-center gap-1">
                    {isMobile && i > 0 && page - arr[i-1] > 1 && (
                      <span className="px-1 text-slate-400">...</span>
                    )}
                    <button
                      onClick={() => setTablePage(page)}
                      className={cn("w-9 h-9 rounded-xl text-xs font-bold transition-all shadow-sm",
                        page === safeTablePage ? "bg-blue-600 text-white shadow-blue-200 dark:shadow-none"
                          : "text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800")}
                    >
                      {page}
                    </button>
                  </div>
                ))}
            </div>

            <button
              onClick={() => setTablePage((p) => Math.min(totalTablePages, p + 1))}
              disabled={safeTablePage === totalTablePages}
              className={cn("flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all shadow-sm",
                safeTablePage === totalTablePages ? "border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 cursor-not-allowed bg-slate-50/50 dark:bg-slate-900/50"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-[#1E293B] hover:bg-slate-50 dark:hover:bg-slate-800")}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
