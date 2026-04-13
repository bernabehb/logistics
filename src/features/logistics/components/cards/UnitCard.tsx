"use client";

import { useState } from "react";
import { Truck, Fuel, AlertTriangle, User, BadgeCheck, Wrench, RefreshCw, LogOut, ChevronDown, Search as SearchIcon, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Unit } from "@/features/logistics/models/units";
import { Driver } from "@/features/logistics/models/drivers";

interface UnitCardProps {
  unit: Unit;
  onAssign: (driverId: string) => void;
  onMaintenance: () => void;
  assignedDriverName?: string;
  assignedDriverIds?: string[];
  allDrivers?: Driver[];
  isLoadingDrivers?: boolean;
  driverError?: string | null;
}

export function UnitCard({
  unit,
  onAssign,
  onMaintenance,
  assignedDriverName,
  assignedDriverIds = [],
  allDrivers = [],
  isLoadingDrivers = false,
  driverError = null
}: UnitCardProps) {
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    title: string;
    description: React.ReactNode;
    actionLabel: string;
    onConfirm: () => void;
    icon?: React.ElementType;
    iconColor?: string;
  }>({
    show: false,
    title: "",
    description: "",
    actionLabel: "Confirmar",
    onConfirm: () => {}
  });

  // Estados para el Selector Personalizado
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [driverSearch, setDriverSearch] = useState("");

  const filteredDriversForSelect = allDrivers
    .filter(driver => !assignedDriverIds.includes(driver.id))
    .filter(d => 
      d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.sucursal?.toLowerCase().includes(driverSearch.toLowerCase())
    );

  const selectedDriverData = allDrivers.find(d => d.id === selectedDriverId);

  const showConfirm = (options: Partial<typeof confirmDialog>) => {
    setConfirmDialog({
      show: true,
      title: options.title || "Confirmar acción",
      description: options.description || "¿Estás seguro?",
      actionLabel: options.actionLabel || "Confirmar",
      onConfirm: options.onConfirm || (() => {}),
      icon: options.icon,
      iconColor: options.iconColor
    });
  };

  const statusColors = {
    "Disponible": "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    "Asignado": "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    "Mantenimiento": "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    "Fuera de Servicio": "bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  };

  const handleAssign = () => {
    if (selectedDriverId) {
      onAssign(selectedDriverId);
      setIsAssigning(false);
    }
  };

  return (
    <Card className={cn(
      "hover:shadow-xl transition-all duration-500 group relative flex flex-col border-slate-100 dark:border-slate-800",
      isSelectorOpen && "z-50"
    )}>
      <CardHeader className="flex flex-row justify-between items-start pb-4 space-y-0">
        <div className="flex flex-col min-w-0 flex-1 mt-0">
          <div className="flex items-center gap-2 mb-1 flex-nowrap">
            <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight transition-colors truncate">
              {unit.name}
            </CardTitle>
            <span className={cn(
              "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors shrink-0 whitespace-nowrap",
              statusColors[unit.status]
            )}>
              {unit.status}
            </span>
          </div>
          <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest transition-colors opacity-60">
            Capacidad: {unit.capacity}
          </span>
        </div>
        <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl transition-colors shrink-0 ml-2">
          <Truck className="size-5 text-slate-400" />
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {/* Samsara Stats */}
        <div className="mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2 transition-colors">
            <div className="flex items-center gap-2 text-slate-400">
              <Fuel className="size-4" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Combustible</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-xl font-black text-slate-700 dark:text-slate-200 leading-none transition-colors">{unit.fuelLevel}%</span>
              <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    unit.fuelLevel < 20 ? "bg-red-500" : 
                    unit.fuelLevel < 50 ? "bg-amber-500" : 
                    "bg-emerald-500"
                  )}
                  style={{ width: `${unit.fuelLevel}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Control */}
        <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 transition-colors">
          {!isAssigning ? (
            <div className="flex flex-col gap-3 min-h-[110px] justify-center">
              {unit.status === "Disponible" ? (
                <>
                  <button
                    onClick={() => setIsAssigning(true)}
                    className="w-full bg-slate-100 hover:bg-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-white dark:text-slate-400 dark:hover:text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-slate-400/80 dark:border-slate-500 hover:border-slate-600 active:scale-95 shadow-sm"
                  >
                    Asignar Chofer
                  </button>
                  <button
                    onClick={() => showConfirm({
                      title: "Enviar a Mantenimiento",
                      description: (
                        <>¿Confirmas el envío de la unidad <strong className="text-slate-900 dark:text-slate-100">{unit.name}</strong> a mantenimiento? No aparecerá como disponible para nuevos viajes.</>
                      ),
                      actionLabel: "Enviar",
                      icon: Wrench,
                      iconColor: "text-amber-500",
                      onConfirm: onMaintenance
                    })}
                    className="w-full py-2 text-[10px] font-black text-slate-400 hover:text-amber-600 uppercase tracking-widest transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-amber-100 dark:hover:border-amber-900/30 rounded-lg"
                  >
                    <AlertTriangle className="size-3" />
                    Enviar a Mantenimiento
                  </button>
                </>
              ) : unit.status === "Asignado" ? (
                <>
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 transition-colors">
                    <div className="size-10 bg-blue-500 rounded-xl flex items-center justify-center text-white transition-colors">
                      <User className="size-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Chofer</span>
                      <span className="text-sm font-black text-slate-700 dark:text-slate-200 transition-colors truncate">
                        {assignedDriverName || "No asignado"}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => showConfirm({
                      title: "Liberar Unidad",
                      description: (
                        <>¿Estás seguro que deseas liberar la unidad <strong className="text-slate-900 dark:text-slate-100">{unit.name}</strong>? El chofer <strong className="text-slate-900 dark:text-slate-100">{assignedDriverName || ""}</strong> quedará sin unidad asignada.</>
                      ),
                      actionLabel: "Liberar",
                      icon: LogOut,
                      iconColor: "text-red-500",
                      onConfirm: () => onAssign("")
                    })}
                    className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors py-1 flex items-center justify-center"
                  >
                    Liberar Unidad
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => showConfirm({
                      title: "Marcar como Disponible",
                      description: (
                        <>¿La unidad <strong className="text-slate-900 dark:text-slate-100">{unit.name}</strong> ha terminado mantenimiento y está lista para operar?</>
                      ),
                      actionLabel: "Marcar Disponible",
                      icon: RefreshCw,
                      iconColor: "text-emerald-500",
                      onConfirm: () => onAssign("")
                    })}
                    className="w-full bg-slate-50 hover:bg-slate-600 dark:bg-emerald-500/5 dark:hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-400 dark:hover:text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all border border-emerald-200 dark:border-emerald-500/20 hover:border-emerald-600 active:scale-95 shadow-sm"
                  >
                    Marcar como Disponible
                  </button>
                  <div className="py-2 h-8" />
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col gap-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccionar Chofer</label>
                
                {/* Custom Select Trigger */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => !isLoadingDrivers && !driverError && setIsSelectorOpen(!isSelectorOpen)}
                    disabled={isLoadingDrivers || !!driverError}
                    className={cn(
                      "w-full h-11 bg-slate-50 dark:bg-[#0F172A]/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-4 text-sm font-medium flex items-center justify-between transition-all hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
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

                  {/* Dropdown Menu */}
                  {isSelectorOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 bg-transparent" 
                        onClick={() => setIsSelectorOpen(false)}
                      />
                      <div className="absolute top-[calc(100%+6px)] left-0 w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top">
                        {/* Internal Search */}
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

                        {/* Options List */}
                        <div className="max-h-[180px] overflow-y-auto py-1 no-scrollbar">
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
                                  "w-full px-4 py-2 text-left text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between group",
                                  selectedDriverId === d.id && "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                                )}
                              >
                                <div className="flex flex-col">
                                  <span>{d.name}</span>
                                  {d.sucursal && (
                                    <span className="text-[9px] text-slate-400 group-hover:text-slate-500 uppercase font-bold">{d.sucursal}</span>
                                  )}
                                </div>
                                {selectedDriverId === d.id && <Check className="w-4 h-4" />}
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
              <div className="flex gap-2">
                <button
                  onClick={() => setIsAssigning(false)}
                  className="flex-1 h-11 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    const driver = allDrivers.find(d => d.id === selectedDriverId);
                    showConfirm({
                      title: "Confirmar Asignación",
                      description: (
                        <>¿Deseas asignar a <strong className="text-slate-900 dark:text-slate-100">{driver?.name}</strong> como chofer de la unidad <strong className="text-slate-900 dark:text-slate-100">{unit.name}</strong>?</>
                      ),
                      actionLabel: "Asignar",
                      icon: BadgeCheck,
                      iconColor: "text-blue-500",
                      onConfirm: handleAssign
                    });
                  }}
                  disabled={!selectedDriverId}
                  className="flex-[2] h-11 bg-slate-100 hover:bg-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-white dark:text-slate-400 dark:hover:text-white rounded-xl font-bold text-xs uppercase tracking-widest border border-slate-400/80 dark:border-slate-500 hover:border-slate-600 active:scale-95 disabled:opacity-50 transition-all shadow-sm"
                >
                  Asignar
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={confirmDialog.show} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, show: open }))}>
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle>
              {confirmDialog.title}
            </DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed pt-2">
              {confirmDialog.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button variant="outline" className="cursor-pointer">
                Cancelar
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button 
                onClick={confirmDialog.onConfirm}
                className="cursor-pointer"
              >
                {confirmDialog.actionLabel}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
