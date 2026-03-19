"use client";

import { useState } from "react";
import { MOCK_LOGISTICS_DATA, LogisticsRow } from "@/features/logistics/models";
import { MOCK_DRIVERS, DriverBlock } from "@/features/logistics/models/drivers";
import { Truck, PackageCheck, AlertTriangle, Calendar, User, CheckCircle2, Pencil, MapPin, Grid3x3, LayoutGrid, PaintbrushVertical, Scale, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const BLOCKS: DriverBlock[] = ["Aztlan", "Felix U. Gomez", "General Escobedo", "Camino Real"];

function OrderCard({
  invoice,
  onAssign
}: {
  invoice: LogisticsRow;
  onAssign: (id: string, driverId: string) => void;
}) {
  const isAssigned = !!invoice.assignedDriverId;
  const assignedDriver = MOCK_DRIVERS.find(d => d.id === invoice.assignedDriverId);

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

  const availableDrivers = MOCK_DRIVERS.filter(d => d.block === assignedBlock);

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
    <div className={cn(
      "flex flex-col bg-white dark:bg-[#1E293B] rounded-2xl p-5 border transition-all",
      isAssigned && !isEditing
        ? "border-emerald-200 dark:border-emerald-900/50 shadow-sm"
        : "border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md"
    )}>
      {/* Info Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center font-black text-sm shadow-sm", invoice.clientColor)}>
          {invoice.clientInitials}
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase">
              #{invoice.id}
            </span>
            {invoice.type === 'anticipada' && (
              <span className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                Anticipada
              </span>
            )}
            {isAssigned && !isEditing && (
              <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-black tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" />
                <span>ASIGNADO</span>
              </div>
            )}
          </div>
          <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">
            {invoice.clientName}
          </span>
        </div>
      </div>

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

      <div className="flex items-start gap-2 text-xs font-medium text-slate-600 dark:text-slate-300 mb-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/50">
        <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-700 dark:text-slate-200 block mb-0.5">Ubicación de Entrega:</span>
          <span>{invoice.address || fallbackAddress}</span>
        </div>
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

      {/* Anticipada Progress */}
      {invoice.type === 'anticipada' && invoice.totalDeliveries && invoice.completedDeliveries != null && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Entregas completadas
            </span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {invoice.completedDeliveries} / {invoice.totalDeliveries}
            </span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-500 dark:bg-slate-400 rounded-full transition-all duration-500"
              style={{ width: `${(invoice.completedDeliveries / invoice.totalDeliveries) * 100}%` }}
            />
          </div>
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
                {assignedDriver.block}
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 block">
                Chofer Asignado
              </p>
              <div className="w-full flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold bg-slate-50 dark:bg-slate-800/50 h-11 rounded-xl px-3 text-sm border border-slate-100 dark:border-slate-700">
                <User className="w-4 h-4 text-emerald-500" />
                <span>{assignedDriver.name}</span>
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

            <div>
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 block">
                Seleccionar Chofer
              </label>
              <select
                value={selectedDriver}
                onChange={handleDriverChange}
                className="w-full h-11 bg-slate-50 dark:bg-[#0F172A]/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 transition-all cursor-pointer"
              >
                <option value="" disabled hidden className="bg-white dark:bg-[#0F172A]">Selecciona un chofer...</option>
                {availableDrivers.map(d => <option key={d.id} value={d.id} className="bg-white dark:bg-[#0F172A]">{d.name}</option>)}
              </select>
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
                onClick={handleAssignClick}
                disabled={!selectedDriver}
                className="flex-[2] h-11 flex items-center justify-center rounded-xl text-sm font-semibold text-white bg-slate-600 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                Asignar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AsignarRutaPage() {
  const [invoices, setInvoices] = useState<LogisticsRow[]>(
    MOCK_LOGISTICS_DATA.filter((r) => r.estadoGeneral === "ready" && !(r.isUrgent && r.type !== 'anticipada'))
  );

  const [filter, setFilter] = useState<'todos' | 'pendientes' | 'asignados'>('todos');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAssignDriver = (id: string, driverId: string) => {
    // Modifica el estado "global" del mock en memoria para sincronización entre vistas (solo prototipo, sin persistencia remota).
    const globalInvoice = MOCK_LOGISTICS_DATA.find(inv => inv.id === id);
    if (globalInvoice) {
      globalInvoice.assignedDriverId = driverId;
    }

    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, assignedDriverId: driverId } : inv))
    );
  };

  const assignedCount = invoices.filter(i => i.assignedDriverId).length;
  const pendingCount = invoices.length - assignedCount;

  const filteredInvoices = invoices.filter(i => {
    const matchesFilter = filter === 'pendientes'
      ? !i.assignedDriverId
      : filter === 'asignados'
        ? !!i.assignedDriverId
        : true;

    const matchesSearch = searchQuery === '' ||
      i.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.id.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="w-full flex flex-col gap-4 h-full pb-12 -mt-2 md:-mt-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Left column: Title & Search Bar */}
        <div className="flex flex-col gap-3 w-full md:w-auto">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
            Asignación de Pedidos
          </h1>
          <div className="relative group w-full md:w-[320px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 size-4.5 transition-colors group-focus-within:text-blue-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar factura o cliente..."
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-[3px] focus:ring-blue-500/20 focus:border-blue-500 text-[15px] text-slate-800 dark:text-slate-100 w-full shadow-sm transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 font-medium"
            />
          </div>
        </div>

        {/* Right column: Filter Buttons */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
          <button
            onClick={() => setFilter('todos')}
            className={cn(
              "px-5 py-3 rounded-2xl flex flex-col items-center min-w-[100px] transition-all border",
              filter === 'todos'
                ? "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 shadow-md ring-2 ring-blue-500/20"
                : "bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-blue-300"
            )}
          >
            <span className={cn("text-2xl font-black mb-0.5", filter === 'todos' ? "text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300")}>
              {invoices.length}
            </span>
            <span className={cn("text-[10px] uppercase font-bold tracking-wider", filter === 'todos' ? "text-blue-600 dark:text-blue-400" : "text-slate-500")}>
              Todos
            </span>
          </button>

          <button
            onClick={() => setFilter('pendientes')}
            className={cn(
              "px-5 py-3 rounded-2xl flex flex-col items-center min-w-[100px] transition-all border",
              filter === 'pendientes'
                ? "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 shadow-md ring-2 ring-slate-400/20"
                : "bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-slate-300"
            )}
          >
            <span className={cn("text-2xl font-black mb-0.5", filter === 'pendientes' ? "text-slate-800 dark:text-slate-200" : "text-slate-700 dark:text-slate-300")}>
              {pendingCount}
            </span>
            <span className={cn("text-[10px] uppercase font-bold tracking-wider", filter === 'pendientes' ? "text-slate-600 dark:text-slate-400" : "text-slate-500")}>
              Pendientes
            </span>
          </button>

          <button
            onClick={() => setFilter('asignados')}
            className={cn(
              "px-5 py-3 rounded-2xl flex flex-col items-center min-w-[100px] transition-all border",
              filter === 'asignados'
                ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 shadow-md ring-2 ring-emerald-500/20"
                : "bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-emerald-300"
            )}
          >
            <span className={cn("text-2xl font-black mb-0.5", filter === 'asignados' ? "text-emerald-700 dark:text-emerald-400" : "text-emerald-600 dark:text-emerald-500/70")}>
              {assignedCount}
            </span>
            <span className={cn("text-[10px] uppercase font-bold tracking-wider", filter === 'asignados' ? "text-emerald-600 dark:text-emerald-400" : "text-emerald-600/70 dark:text-emerald-500/50")}>
              Asignados
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      {filteredInvoices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-3xl">
          <PackageCheck className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-1">
            No hay pedidos listos
          </h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            Los pedidos aparecerán aquí cuando su estado en logística cambie a Listo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredInvoices.map((invoice) => (
            <OrderCard key={invoice.id} invoice={invoice} onAssign={handleAssignDriver} />
          ))}
        </div>
      )}
    </div>
  );
}
