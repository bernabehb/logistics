"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DEPARTURE_DRIVERS, ALL_TRIPS } from "@/features/admin/models/departureDrivers";
import { StatsCard } from "@/features/admin/components/StatsCard";
import { AnalyticsCharts } from "@/features/admin/components/AnalyticsCharts";
import {
  ChevronLeft, ChevronRight, Truck, CheckCircle2, Clock3,
  X, MapPin, ChevronDown, ChevronUp, FileText, AlertCircle, Package, Search, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface Material {
  name: string;
  quantity: string;
}

interface MaterialGroup {
  warehouse: string;
  materials: Material[];
}

type InvoiceStatus = "delivered" | "in-progress" | "pending";

type FlatInvoice = {
  id: string; // Internal unique ID for the row
  invoiceId: string;
  clientName: string;
  address: string;
  block: string;
  date: string;
  deliveryDate?: string;
  status: InvoiceStatus;
  groups: MaterialGroup[]; 
};

const STATUS_FILTERS: { value: string; label: string; icon: React.ElementType }[] = [
  { value: "all",         label: "Todos",      icon: Package },
  { value: "in-progress", label: "En ruta",    icon: Clock3 },
  { value: "delivered",   label: "Entregados", icon: CheckCircle2 },
  { value: "pending",     label: "Pendientes", icon: AlertCircle },
];

const STATUS_BADGE: Record<InvoiceStatus, { label: string; icon: React.ElementType; cls: string }> = {
  delivered:    { label: "Entregado", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" },
  "in-progress":{ label: "En ruta",  icon: Clock3,        cls: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  pending:      { label: "Pendiente",icon: AlertCircle,   cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" },
};

const WAREHOUSE_COLOR: Record<string, string> = {
  Aluminio: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  Vidrio:   "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
  Herrajes: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
};

const ROWS_PER_PAGE = 11;

// Deterministic mock price generator based on string hash
const getUnitPrice = (name: string): number => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return (Math.abs(hash) % 900) + 100;
};

// ─── Child Component: Invoice Row ──────────────────────────────────────────
function InvoiceRow({ inv }: { inv: FlatInvoice & { index?: number } }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_BADGE[inv.status];
  const Icon = cfg.icon;

  return (
    <>
      <tr
        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <td className="px-4 py-3.5">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tabular-nums">
            {inv.index?.toString().padStart(2, '0') ?? "—"}
          </span>
        </td>
        <td className="px-4 py-3.5">
          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono text-[13px]">
            {inv.invoiceId}
          </span>
        </td>
        <td className="px-4 py-3.5">
          <span className="font-medium text-slate-700 dark:text-slate-300">{inv.clientName}</span>
        </td>
        <td className="px-4 py-3.5">
          <span className="text-[12px] text-slate-500 dark:text-slate-400">{inv.address}</span>
        </td>
        <td className="px-4 py-3.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 whitespace-nowrap">
            {inv.block}
          </span>
        </td>
        <td className="px-4 py-3.5 whitespace-nowrap">
          <div className="flex flex-col">
            <span className="text-slate-700 dark:text-slate-300 font-medium text-[12px]">
              {format(parseISO(inv.date), "d MMM yyyy", { locale: es })}
            </span>
            <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold">
              {getStableTime(inv.invoiceId)}
            </span>
          </div>
        </td>
        <td className="px-4 py-3.5 whitespace-nowrap">
          <div className="flex flex-col">
            {inv.status === "delivered" && inv.deliveryDate ? (
              <>
                <span className="text-slate-700 dark:text-slate-300 font-medium text-[12px]">
                  {format(parseISO(inv.deliveryDate), "d MMM yyyy", { locale: es })}
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  {format(parseISO(inv.deliveryDate), "h:mm a").toUpperCase()}
                </span>
              </>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 text-[12px] font-medium">—</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3.5">
          <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border", cfg.cls)}>
            <Icon className="w-3 h-3" />
            {cfg.label}
          </span>
        </td>
        <td className="px-4 py-3.5 text-right pr-6">
          <div className="flex items-center justify-end text-slate-400">
            {inv.groups.length > 0 ? (
              open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
            ) : (
              <span className="text-[10px] uppercase font-bold opacity-30 tracking-tighter">Sin detalle</span>
            )}
          </div>
        </td>
      </tr>

      {open && inv.groups.length > 0 && (
        <tr className="bg-slate-50/80 dark:bg-slate-800/30">
          <td colSpan={9} className="px-4 pb-4 pt-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-[#1E293B] shadow-sm">
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {inv.groups.map((group: MaterialGroup, gi: number) => (
                  <div key={gi} className="px-4 py-3">
                    <div className="mb-3">
                      <span className={cn("inline-block text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md", WAREHOUSE_COLOR[group.warehouse] ?? "bg-slate-100 text-slate-600")}>
                        {group.warehouse}
                      </span>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
                      <table className="w-full text-left text-[13px] table-fixed">
                        <colgroup>
                          <col className="w-[50%]" />
                          <col className="w-[15%]" />
                          <col className="w-[15%]" />
                          <col className="w-[20%]" />
                        </colgroup>
                        <thead className="bg-slate-100/50 dark:bg-slate-800/80 border-b border-slate-100 dark:border-slate-700/50">
                          <tr>
                            <th className="py-2 px-4 font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Material</th>
                            <th className="py-2 px-4 font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center">Cantidad</th>
                            <th className="py-2 px-4 font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Precio Unit.</th>
                            <th className="py-2 px-4 font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {group.materials.map((mat: Material, mi: number) => {
                            const qtyMatch = mat.quantity.match(/(\d+)/);
                            const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;
                            const unitPrice = mat.name ? getUnitPrice(mat.name) : 1500;
                            const subtotal = qty * unitPrice;
                            
                            return (
                              <tr key={mi} className="hover:bg-white dark:hover:bg-slate-800/60 transition-colors">
                                <td className="py-2.5 px-4 text-slate-700 dark:text-slate-300 font-medium">{mat.name}</td>
                                <td className="py-2.5 px-4 text-center text-slate-500 dark:text-slate-400 font-bold whitespace-nowrap">{mat.quantity}</td>
                                <td className="py-2.5 px-4 text-right text-slate-500 dark:text-slate-400">${unitPrice.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                <td className="py-2.5 px-4 text-right text-slate-700 dark:text-slate-300 font-bold">${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="bg-slate-50/50 dark:bg-slate-800/60 border-t border-slate-200 dark:border-slate-700">
                          <tr>
                            <td colSpan={3} className="py-2.5 px-4 font-bold text-right text-[11px] uppercase tracking-widest text-slate-500 dark:text-slate-400">Total {group.warehouse}</td>
                            <td className="py-2.5 px-4 font-black text-right text-emerald-600 dark:text-emerald-400">
                              ${group.materials.reduce((acc: number, m: Material) => {
                                const qMatch = m.quantity.match(/(\d+)/);
                                const q = qMatch ? parseInt(qMatch[1], 10) : 1;
                                return acc + (q * (m.name ? getUnitPrice(m.name) : 1500));
                              }, 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                ))}

                {/* GRAND TOTAL INVOICE */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-end gap-6">
                   <span className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-widest">Total del Pedido</span>
                   <span className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                     ${inv.groups.reduce((accGroup: number, group: MaterialGroup) => 
                        accGroup + group.materials.reduce((accMat: number, m: Material) => {
                          const qMatch = m.quantity.match(/(\d+)/);
                          const q = qMatch ? parseInt(qMatch[1], 10) : 1;
                          return accMat + (q * (m.name ? getUnitPrice(m.name) : 1500));
                        }, 0)
                     , 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                   </span>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Page Component ─────────────────────────────────────────────────────
export default function DriverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const driverId = params.driverId as string;
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage]   = useState(1);
  const [searchQuery, setSearchQuery]   = useState("");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");
  const [isMobile, setIsMobile]         = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const entry = DEPARTURE_DRIVERS.find((e) => e.driver.id === driverId);

  if (!entry) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Package className="w-12 h-12 text-slate-300 dark:text-slate-600" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">Chofer no encontrado</p>
        <Button variant="outline" onClick={() => router.push("/admin")} className="rounded-xl">Volver al panel</Button>
      </div>
    );
  }

  const { driver, invoiceStats } = entry;

  // Flatten all invoices for this driver
  const allInvoices: FlatInvoice[] = useMemo(() => {
    // 1. Historical from deliveries.json
    const historical = ALL_TRIPS
      .filter((t) => t.driverId === driverId)
      .flatMap((t) => t.invoices.map((inv) => ({
        id: `${t.id}-${inv.id}`,
        invoiceId: inv.id,
        clientName: t.clientName,
        address: t.address,
        block: (t as any).block || "S/A",
        date: t.date,
        deliveryDate: (t as any).deliveryDate,
        status: "delivered" as InvoiceStatus,
        groups: inv.groups,
      })));

    // 2. Currently active/pending from departures.json
    // Use the "-active-" ID prefix to avoid double counting historical ones
    const active = entry.deliveries
      .filter((d) => d.id.includes("-active-"))
      .map((d) => {
        // Find the original invoice object in the departure record to get the groups (materials)
        const departureRecord = (entry.driver as any).rawDeparture; // I should add this to departureDrivers.ts entry
        // Wait, DEPARTURE_DRIVERS entry doesn't have rawDeparture. 
        // Let's check how activeDeliveries is built in models/departureDrivers.ts
        return {
          id: d.id,
          invoiceId: d.orderId,
          clientName: d.clientName,
          address: d.address,
          block: (d as any).block || "S/A",
          date: d.date,
          deliveryDate: (d as any).deliveryDate,
          status: d.status as InvoiceStatus,
          groups: (d as any).groups || [], // Ensure groups are passed through in the model
        };
      });

    return [...active, ...historical].sort((a, b) => b.date.localeCompare(a.date));
  }, [driverId, entry.deliveries]);

  const filteredInvoices = useMemo(() => {
    let result = allInvoices;

    // 1. Status Filter
    if (statusFilter !== "all") {
      result = result.filter((i) => i.status === statusFilter);
    }

    // 2. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) => 
        r.invoiceId.toLowerCase().includes(q) ||
        r.clientName.toLowerCase().includes(q)
      );
    }

    // 3. Date Range Filter
    if (dateFrom) result = result.filter((r) => r.date >= dateFrom);
    if (dateTo) result = result.filter((r) => r.date <= dateTo);

    return result;
  }, [allInvoices, statusFilter, searchQuery, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filteredInvoices.length / ROWS_PER_PAGE));
  const safePage   = Math.min(currentPage, totalPages);
  const pagedRows  = filteredInvoices.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  const isEnRuta = invoiceStats.activeInvoices > 0;

  return (
    <div className="flex flex-col gap-6 pb-2">
      {/* Breadcrumb */}
      <button
        onClick={() => router.push("/admin")}
        className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium -mb-2 w-fit"
      >
        <ChevronLeft className="w-4 h-4" />
        Panel de Administrador
      </button>

      {/* Driver Header & KPIs */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
        {/* Driver Header */}
        <div className="xl:col-span-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className={cn("flex items-center justify-center w-14 h-14 rounded-2xl font-bold text-xl flex-shrink-0 shadow-inner", driver.color)}>
            {driver.initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">{driver.name}</h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <Truck className="w-3.5 h-3.5" />
              <span>{driver.licensePlate}</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {invoiceStats.activeInvoices > 0 ? (
              <span className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50">
                ● En ruta
              </span>
            ) : invoiceStats.pendingInvoices > 0 ? (
              <span className="flex-shrink-0 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-100 dark:border-amber-800/50">
                ● Pendiente
              </span>
            ) : (
              <span className="flex-shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest shadow-sm transition-all duration-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                Disponible
              </span>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatsCard 
            label="Fact. entregadas" 
            value={invoiceStats.deliveredInvoices} 
            icon={CheckCircle2} 
            iconCls="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
          />
          <StatsCard 
            label="Fact. en ruta"    
            value={invoiceStats.activeInvoices}    
            icon={Clock3}       
            iconCls="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
          />
          <StatsCard 
            label="Fact. pendientes" 
            value={invoiceStats.pendingInvoices}   
            icon={AlertCircle}  
            iconCls="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
          />
        </div>
      </div>

      {/* Analytics Section */}
      <AnalyticsCharts invoices={allInvoices} getStableTime={getStableTime} driverId={driverId} />

      {/* Filters and Search Area */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Status Chips */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_FILTERS.map(({ value, label, icon: Icon }) => {
            const isActive = statusFilter === value;
            if (value === "pending" && invoiceStats.pendingInvoices === 0) return null;
            return (
              <button
                key={value}
                onClick={() => { setStatusFilter(value); setCurrentPage(1); }}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  isActive
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            );
          })}
        </div>

        {/* Search and Date Range */}
        <div className="flex flex-col min-[900px]:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full min-[900px]:w-64 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar por factura o cliente..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-700 dark:text-slate-300"
            />
          </div>
          <div className="flex items-center gap-2 w-full min-[900px]:w-auto">
            <div className="relative flex-1 min-w-[130px] min-[900px]:w-36">
              <input 
                type="date"
                title="Desde"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-500 dark:text-slate-400 dark:[color-scheme:dark] cursor-pointer"
              />
            </div>
            <span className="text-slate-400 text-sm font-medium">al</span>
            <div className="relative flex-1 min-w-[130px] min-[900px]:w-36">
              <input 
                type="date"
                title="Hasta"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-500 dark:text-slate-400 dark:[color-scheme:dark] cursor-pointer"
              />
            </div>
            {(statusFilter !== "all" || searchQuery || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setSearchQuery("");
                  setDateFrom("");
                  setDateTo("");
                  setCurrentPage(1);
                }}
                className="p-2 ml-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors rounded-xl flex-shrink-0"
                title="Limpiar filtros"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
            Historial de facturas
            <span className="ml-2 text-sm font-normal text-slate-400">({filteredInvoices.length} resultados)</span>
          </h2>
          {totalPages > 1 && (
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Página {safePage} de {totalPages}
            </span>
          )}
        </div>

        <div className="overflow-x-auto no-scrollbar rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] shadow-sm">
          <table className="w-full text-sm min-w-[1300px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#1E293B]/60">
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 w-12">#</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Factura</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Cliente</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Dirección</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Bloque</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Fecha de Factura</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">Fecha de Entrega</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600 dark:text-slate-400">Estado</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 dark:text-slate-400 pr-6">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {pagedRows.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-slate-400 font-medium">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
                  <p>No se encontraron facturas con este filtro</p>
                </td></tr>
              ) : pagedRows.map((inv, i) => {
                const globalIndex = (safePage - 1) * ROWS_PER_PAGE + i + 1;
                return (
                  <InvoiceRow 
                    key={inv.id} 
                    inv={{...inv, index: globalIndex} as any} 
                  />
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6 mb-2">
            <Button
              variant="outline" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded-xl h-9 px-3 sm:px-4 font-bold text-xs bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800"
            >
              <ChevronLeft className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>

            <div className="flex items-center gap-1 text-xs font-black">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => {
                  if (!isMobile || totalPages <= 5) return true;
                  if (p === 1 || p === totalPages) return true;
                  return Math.abs(p - safePage) <= 1;
                })
                .map((p, i, arr) => (
                  <div key={p} className="flex items-center gap-1">
                    {isMobile && i > 0 && p - arr[i-1] > 1 && (
                      <span className="px-1 text-slate-400">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(p)}
                      className={cn("w-9 h-9 rounded-xl transition-all shadow-sm border",
                        p === safePage 
                          ? "bg-blue-600 text-white border-blue-600 shadow-blue-100 dark:shadow-none" 
                          : "bg-white dark:bg-[#1E293B] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                      )}
                    >
                      {p}
                    </button>
                  </div>
                ))}
            </div>

            <Button
              variant="outline"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded-xl h-9 px-3 sm:px-4 font-bold text-xs bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800"
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4 sm:ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
