"use client";

import React, { useState, useMemo } from "react";
import { Search, CheckCircle2, User, ChevronDown, Check, ReceiptText, Pencil, Trash2, FileX, FileCheck, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Types tailored for a granular invoice-level reconciliation
type CajasInvoice = {
  id: string;
  clientName: string;
  address: string;
  totalAmount: number;
  paymentMethod: "efectivo" | "credito" | "transferencia";
  status: "pendiente" | "entregado";
  isScanned: boolean;
};

type CajasDriver = {
  id: string;
  driverName: string;
  invoices: CajasInvoice[];
  status: "pendiente" | "entregado";
  date: string;
};

const MOCK_DRIVERS: CajasDriver[] = [
  {
    id: "drv-1",
    driverName: "Juan Pérez",
    status: "pendiente",
    date: "2024-04-06",
    invoices: [
      { id: "INV-1001", clientName: "Efrén Juárez Castillo", address: "Av. Benito Juárez #450, Centro", totalAmount: 1560.5, paymentMethod: "efectivo", status: "pendiente", isScanned: true },
      { id: "INV-1002", clientName: "Ricardo García Morales", address: "Blvd. Luis Donaldo Colosio #1200", totalAmount: 4200.0, paymentMethod: "credito", status: "pendiente", isScanned: true },
      { id: "INV-1003", clientName: "Gadiel Ramos Hernández", address: "Calle Francisco Madero #23", totalAmount: 890.0, paymentMethod: "efectivo", status: "pendiente", isScanned: true },
    ],
  },
  {
    id: "drv-2",
    driverName: "Carlos López",
    status: "pendiente",
    date: "2024-04-07",
    invoices: [
      { id: "INV-1004", clientName: "Juvencio Mendoza Castelán", address: "Calle Pino Suárez Norte #1010", totalAmount: 3250.0, paymentMethod: "transferencia", status: "entregado", isScanned: true },
      { id: "INV-1005", clientName: "Luis Alberto Mendoza San Juan", address: "Av. Universidad #80", totalAmount: 640.0, paymentMethod: "efectivo", status: "pendiente", isScanned: false },
    ],
  },
  {
    id: "drv-3",
    driverName: "Miguel Sánchez",
    status: "entregado",
    date: "2024-04-07",
    invoices: [
      { id: "INV-1008", clientName: "Hermes Salazar Casanova", address: "Colonia Las Fuentes #241", totalAmount: 1200.0, paymentMethod: "efectivo", status: "entregado", isScanned: true },
      { id: "INV-1009", clientName: " Carlos Andrés Rodríguez Arguelles", address: "Av. 20 de Noviembre #500", totalAmount: 580.0, paymentMethod: "efectivo", status: "entregado", isScanned: true },
    ],
  },
];

const formatCurrency = (val: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(val);

export default function CajasPage() {
  const [driversData, setDriversData] = useState<CajasDriver[]>(MOCK_DRIVERS);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState<"pendiente" | "entregado">("pendiente");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [editingDrivers, setEditingDrivers] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const toggleEditing = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingDrivers((prev) => {
      const newEditing = new Set(prev);
      if (newEditing.has(id)) newEditing.delete(id);
      else newEditing.add(id);
      return newEditing;
    });
  };

  const handleReconcileInvoice = (driverId: string, invoiceId: string) => {
    setDriversData((prev) =>
      prev.map((drv) => {
        if (drv.id !== driverId) return drv;
        const updatedInvoices = drv.invoices.map((inv) =>
          inv.id === invoiceId ? { ...inv, status: "entregado" as const } : inv
        );
        const allCashReceived = updatedInvoices.every(
          (inv) => inv.paymentMethod !== "efectivo" || inv.status === "entregado"
        );
        return {
          ...drv,
          status: allCashReceived ? ("entregado" as const) : ("pendiente" as const),
          invoices: updatedInvoices,
        };
      })
    );
  };

  const handleRevertInvoice = (driverId: string, invoiceId: string) => {
    setDriversData((prev) =>
      prev.map((drv) => {
        if (drv.id !== driverId) return drv;
        const updatedInvoices = drv.invoices.map((inv) =>
          inv.id === invoiceId ? { ...inv, status: "pendiente" as const } : inv
        );
        return {
          ...drv,
          status: "pendiente" as const,
          invoices: updatedInvoices,
        };
      })
    );
  };

  const handleRemoveInvoice = (driverId: string, invoiceId: string) => {
    setDriversData((prev) => {
      const updated = prev.map((drv) => {
        if (drv.id === driverId) {
          const updatedInvoices = drv.invoices.filter((inv) => inv.id !== invoiceId);
          const allCashReceived = updatedInvoices.every(
            (inv) => inv.paymentMethod !== "efectivo" || inv.status === "entregado"
          );
          return {
            ...drv,
            status: allCashReceived ? ("entregado" as const) : ("pendiente" as const),
            invoices: updatedInvoices,
          };
        }
        return drv;
      });
      return updated.filter((drv) => drv.invoices.length > 0);
    });
  };

  // Filter drivers by search + active status filter
  const filteredDrivers = driversData
    .map((drv) => {
      const matchSearch =
        drv.driverName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        drv.invoices.some((inv) => inv.id.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchDate = 
        (!dateFrom || drv.date >= dateFrom) &&
        (!dateTo || drv.date <= dateTo);
      return matchSearch && matchDate && drv.status === statusFilter ? drv : null;
    })
    .filter((drv): drv is CajasDriver => drv !== null);

  // Global metrics for the filter badges
  const totalPending = driversData.filter(d => d.status === "pendiente").length;
  const totalEntregado = driversData.filter(d => d.status === "entregado").length;

  return (
    <div className="w-full flex flex-col gap-4 min-h-full pb-12 -mt-2 md:-mt-4">
      {/* Header Section */}
      <div className="flex flex-col gap-4 transition-all w-full">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
          Cajas
        </h1>
        <div className="flex flex-col md:flex-row flex-wrap justify-between items-start md:items-center gap-4 w-full">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:flex-1">
            <div className="relative group w-full md:max-w-[360px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-slate-500 transition-colors pointer-events-none" />
              <Input
                type="text"
                placeholder="Buscar por chofer o factura..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                className="w-full bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 h-11 text-sm focus-visible:ring-slate-500/20 shadow-sm transition-all placeholder:text-slate-400 font-medium"
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-40 h-11">
                <Input 
                  type="date"
                  placeholder="Desde"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-full bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 rounded-2xl px-4 text-sm focus-visible:ring-slate-500/20 shadow-sm transition-all [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
              <span className="text-slate-400 text-sm font-medium">al</span>
              <div className="relative flex-1 md:w-40 h-11">
                <Input 
                  type="date"
                  placeholder="Hasta"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-full bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 rounded-2xl px-4 text-sm focus-visible:ring-slate-500/20 shadow-sm transition-all [color-scheme:light] dark:[color-scheme:dark]"
                />
              </div>
            </div>
            {(searchQuery || dateFrom || dateTo) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 flex-shrink-0"
                title="Limpiar filtros"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

        {/* Filters */}
        <div className="flex items-center overflow-x-auto w-full xl:w-auto pb-1 xl:pb-0 hide-scrollbar">
          <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-[#1E293B] p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 h-11 transition-all shrink-0">
            <Button
              variant="ghost"
              onClick={() => setStatusFilter("pendiente")}
              className={cn(
                "h-auto px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
                statusFilter === "pendiente"
                  ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-md ring-1 ring-slate-200 dark:ring-slate-600 scale-105 z-10 hover:bg-white dark:hover:bg-slate-700"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-transparent"
              )}
            >
              Pendientes
              <span
                className={cn(
                  "px-2 py-0.5 rounded-md text-[10px]",
                  statusFilter === "pendiente"
                    ? "bg-slate-100 dark:bg-slate-600"
                    : "bg-slate-200 dark:bg-slate-800"
                )}
              >
                {totalPending}
              </span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => setStatusFilter("entregado")}
              className={cn(
                "h-auto px-5 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2",
                statusFilter === "entregado"
                  ? "bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-md ring-1 ring-slate-200 dark:ring-slate-600 scale-105 z-10 hover:bg-white dark:hover:bg-slate-700"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-transparent"
              )}
            >
              Recibidos
              <span
                className={cn(
                  "px-2 py-0.5 rounded-md text-[10px]",
                  statusFilter === "entregado"
                    ? "bg-slate-100 dark:bg-slate-600"
                    : "bg-slate-200 dark:bg-slate-800"
                )}
              >
                {totalEntregado}
              </span>
            </Button>
          </div>
        </div>
      </div>
      </div>

      {/* Expandable Table Section */}
      <div className="flex-1 mt-1">
        {filteredDrivers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 dark:text-slate-400 w-full">
            <CheckCircle2 className="size-12 mb-4 text-emerald-500 opacity-50" />
            <p className="text-lg font-medium">No hay registros en esta vista</p>
            <p className="text-sm opacity-70 mt-1">
              Modifica tu búsqueda o revisa las otras pestañas de estado.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden transition-all duration-300">
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {/* Table Header */}
                <div className="hidden lg:grid grid-cols-12 items-end p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-[12px] xl:text-[13px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.05em] uppercase">
                  <div className="col-span-3 pl-4 flex items-center gap-2">
                    <User className="size-4" />
                    Chofer
                  </div>
                  <div className="col-span-2 flex justify-center">Facturas</div>
                  <div className="col-span-2 text-right pr-6">A Recibir</div>
                  <div className="col-span-2 flex justify-center">Estado</div>
                  <div className="col-span-3 flex justify-end pr-4">Acción</div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredDrivers.map((drv, index) => {
                    const isExpanded = expandedRows.has(drv.id);
                    const totalCashExpected = drv.invoices
                      .filter((inv) => inv.paymentMethod === "efectivo")
                      .reduce((sum, current) => sum + current.totalAmount, 0);

                    const pendingCash = drv.invoices
                      .filter((inv) => inv.paymentMethod === "efectivo" && inv.status === "pendiente")
                      .reduce((sum, current) => sum + current.totalAmount, 0);

                    return (
                      <div
                        key={drv.id}
                        className="flex flex-col group animate-in slide-in-from-bottom-2 fade-in"
                        style={{ animationFillMode: "both", animationDelay: `${index * 50}ms` }}
                      >
                        {/* Main Master Row */}
                        <div
                          onClick={() => toggleRow(drv.id)}
                          className="flex flex-col lg:grid lg:grid-cols-12 gap-y-3 lg:gap-y-0 items-start lg:items-center p-5 cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                        >
                          <div className="w-full lg:col-span-3 lg:pl-4 flex justify-between lg:justify-start items-center">
                            <span className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider">Chofer</span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:text-blue-600 transition-colors">
                              {drv.driverName}
                            </span>
                          </div>

                          <div className="w-full lg:col-span-2 flex justify-between lg:justify-center items-center text-slate-600 dark:text-slate-300">
                            <span className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider">Facturas</span>
                            <span className="font-semibold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-sm">
                              {drv.invoices.length} {drv.invoices.length === 1 ? "Factura" : "Facturas"}
                            </span>
                          </div>

                          <div className="w-full lg:col-span-2 flex justify-between lg:justify-end lg:pr-6 items-center">
                            <span className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider">A recibir</span>
                            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
                              {formatCurrency(totalCashExpected)}
                            </span>
                          </div>

                          <div className="w-full lg:col-span-2 flex justify-between lg:justify-center items-center">
                            <span className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</span>
                            <span
                              className={cn(
                                "text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-md",
                                drv.status === "entregado"
                                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
                                  : "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                              )}
                            >
                              {drv.status === "entregado" ? "Entregado" : "Pendiente"}
                            </span>
                          </div>

                          <div className="w-full lg:col-span-3 flex justify-end items-center mt-2 lg:mt-0 pt-3 lg:pt-0 border-t border-slate-100 dark:border-slate-800 lg:border-t-0 text-slate-400">
                            <div className="flex items-center gap-3 pr-2">
                              {drv.status === "pendiente" ? null : (
                                <div className="text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-500 dark:bg-emerald-900/10 dark:text-amber-400 px-2 py-1 rounded-md border border-emerald-100/50 dark:border-amber-800/20">
                                  Todo Recibido
                                </div>
                              )}
                              <ChevronDown className={cn("size-5 transition-transform duration-300", isExpanded && "rotate-180")} />
                            </div>
                          </div>
                        </div>

                        {/* Expanded Inner Details Layer */}
                        <div
                          className={cn(
                            "overflow-hidden transition-all duration-500 ease-in-out bg-slate-50/50 dark:bg-slate-800/50",
                            isExpanded ? "max-h-[1000px] opacity-100 border-t border-slate-100 dark:border-slate-700/50" : "max-h-0 opacity-0"
                          )}
                        >
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 uppercase tracking-widest">
                                <ReceiptText className="size-4 text-slate-400" />
                                Desglose de facturas del viaje
                              </h4>
                              {drv.status === "pendiente" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => toggleEditing(drv.id, e)}
                                  className={cn(
                                    "h-7 text-xs font-bold uppercase tracking-widest transition-all",
                                    editingDrivers.has(drv.id)
                                      ? "text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400"
                                      : "text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                                  )}
                                >
                                  {editingDrivers.has(drv.id) ? "Terminar Edición" : "Quitar Facturas"}
                                </Button>
                              )}
                            </div>

                            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-[#1E293B]">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700">
                                  <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                                    <th className="px-5 py-3">Factura</th>
                                    <th className="px-5 py-3">Cliente</th>
                                    <th className="px-5 py-3 whitespace-normal">Dirección de Entrega</th>
                                    <th className="px-5 py-3">Escaneada</th>
                                    <th className="px-5 py-3">Método</th>
                                    <th className="px-5 py-3 text-right">Monto a Cobrar (Cajas)</th>
                                    <th className="px-5 py-3 text-right shrink-0">Acción</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {drv.invoices.map((inv) => {
                                    const expectedRowCash = inv.paymentMethod === "efectivo" ? inv.totalAmount : 0;
                                    return (
                                      <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                                        <td className="px-5 py-3 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                          {inv.id}
                                        </td>
                                        <td className="px-5 py-3 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap md:whitespace-normal">
                                          {inv.clientName}
                                        </td>
                                        <td className="px-5 py-3 font-medium text-slate-500 dark:text-slate-400">
                                          {inv.address}
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                          {inv.isScanned ? (
                                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                                              <FileCheck className="size-4" />
                                              Escaneada
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-[11px] uppercase tracking-wider">
                                              <FileX className="size-4" />
                                              No Cargada
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                          <span
                                            className={cn(
                                              "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest",
                                              inv.paymentMethod === "efectivo"
                                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/30"
                                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700"
                                            )}
                                          >
                                            {inv.paymentMethod}
                                          </span>
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                          {expectedRowCash > 0 ? (
                                            <span className="font-medium text-slate-700 dark:text-slate-300">
                                              {formatCurrency(expectedRowCash)}
                                            </span>
                                          ) : (
                                            <span className="font-medium text-slate-300 dark:text-slate-500">
                                              $0.00
                                            </span>
                                          )}
                                        </td>

                                        <td className="px-5 py-3 text-right">
                                          <div className="flex items-center justify-end gap-2">
                                            {/* Reconciliation Actions */}
                                            {inv.paymentMethod === "efectivo" && (
                                              <>
                                                {inv.status === "pendiente" ? (
                                                  <Dialog>
                                                    <DialogTrigger asChild>
                                                      <Button
                                                        size="xs"
                                                        disabled={!inv.isScanned}
                                                        className={cn(
                                                          "h-7 px-3 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all shadow-sm active:scale-95",
                                                          inv.isScanned 
                                                            ? "bg-emerald-600 hover:bg-emerald-700 text-white" 
                                                            : "bg-slate-200 text-slate-400 cursor-not-allowed border-slate-200"
                                                        )}
                                                        onClick={(e) => e.stopPropagation()}
                                                      >
                                                        Recibir
                                                      </Button>
                                                    </DialogTrigger>
                                                    <DialogContent onClick={(e) => e.stopPropagation()}>
                                                      <DialogHeader>
                                                        <DialogTitle>¿Confirmar recepción?</DialogTitle>
                                                        <DialogDescription>
                                                          Registrar el pago de <strong>{formatCurrency(inv.totalAmount)}</strong> de la factura <strong>{inv.id}</strong>.
                                                        </DialogDescription>
                                                      </DialogHeader>
                                                      <DialogFooter>
                                                        <DialogClose asChild>
                                                          <Button variant="outline" className="h-9 text-xs">Cancelar</Button>
                                                        </DialogClose>
                                                        <DialogClose asChild>
                                                          <Button
                                                            className="h-9 text-xs bg-emerald-600 hover:bg-emerald-700"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleReconcileInvoice(drv.id, inv.id);
                                                            }}
                                                          >
                                                            Confirmar
                                                          </Button>
                                                        </DialogClose>
                                                      </DialogFooter>
                                                    </DialogContent>
                                                  </Dialog>
                                                ) : (
                                                  <Dialog>
                                                    <DialogTrigger asChild>
                                                      <Button
                                                        variant="outline"
                                                        size="xs"
                                                        className="h-7 px-3 rounded-lg font-bold text-[10px] uppercase tracking-wider transition-all border-amber-200 text-amber-600 hover:bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:hover:bg-amber-950/20 shadow-sm active:scale-95"
                                                        onClick={(e) => e.stopPropagation()}
                                                      >
                                                        Revertir
                                                      </Button>
                                                    </DialogTrigger>
                                                    <DialogContent onClick={(e) => e.stopPropagation()}>
                                                      <DialogHeader>
                                                        <DialogTitle>¿Revertir recepción?</DialogTitle>
                                                        <DialogDescription>
                                                          La factura <strong>{inv.id}</strong> volverá al estado pendiente de cobro.
                                                        </DialogDescription>
                                                      </DialogHeader>
                                                      <DialogFooter>
                                                        <DialogClose asChild>
                                                          <Button variant="outline" className="h-9 text-xs">Cancelar</Button>
                                                        </DialogClose>
                                                        <DialogClose asChild>
                                                          <Button
                                                            variant="destructive"
                                                            className="h-9 text-xs"
                                                            onClick={(e) => {
                                                              e.stopPropagation();
                                                              handleRevertInvoice(drv.id, inv.id);
                                                            }}
                                                          >
                                                            Sí, Revertir
                                                          </Button>
                                                        </DialogClose>
                                                      </DialogFooter>
                                                    </DialogContent>
                                                  </Dialog>
                                                )}
                                              </>
                                            )}

                                            {/* Removal Action (Trash) - Only when editing and pending */}
                                            {drv.status === "pendiente" && editingDrivers.has(drv.id) && (
                                              <div onClick={(e) => e.stopPropagation()} className="inline-block">
                                                <Dialog>
                                                  <DialogTrigger asChild>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon-xs"
                                                      className="text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-7 h-7"
                                                      title="Quitar pedido"
                                                      onClick={(e) => e.stopPropagation()}
                                                    >
                                                      <Trash2 className="size-3.5" />
                                                    </Button>
                                                  </DialogTrigger>
                                                  <DialogContent onClick={(e) => e.stopPropagation()}>
                                                    <DialogHeader>
                                                      <DialogTitle>¿Quitar factura?</DialogTitle>
                                                      <DialogDescription>
                                                        Quitar la factura <strong>{inv.id}</strong>.
                                                      </DialogDescription>
                                                    </DialogHeader>
                                                    <DialogFooter>
                                                      <DialogClose asChild>
                                                        <Button variant="outline" className="h-9 text-xs">Cancelar</Button>
                                                      </DialogClose>
                                                      <DialogClose asChild>
                                                        <Button
                                                          variant="destructive"
                                                          className="h-9 text-xs"
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveInvoice(drv.id, inv.id);
                                                          }}
                                                        >
                                                          Quitar
                                                        </Button>
                                                      </DialogClose>
                                                    </DialogFooter>
                                                  </DialogContent>
                                                </Dialog>
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
