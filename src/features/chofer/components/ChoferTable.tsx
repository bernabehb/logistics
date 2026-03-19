"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ChoferRow, MaterialDetail } from "../models";
import { ChevronDown, MapPin, Grid3x3, LayoutGrid, PaintbrushVertical, Package, Weight, Phone, Check, Eye, Pencil } from "lucide-react";
import { StatusCircle } from "@/features/logistics/components/StatusIndicator";

interface ChoferTableProps {
  rows: ChoferRow[];
  totalItems: number;
  currentPage: number;
  totalPages: number;
  onNextPage: () => void;
  onPrevPage: () => void;
  totalWeight: number;
}

export function ChoferTable({
  rows,
  totalItems,
  currentPage,
  totalPages,
  onNextPage,
  onPrevPage,
  totalWeight,
}: ChoferTableProps) {
  const currentCount = rows.length;
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] overflow-hidden transition-all duration-300">
      <div className="overflow-x-auto">
        <div className="min-w-full lg:min-w-[1024px]">
          {/* Table Header - Only visible on large screens */}
          <div className="hidden lg:grid grid-cols-12 items-end p-5 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-[13px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.05em] uppercase">
            <div className="col-span-2 pl-4">Factura #</div>
            <div className="col-span-3">Cliente</div>
            <div className="col-span-2 flex items-center gap-2">
              <Phone className="size-3.5" />
              Teléfono
            </div>
            <div className="col-span-3 flex items-center gap-2">
              <MapPin className="size-4" />
              Destino
            </div>
            <div className="col-span-1 flex justify-center">Estado</div>
            <div className="col-span-1 flex justify-center">Acción</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {rows.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-sm">
                No tienes pedidos asignados.
              </div>
            ) : (
              rows.map((row, index) => {
                const isExpanded = expandedRows.has(row.id);

                // Calculate totals and overall status
                const mats = [...row.materials.aluminio, ...row.materials.vidrio, ...row.materials.herrajes];
                const totalWeight = mats.reduce((acc, curr) => acc + curr.weight, 0);

                // Forzar a 'ready' para que todos los círculos sean verdes como lo solicitó el usuario
                const generalStatus = 'ready';

                return (
                  <div key={row.id} className="flex flex-col group animate-in slide-in-from-bottom-2 fade-in" style={{ animationFillMode: 'both', animationDelay: `${index * 50}ms` }}>
                    {/* Main Row */}
                    <div
                      onClick={() => toggleRow(row.id)}
                      className="flex flex-col lg:grid lg:grid-cols-12 gap-y-3 lg:gap-y-0 items-start lg:items-center p-5 cursor-pointer transition-all duration-200 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                    >
                      {/* Factura */}
                      <div className="w-full lg:col-span-2 lg:pl-4 flex justify-between lg:flex-col items-center lg:items-start lg:gap-1.5">
                        <span className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider">Factura #</span>
                        <div className="flex flex-col text-right lg:text-left">
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-[17px] group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">#{row.id}</span>
                          <span className="text-slate-500 dark:text-slate-400 text-[14px]">{row.date}</span>
                        </div>
                      </div>

                      {/* Cliente */}
                      <div className="w-full lg:col-span-3 flex justify-between lg:justify-start items-center lg:items-start font-semibold text-slate-800 dark:text-slate-200 text-[16px]">
                        <span className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider">Cliente</span>
                        <span>{row.clientName}</span>
                      </div>

                      {/* Teléfono */}
                      <div className="w-full lg:col-span-2 flex justify-between lg:justify-start items-center lg:items-start text-slate-600 dark:text-slate-300 text-[15px] font-medium">
                        <span className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Phone className="size-3" /> Teléfono</span>
                        <span>{row.clientPhone}</span>
                      </div>

                      {/* Destino */}
                      <div className="w-full lg:col-span-3 flex justify-between lg:justify-start items-center lg:items-start text-slate-600 dark:text-slate-300 text-[15px]">
                        <span className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><MapPin className="size-3" /> Destino</span>
                        <span className="text-right lg:text-left">{row.destination}</span>
                      </div>

                      {/* General Status */}
                      <div className="w-full lg:col-span-1 flex justify-between lg:justify-center items-center">
                        <span className="lg:hidden text-xs font-bold text-slate-400 uppercase tracking-wider">Estado</span>
                        <div className="flex flex-col items-center gap-1">
                          <StatusCircle status={generalStatus} />
                          <span className={cn(
                            "text-[10px] font-bold uppercase tracking-tight",
                            generalStatus === 'ready' ? "text-emerald-500" :
                              generalStatus === 'pending' ? "text-red-500" :
                                "text-amber-500"
                          )}>
                            {generalStatus === 'ready' ? 'Listo' :
                              generalStatus === 'pending' ? 'Pendiente' :
                                'En Proceso'}
                          </span>
                        </div>
                      </div>

                      {/* Expand Icon */}
                      <div className="w-full lg:col-span-1 flex justify-between lg:justify-center items-center mt-2 lg:mt-0 pt-3 lg:pt-0 border-t border-slate-100 dark:border-slate-800 lg:border-t-0 text-slate-400 dark:text-slate-500">
                        <span className="lg:hidden text-sm font-semibold text-slate-500">{isExpanded ? 'Ocultar detalles' : 'Ver más detalles'}</span>
                        <ChevronDown className={cn("size-5 transition-transform duration-300", isExpanded && "rotate-180")} />
                      </div>
                    </div>

                    {/* Expanded Details */}
                    <div
                      className={cn(
                        "overflow-hidden transition-all duration-500 ease-in-out bg-slate-50/50 dark:bg-slate-800/50",
                        isExpanded ? "max-h-[2000px] lg:max-h-[2000px] opacity-100 border-t border-slate-100 dark:border-slate-700/50" : "max-h-0 opacity-0"
                      )}
                    >
                      <div className="p-6">
                        <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                          <Package className="size-4 text-blue-500" />
                          Detalles de Carga por Almacén
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                          {/* Aluminio Card */}
                          <MetricCard
                            title="Aluminio"
                            icon={<Grid3x3 className="size-5 text-slate-400" />}
                            details={row.materials.aluminio}
                          />

                          {/* Vidrio Card */}
                          <MetricCard
                            title="Vidrio"
                            icon={<LayoutGrid className="size-5 text-slate-400" />}
                            details={row.materials.vidrio}
                          />

                          {/* Herrajes Card */}
                          <MetricCard
                            title="Herrajes"
                            icon={<PaintbrushVertical className="size-5 text-slate-400" />}
                            details={row.materials.herrajes}
                          />

                          {/* Total Card */}
                          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-4 flex flex-col transition-all duration-300">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-semibold mb-2">
                              <Weight className="size-5" />
                              <span>Peso total del pedido</span>
                            </div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-2">
                              {totalWeight.toFixed(2)} kg
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>

          {/* Summary Row */}
          <div className="bg-slate-50/80 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 px-5 py-2.5 flex justify-end items-center">
            <div className="flex items-center gap-2 pr-1 sm:pr-4">
              <span className="text-[15px] font-medium text-slate-500 dark:text-slate-400">Peso total de carga:</span>
              <span className="text-[15px] font-bold text-slate-900 dark:text-slate-100">
                {totalWeight.toFixed(2)} kg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="px-3 md:px-6 py-3 md:py-4 border-t border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-0 md:justify-between text-[13px] md:text-[14px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800">
        <div>
          Mostrando <span className="font-semibold text-slate-900 dark:text-slate-100">{currentCount}</span> de <span className="font-semibold text-slate-900 dark:text-slate-100">{totalItems}</span> asignaciones
        </div>
        <div className="flex items-center gap-3 md:gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="text-slate-500 dark:text-slate-400 text-xs font-medium">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onPrevPage}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <button
              onClick={onNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-4 py-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, icon, details }: { title: string, icon: React.ReactNode, details: MaterialDetail[] }) {
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());
  const [showMap, setShowMap] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const mockSlot = details.length > 0 ? (details[0].name.length % (title === 'Aluminio' ? 12 : 2)) + 1 : 1;

  const toggleCheck = (idx: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(idx)) {
      newChecked.delete(idx);
    } else {
      newChecked.add(idx);
    }
    setCheckedItems(newChecked);
  };
  if (!details || details.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 flex flex-col min-h-[140px]">
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <span className="font-semibold text-slate-600 dark:text-slate-300">{title}</span>
        </div>
        <div className="flex items-center justify-center flex-1 text-[15px] text-slate-400 dark:text-slate-500">
          Sin asignar
        </div>
      </div>
    );
  }

  const totalCategoryWeight = details.reduce((acc, curr) => acc + curr.weight, 0);

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col hover:border-blue-300 dark:hover:border-blue-500/50 transition-colors shadow-sm">
      <div className="flex flex-nowrap items-center justify-between mb-3 pb-3 border-b border-slate-100 dark:border-slate-700 gap-1.5 overflow-hidden">
        <div className="flex items-center gap-1.5 min-w-0 shrink">
          <div className="shrink-0">{icon}</div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{title}</span>
          {isVerified && (
            <div className="flex items-center shrink-0">
              <span className="flex items-center justify-center p-1 md:px-1.5 md:py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50" title="Verificado">
                <Check className="w-3.5 h-3.5 shrink-0" strokeWidth={3} />
                <span className="hidden 2xl:inline-block ml-1 text-[9px] font-bold uppercase tracking-widest truncate">Verificado</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {title !== 'Herrajes' && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowMap(!showMap); }}
              className={cn("p-1.5 rounded-md transition-colors shrink-0", showMap ? "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" : "bg-slate-50 dark:bg-[#1E293B] text-slate-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10")}
              title="Ver ubicación"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          )}

          {!isVerifying ? (
            <button
              onClick={(e) => { e.stopPropagation(); setIsVerifying(true); }}
              className={cn("transition-all shadow-sm active:scale-95 shrink-0", isVerified ? "p-1.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700" : "px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20")}
              title={isVerified ? "Editar verificación" : "Verificar pedido"}
            >
              {isVerified ? <Pencil className="w-3.5 h-3.5" /> : 'Verificar'}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVerifying(false);
                setIsVerified(checkedItems.size === details.length && details.length > 0);
              }}
              className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-sm active:scale-95 shrink-0"
            >
              Guardar
            </button>
          )}

          <span className="text-[10px] uppercase tracking-wide whitespace-nowrap font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1.5 rounded-lg shrink-0">
            {totalCategoryWeight.toFixed(2)} KG
          </span>
        </div>
      </div>

      {showMap && title === 'Aluminio' && (
        <div className="w-full flex flex-col items-center mb-3 bg-slate-50/50 dark:bg-[#0F172A]/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-col w-44 relative mt-2 text-slate-300 dark:text-slate-600">
            {/* Poste central vertical */}
            <div className="absolute top-0 left-[50%] w-1 h-full bg-current -ml-[2px] rounded-t-sm z-0"></div>

            {[0, 1, 2, 3, 4, 5].map(rowIdx => {
              const leftNum = rowIdx * 2 + 1;
              const rightNum = rowIdx * 2 + 2;
              return (
                <div key={rowIdx} className={cn("grid grid-cols-2 gap-4 relative z-10 w-full", rowIdx < 5 ? "border-b-[4px] border-current pb-2 mb-2" : "pb-1")}>
                  {/* Left Slot */}
                  <div className="flex justify-center items-center">
                    <div className={cn("flex w-full h-8 items-center justify-center font-black text-sm rounded shadow-sm transition-all", mockSlot === leftNum ? "bg-amber-500 text-white ring-4 ring-amber-500/30 scale-110" : "bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-500 border border-slate-200 dark:border-slate-700")}>
                      {leftNum}
                    </div>
                  </div>
                  {/* Right Slot */}
                  <div className="flex justify-center items-center">
                    <div className={cn("flex w-full h-8 items-center justify-center font-black text-sm rounded shadow-sm transition-all", mockSlot === rightNum ? "bg-amber-500 text-white ring-4 ring-amber-500/30 scale-110" : "bg-white dark:bg-slate-800 text-slate-300 dark:text-slate-500 border border-slate-200 dark:border-slate-700")}>
                      {rightNum}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showMap && title === 'Vidrio' && (
        <div className="w-full flex flex-col items-center justify-center mb-3 bg-slate-50/50 dark:bg-[#0F172A]/50 rounded-lg py-4 border border-slate-200 dark:border-slate-700 relative">
          <span className="text-[10px] uppercase font-bold text-slate-400 absolute top-3 right-3 tracking-widest">Caballete</span>
          <div className="relative w-32 h-28 flex items-end justify-between px-2 mt-2">
            <svg className="absolute inset-0 w-full h-full drop-shadow-sm" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Pata Secundaria */}
              <path d={mockSlot === 1 ? "M50 15 L80 100" : "M50 15 L20 100"} className="text-slate-300 dark:text-slate-600 stroke-current transition-colors duration-300" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              {/* Barra horizontal (dibujada antes de la pata principal) */}
              <path d="M35 50 L65 50" className="text-slate-300 dark:text-slate-600 stroke-current" strokeWidth="4" fill="none" strokeLinecap="round" />
              {/* Pata Resaltada Principal (dibujada al final para estar encima de todo) */}
              <path d={mockSlot === 1 ? "M50 15 L20 100" : "M50 15 L80 100"} className="text-amber-500 stroke-current transition-colors duration-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>

            {/* Lado 1 (Izquierdo) */}
            <div className="z-10 flex items-center justify-center w-8 h-8 mb-5 rounded-full font-black text-sm bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm">
              1
            </div>
            {/* Lado 2 (Derecho) */}
            <div className="z-10 flex items-center justify-center w-8 h-8 mb-5 rounded-full font-black text-sm bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm">
              2
            </div>
          </div>
        </div>
      )}

      {/* Herrajes no lleva mapa ni nota por petición */}

      <div className="flex flex-col gap-1 mt-1 transition-opacity duration-300">
        {details.map((item, idx) => {
          const isChecked = checkedItems.has(idx);
          return (
            <div
              key={idx}
              onClick={() => isVerifying && toggleCheck(idx)}
              className={cn(
                "flex items-start gap-3 p-2.5 rounded-lg transition-all border select-none",
                isVerifying ? "cursor-pointer" : "cursor-default",
                isChecked
                  ? "bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-500/20 shadow-sm"
                  : isVerifying ? "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30" : "border-transparent"
              )}
            >
              <div
                className={cn(
                  "mt-0.5 shrink-0 flex items-center justify-center w-5 h-5 rounded-md border transition-all duration-300",
                  isChecked
                    ? "bg-emerald-500 border-emerald-500 text-white scale-110"
                    : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-transparent",
                  !isVerifying && !isChecked && "opacity-0 invisible" // Ocultar checkbox si no está en modo verificar y no ha sido marcado
                )}
              >
                <Check className="w-3.5 h-3.5" strokeWidth={3} />
              </div>
              <div className={cn("flex-1 flex flex-col gap-1.5 text-[15px] transition-transform duration-300", !isVerifying && !isChecked ? "-ml-6" : "")}>
                <div className="flex justify-between items-start">
                  <span className={cn("font-medium pr-2 transition-colors", isChecked ? "text-emerald-900/70 dark:text-emerald-100/70 line-through" : "text-slate-700 dark:text-slate-300")}>{item.name}</span>
                </div>
                <div className={cn("flex justify-between text-sm transition-colors", isChecked ? "text-emerald-600/70 dark:text-emerald-400/70" : "text-slate-500 dark:text-slate-400")}>
                  <span>{item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'}</span>
                  <span className="font-semibold">{item.weight.toFixed(2)} kg</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  );
}
