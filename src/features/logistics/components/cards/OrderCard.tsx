"use client";

import { useState } from "react";
import {
  Grid3x3,
  LayoutGrid,
  PaintbrushVertical,
  CheckCircle2,
  Calendar,
  Scale,
  MapPin,
  User,
  Pencil,
  ExternalLink,
  ChevronDown,
  Search as SearchIcon,
  Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
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
import { LogisticsRow } from "@/features/logistics/models";
import { Driver, DriverBlock } from "@/features/logistics/models/drivers";

const BLOCKS: DriverBlock[] = ["Aztlan", "Felix U. Gomez", "General Escobedo", "Camino Real"];

interface OrderCardProps {
  invoice: LogisticsRow;
  onAssign: (id: string, driverId: string) => void;
  externalDrivers?: Driver[];
  isLoadingDrivers?: boolean;
  driversError?: string | null;
}

export function OrderCard({ invoice, onAssign, externalDrivers = [], isLoadingDrivers, driversError }: OrderCardProps) {
  const isAssigned = !!invoice.assignedDriverId;
  const assignedDriver = externalDrivers.find(d => d.id === invoice.assignedDriverId);

  const rootBlockIndex = parseInt(invoice.id.replace(/\D/g, '') || '0', 10);
  const assignedBlock = assignedDriver?.block || BLOCKS[rootBlockIndex % BLOCKS.length];

  const addressByBlock: Record<string, string[]> = {
    "Aztlan": [
      "Av. Aztlán 4560, San Bernabé, Monterrey",
      "Av. Cabezada 800, Barrio Solidaridad, Monterrey",
      "Julio A. Roca 102, Fomerrey, Monterrey"
    ],
    "Felix U. Gomez": [
      "Av. Félix U. Gómez 1500, Terminal, Monterrey",
      "Carlos Salazar 300, Centro, Monterrey",
      "Av. Colón 1200, Centro, Monterrey"
    ],
    "General Escobedo": [
      "Av. Raúl Salinas Lozano 800, Gral. Escobedo",
      "Av. Sendero Divisorio 1001, Gral. Escobedo",
      "Av. Juárez 300, Centro, Gral. Escobedo"
    ],
    "Camino Real": [
      "Av. Camino Real 401, Barrio del Parque, Mty",
      "Calle Nueva 123, Fomerrey, Monterrey",
      "Blvd. Camino Real 900, Pedregal, Monterrey"
    ]
  };

  const blockAddresses = addressByBlock[assignedBlock] || ["Av. de los Leones 123, Monterrey"];
  const fallbackAddress = blockAddresses[rootBlockIndex % blockAddresses.length];

  let calculatedWeight = 0;
  if (invoice.aluminio !== 'none') calculatedWeight += (rootBlockIndex * 17 % 290) + 10;
  if (invoice.vidrio !== 'none') calculatedWeight += (rootBlockIndex * 13 % 750) + 50;
  if (invoice.herrajes !== 'none') calculatedWeight += (rootBlockIndex * 7 % 14) + 1;
  if (calculatedWeight === 0) calculatedWeight = 5;

  const peso = (invoice as any).peso || `${calculatedWeight} kg`;

  const materials = [
    { label: "ALUM.", Icon: Grid3x3, status: invoice.aluminio, count: (rootBlockIndex * 3 % 8) + 1 },
    { label: "VID.", Icon: LayoutGrid, status: invoice.vidrio, count: (rootBlockIndex * 5 % 12) + 1 },
    { label: "HERR.", Icon: PaintbrushVertical, status: invoice.herrajes, count: (rootBlockIndex * 7 % 5) + 1 },
  ].filter(m => m.status !== 'none');

  const [isEditing, setIsEditing] = useState(!isAssigned);
  const [selectedDriver, setSelectedDriver] = useState<string>(invoice.assignedDriverId || "");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);

  // Estados para el Selector Personalizado
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [driverSearch, setDriverSearch] = useState("");

  // Available drivers are now all external drivers (no filtering by block as requested)
  const availableDrivers = externalDrivers;

  const filteredDriversForSelect = availableDrivers.filter(d => 
    d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
    d.sucursal?.toLowerCase().includes(driverSearch.toLowerCase())
  );

  const selectedDriverData = externalDrivers.find(d => d.id === selectedDriver);

  const handleDriverChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDriver(e.target.value);
  };

  const handleAssignClick = () => {
    if (selectedDriver) {
      onAssign(invoice.id, selectedDriver);
      setIsEditing(false);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  return (
    <Card className={cn(
      "transition-all h-full flex flex-col hover:shadow-md",
      isAssigned && !isEditing
        ? "border-emerald-200 dark:border-emerald-900/50 shadow-sm"
        : "border-slate-200 dark:border-slate-800 shadow-sm"
    )}>
      {/* Info Header */}
      <CardHeader className="flex flex-col mb-0 pb-4 overflow-hidden">
        <div className="flex items-center gap-1.5 mb-1 whitespace-nowrap overflow-hidden">
          <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase shrink-0">
            #{invoice.id}
          </CardTitle>
          {invoice.type === 'anticipada' && (
            <div className="flex items-center gap-1 shrink-0">
              <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-slate-200 dark:border-slate-700">
                Anticipada
              </span>
              {invoice.completedDeliveries != null && (
                <span className="bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase border border-blue-200 dark:border-blue-500/20 shadow-sm">
                  Entregado: {invoice.completedDeliveries}
                </span>
              )}
            </div>
          )}
          {isAssigned && !isEditing && (
            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-500/20 shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              <span>ASIGNADO</span>
            </div>
          )}
        </div>
        <span className="text-slate-500 dark:text-slate-400 font-medium text-[15px] truncate block leading-none">
          {invoice.clientName}
        </span>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>{invoice.date}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            <Scale className="w-3.5 h-3.5 text-slate-400" />
            <span>{peso}</span>
          </div>
        </div>

        <div 
          onClick={() => setShowMapModal(true)}
          className="flex items-start gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 mb-3 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50 cursor-pointer transition-colors group"
        >
          <MapPin className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0 mt-0.5 transition-colors" />
          <div className="flex-1">
            <span className="font-bold text-slate-700 dark:text-slate-200 block mb-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Ubicación de Entrega:</span>
            <span>{invoice.address || fallbackAddress}</span>
          </div>
          <ExternalLink className="w-4 h-4 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 shrink-0 mt-0.5 transition-all group-hover:text-blue-500" />
        </div>

        {materials.length > 0 && (
          <div className="flex flex-wrap gap-x-3 gap-y-2.5 mb-5 mt-1">
            {materials.map(({ label, Icon, count }) => (
              <div key={label} className="relative">
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 px-2.5 py-1 rounded-lg">
                  <Icon className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
                </div>
                <div className="absolute -top-2 -right-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold">
                  {count}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Assignment Logic */}
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800">
          {!isEditing && isAssigned && assignedDriver ? (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Bloque
                </p>
                <div className="w-full h-11 flex items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl px-3 text-sm font-semibold">
                  {assignedBlock}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Chofer Asignado
                </p>
                <div className="w-full flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold bg-slate-50 dark:bg-slate-800/50 h-11 rounded-xl px-3 text-sm border border-slate-100 dark:border-slate-700">
                  <User className="w-4 h-4 text-emerald-500" />
                  <span className="truncate">{assignedDriver.name}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md shrink-0">
                    {assignedDriver.sucursal}
                  </span>
                </div>
              </div>
              <button
                onClick={handleEditClick}
                className="mt-2 w-full flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              >
                <Pencil className="w-4 h-4" />
                Editar Asignación
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Bloque
                </p>
                <div className="w-full h-11 flex items-center bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl px-3 text-sm font-semibold">
                  {assignedBlock}
                </div>
              </div>

              <div className="relative">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 block">
                  Seleccionar Chofer
                </label>
                
                {/* Custom Select Trigger */}
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => !isLoadingDrivers && !driversError && setIsSelectorOpen(!isSelectorOpen)}
                    disabled={isLoadingDrivers || !!driversError}
                    className={cn(
                      "w-full h-11 bg-slate-50 dark:bg-[#0F172A]/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-4 text-sm font-medium flex items-center justify-between transition-all hover:border-slate-300 dark:hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                      isSelectorOpen && "ring-2 ring-blue-500/20 border-blue-500 dark:border-blue-500/50",
                      driversError && "border-red-300 dark:border-red-900/50 text-red-500"
                    )}
                  >
                    <span className="truncate">
                      {isLoadingDrivers ? "Cargando choferes..." : 
                       driversError ? driversError : 
                       selectedDriverData ? `${selectedDriverData.name} - ${selectedDriverData.sucursal}` : 
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
                        <div className="max-h-[220px] overflow-y-auto py-1 no-scrollbar">
                          {filteredDriversForSelect.length > 0 ? (
                            filteredDriversForSelect.map(d => (
                              <button
                                key={d.id}
                                type="button"
                                onClick={() => {
                                  setSelectedDriver(d.id);
                                  setIsSelectorOpen(false);
                                  setDriverSearch("");
                                }}
                                className={cn(
                                  "w-full px-4 py-2.5 text-left text-[13px] hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between group",
                                  selectedDriver === d.id && "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold"
                                )}
                              >
                                <div className="flex flex-col">
                                  <span>{d.name}</span>
                                  <span className="text-[10px] text-slate-400 group-hover:text-slate-500 uppercase font-medium">{d.sucursal}</span>
                                </div>
                                {selectedDriver === d.id && <Check className="w-4 h-4" />}
                              </button>
                            ))
                          ) : (
                            <div className="px-4 py-8 text-center text-slate-400 text-xs">
                              No se encontraron choferes
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                {isAssigned && (
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setSelectedDriver(assignedDriver?.id || "");
                    }}
                    className="flex-1 h-11 flex items-center justify-center rounded-xl text-sm font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                )}
                <button
                  onClick={() => setShowConfirm(true)}
                  disabled={!selectedDriver}
                  className="flex-[2] h-11 flex items-center justify-center rounded-xl text-sm font-semibold text-white bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Asignar
                </button>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader className="text-left">
            <DialogTitle>Confirmar Asignación</DialogTitle>
            <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed pt-2">
              ¿Deseas asignar el pedido <strong className="text-slate-900 dark:text-slate-100">#{invoice.id}</strong> al chofer <strong className="text-slate-900 dark:text-slate-100">{externalDrivers.find(d => d.id === selectedDriver)?.name}</strong>?
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
                onClick={handleAssignClick}
                className="cursor-pointer"
              >
                Confirmar Asignación
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showMapModal} onOpenChange={setShowMapModal}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl w-11/12 h-[80vh] flex flex-col p-0 overflow-hidden gap-0">
          <DialogHeader className="p-4 md:p-6 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="pr-6 text-left">
              <DialogTitle className="text-xl">Ubicación de Entrega</DialogTitle>
              <DialogDescription className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                {invoice.address || fallbackAddress}
              </DialogDescription>
            </div>
          </DialogHeader>
          <div className="flex-1 w-full relative bg-slate-100 dark:bg-slate-900 overflow-hidden">
             <iframe
                className="w-full h-full"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent(invoice.address || fallbackAddress)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
              ></iframe>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
