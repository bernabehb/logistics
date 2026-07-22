"use client";

import { useState } from "react";
import { User, ChevronDown, Search as SearchIcon, Check, Layers, UserRoundCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Block } from "@/features/logistics/models/blocks";
import { Driver } from "@/features/logistics/models/drivers";
import { AssignmentHelperPayload, Helper } from "@/features/logistics/models/helpers";
import { showConfirm } from "@/lib/mySwal";

type HelperMode = "none" | "catalog" | "other";

interface BlockCardProps {
  block: Block;
  onAssign: (driverId: string, helper?: AssignmentHelperPayload) => void;
  assignedDriverName?: string;
  assignedDriverIds?: string[];
  allDrivers?: Driver[];
  helpers?: Helper[];
  isLoadingDrivers?: boolean;
  isLoadingHelpers?: boolean;
  driverError?: string | null;
}

export function BlockCard({
  block,
  onAssign,
  assignedDriverName,
  assignedDriverIds = [],
  allDrivers = [],
  helpers = [],
  isLoadingDrivers = false,
  isLoadingHelpers = false,
  driverError = null,
}: BlockCardProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [driverSearch, setDriverSearch] = useState("");
  const [helperMode, setHelperMode] = useState<HelperMode>("none");
  const [selectedHelperId, setSelectedHelperId] = useState("");
  const [otherHelperName, setOtherHelperName] = useState("");
  const [isHelperSelectorOpen, setIsHelperSelectorOpen] = useState(false);

  const filteredDriversForSelect = allDrivers
    .filter(driver => !assignedDriverIds.includes(driver.id))
    .filter(driver => driver.status?.trim().toLowerCase() !== "en ruta")
    .filter(d =>
      d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.sucursal?.toLowerCase().includes(driverSearch.toLowerCase())
    );

  const selectedDriverData = allDrivers.find(d => d.id === selectedDriverId);
  const selectedHelperData = helpers.find(h => h.iIdHelper.toString() === selectedHelperId);
  const currentHelperName = block.helperNameSnapshot?.trim();
  const hasCurrentHelper = !!currentHelperName && currentHelperName.toLowerCase() !== "ninguno";

  const statusColors = {
    "Disponible": "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    "Asignado": "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
  };

  const resetAssignmentForm = () => {
    setSelectedDriverId("");
    setDriverSearch("");
    setIsSelectorOpen(false);
    setHelperMode("none");
    setSelectedHelperId("");
    setOtherHelperName("");
    setIsHelperSelectorOpen(false);
  };

  const openAssignmentForm = () => {
    resetAssignmentForm();
    setIsAssigning(true);
  };

  const closeAssignmentForm = () => {
    resetAssignmentForm();
    setIsAssigning(false);
  };

  const getSelectedHelperPayload = (): AssignmentHelperPayload => {
    if (helperMode === "other") {
      return {
        iIdHelper: null,
        sHelperName: otherHelperName.trim(),
        bHelperUsesOther: true,
      };
    }

    if (helperMode === "catalog" && selectedHelperData) {
      return {
        iIdHelper: selectedHelperData.iIdHelper,
        sHelperName: selectedHelperData.sHelperName,
        bHelperUsesOther: false,
      };
    }

    return {
      iIdHelper: null,
      sHelperName: "Ninguno",
      bHelperUsesOther: false,
    };
  };

  const getHelperLabel = () => {
    if (helperMode === "other") {
      return otherHelperName.trim() || "Otro";
    }

    if (helperMode === "catalog") {
      return selectedHelperData?.sHelperName || "Ayudante no seleccionado";
    }

    return "Ninguno";
  };

  const canAssign =
    !!selectedDriverId &&
    (helperMode !== "catalog" || !!selectedHelperId) &&
    (helperMode !== "other" || otherHelperName.trim().length > 0);

  const handleAssign = () => {
    if (!canAssign) return;

    onAssign(selectedDriverId, getSelectedHelperPayload());
    closeAssignmentForm();
  };

  const confirmRelease = async () => {
    const confirmed = await showConfirm({
      icon: "warning",
      iconColor: "#f59e0b",
      title: "¿Liberar bloque?",
      html: `Se liberará el bloque <b>${block.name}</b> y el chofer <b>${assignedDriverName || ""}</b> quedará sin bloque asignado.`,
      confirmButtonText: "Sí, liberar",
      confirmButtonColor: "#f59e0b"
    });

    if (confirmed) {
      onAssign("");
    }
  };

  const confirmAssign = async () => {
    const driver = allDrivers.find(d => d.id === selectedDriverId);
    const helperLabel = getHelperLabel();
    const confirmed = await showConfirm({
      icon: "question",
      iconColor: "#60a5fa",
      title: "¿Asignar chofer?",
      html: `Se asignará a <b>${driver?.name || ""}</b> al bloque <b>${block.name}</b>.<br/><span style="font-size:12px;color:#64748b">Ayudante: <b>${helperLabel}</b></span>`,
      confirmButtonText: "Sí, asignar"
    });

    if (confirmed) {
      handleAssign();
    }
  };

  return (
    <Card className={cn(
      "hover:shadow-xl transition-all duration-500 group relative flex flex-col border-slate-100 dark:border-slate-800",
      (isSelectorOpen || isHelperSelectorOpen) && "z-50"
    )}>
      <CardHeader className="flex flex-row justify-between items-start pb-4 space-y-0">
        <div className="flex flex-col min-w-0 flex-1 mt-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <CardTitle className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight transition-colors leading-tight">
              {block.name}
            </CardTitle>
            {block.logisticsBranch && (
              <span className="px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 shrink-0 whitespace-nowrap">
                {block.logisticsBranch}
              </span>
            )}
            <span className={cn(
              "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors shrink-0 whitespace-nowrap",
              statusColors[block.status]
            )}>
              {block.status}
            </span>
          </div>
        </div>
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-colors shrink-0 ml-2">
          <Layers className="size-5 text-slate-400" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 transition-colors">
          {!isAssigning ? (
            <div className="flex flex-col gap-3 min-h-[110px] justify-center">
              {block.status === "Disponible" ? (
                <button
                  onClick={openAssignmentForm}
                  className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-slate-400/80 dark:border-slate-500 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 shadow-sm cursor-pointer"
                >
                  Asignar Chofer
                </button>
              ) : (
                <>
                  <div className="flex flex-col gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 bg-blue-500 rounded-xl flex items-center justify-center text-white transition-colors shrink-0">
                        <User className="size-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Chofer</span>
                        <span className="text-sm font-black text-slate-700 dark:text-slate-200 transition-colors truncate">
                          {assignedDriverName || "No asignado"}
                        </span>
                      </div>
                    </div>
                    {hasCurrentHelper && (
                      <div className="flex items-center gap-3 min-w-0 border-t border-slate-200/70 dark:border-slate-700 pt-3">
                        <div className="size-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white transition-colors shrink-0">
                          <UserRoundCheck className="size-5" />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Ayudante</span>
                          <span className="text-sm font-black text-slate-700 dark:text-slate-200 transition-colors truncate">
                            {currentHelperName}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={confirmRelease}
                    className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors py-1 flex items-center justify-center cursor-pointer"
                  >
                    Liberar Bloque
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col gap-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccionar Chofer</label>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isLoadingDrivers && !driverError) {
                        setIsSelectorOpen(!isSelectorOpen);
                        setIsHelperSelectorOpen(false);
                      }
                    }}
                    disabled={isLoadingDrivers || !!driverError}
                    className={cn(
                      "w-full h-11 bg-slate-50 dark:bg-[#0F172A]/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-4 text-sm font-medium flex items-center justify-between transition-all hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer disabled:cursor-not-allowed",
                      isSelectorOpen && "ring-2 ring-blue-500/20 border-blue-500 dark:border-blue-500/50",
                      driverError && "border-red-300 dark:border-red-900/50 text-red-500"
                    )}
                  >
                    <span className="truncate">
                      {isLoadingDrivers ? "Cargando choferes..." :
                       driverError ? driverError :
                       selectedDriverData ? `${selectedDriverData.name}` :
                       "Selecciona un chofer..."}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isSelectorOpen && "rotate-180")} />
                  </button>

                  {isSelectorOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setIsSelectorOpen(false)}
                      />
                      <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                        <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                              type="text"
                              autoFocus
                              placeholder="Buscar chofer..."
                              value={driverSearch}
                              onChange={(e) => setDriverSearch(e.target.value)}
                              className="w-full h-9 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500/30"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto py-1 no-scrollbar">
                          {filteredDriversForSelect.length > 0 ? (
                            filteredDriversForSelect.map(d => (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => {
                                  setSelectedDriverId(d.id);
                                  setIsSelectorOpen(false);
                                  setDriverSearch("");
                                }}
                                className={cn(
                                  "w-full px-4 py-2 text-left text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between group cursor-pointer",
                                  selectedDriverId === d.id && "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                                )}
                              >
                                <div className="flex flex-col">
                                  <span>{d.name}</span>
                                  {d.sucursal && (
                                    <span className="text-[9px] text-slate-400 group-hover:text-slate-500 uppercase font-bold">{d.sucursal}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {(d.pendingInvoicesCount || 0) > 0 && (
                                    <span
                                      title={`${d.pendingInvoicesCount} facturas pendientes de salida`}
                                      className="min-w-5 h-5 px-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-600 text-[10px] font-black flex items-center justify-center"
                                    >
                                      {d.pendingInvoicesCount}
                                    </span>
                                  )}
                                  {selectedDriverId === d.id && <Check className="w-4 h-4" />}
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-6 text-center text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                              No se encontraron choferes
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {driverError && (
                  <p className="text-[9px] font-bold text-red-500 mt-1 uppercase tracking-wider animate-pulse">
                    Error al cargar: {driverError}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ayudante General</label>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      if (!isLoadingHelpers) {
                        setIsHelperSelectorOpen(!isHelperSelectorOpen);
                        setIsSelectorOpen(false);
                      }
                    }}
                    disabled={isLoadingHelpers}
                    className={cn(
                      "w-full h-11 bg-slate-50 dark:bg-[#0F172A]/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-4 text-sm font-medium flex items-center justify-between transition-all hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer disabled:cursor-not-allowed",
                      isHelperSelectorOpen && "ring-2 ring-blue-500/20 border-blue-500 dark:border-blue-500/50"
                    )}
                  >
                    <span className="truncate">
                      {isLoadingHelpers ? "Cargando ayudantes..." :
                       helperMode === "none" ? "Ninguno" :
                       helperMode === "other" ? (otherHelperName.trim() || "Otro (Especificar)") :
                       selectedHelperData ? selectedHelperData.sHelperName :
                       "Selecciona un ayudante..."}
                    </span>
                    <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", isHelperSelectorOpen && "rotate-180")} />
                  </button>

                  {isHelperSelectorOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-transparent"
                        onClick={() => setIsHelperSelectorOpen(false)}
                      />
                      <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                        <div className="max-h-[240px] overflow-y-auto py-1 no-scrollbar">
                          <button
                            type="button"
                            onClick={() => {
                              setHelperMode("none");
                              setSelectedHelperId("");
                              setOtherHelperName("");
                              setIsHelperSelectorOpen(false);
                            }}
                            className={cn(
                              "w-full px-4 py-2.5 text-left text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between cursor-pointer",
                              helperMode === "none" && "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                            )}
                          >
                            <span>Ninguno</span>
                            {helperMode === "none" && <Check className="w-4 h-4" />}
                          </button>

                          {helpers.map(helper => {
                            const isSelected = helperMode === "catalog" && selectedHelperId === helper.iIdHelper.toString();
                            return (
                              <button
                                key={helper.iIdHelper}
                                type="button"
                                onClick={() => {
                                  setHelperMode("catalog");
                                  setSelectedHelperId(helper.iIdHelper.toString());
                                  setOtherHelperName("");
                                  setIsHelperSelectorOpen(false);
                                }}
                                className={cn(
                                  "w-full px-4 py-2.5 text-left text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between cursor-pointer",
                                  isSelected && "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                                )}
                              >
                                <span>{helper.sHelperName}</span>
                                {isSelected && <Check className="w-4 h-4" />}
                              </button>
                            );
                          })}

                          <button
                            type="button"
                            onClick={() => {
                              setHelperMode("other");
                              setSelectedHelperId("");
                              setIsHelperSelectorOpen(false);
                            }}
                            className={cn(
                              "w-full px-4 py-2.5 text-left text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between cursor-pointer",
                              helperMode === "other" && "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                            )}
                          >
                            <span>Otro (Especificar)</span>
                            {helperMode === "other" && <Check className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {helperMode === "other" && (
                  <input
                    type="text"
                    value={otherHelperName}
                    onChange={(e) => setOtherHelperName(e.target.value)}
                    placeholder="Nombre del ayudante"
                    className="w-full h-11 bg-slate-50 dark:bg-[#0F172A]/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 mt-1 animate-in fade-in slide-in-from-top-1 duration-200"
                  />
                )}
                {isLoadingHelpers && (
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    Cargando ayudantes...
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={closeAssignmentForm}
                  className="flex-1 h-11 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmAssign}
                  disabled={!canAssign}
                  className="flex-[2] h-11 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl font-bold text-xs uppercase tracking-widest border border-slate-400/80 dark:border-slate-500 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 dark:hover:text-emerald-400 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm cursor-pointer"
                >
                  Asignar
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
