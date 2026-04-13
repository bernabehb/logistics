"use client";

import { useState, useMemo } from "react";
import { Building2, Home, Search as SearchIcon, Truck, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RutaOrderCard, RutaPedido } from "@/features/logistics/components/cards/RutaOrderCard";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const BLOCKS_LIST = [
  "AZTLAN 1", "AZTLAN 2", "AZTLAN 3", "AZTLAN 4",
  "CAMINO REAL 1", "CAMINO REAL 2", "CAMINO REAL 3", "CAMINO REAL 4",
  "FELIX U. GOMEZ", "GENERAL ESCOBEDO", "LA AURORA"
];

const VENDORES = ["Juan Carlos", "Elena García", "Pedro S.", "Marta Ruiz", "Ricardo M."];
const CLIENTS = ["Grupo Vitro MTY", "Distribuidora Apex", "Vidriería Ríos", "Aluminios del Norte", "Ferremax SA", "Construcciones García", "Inmobiliaria Altamira", "Construrama Escobedo"];
const WAREHOUSES = ["Aluminio", "Vidrio", "Herrajes"];

// Helper to generate static mock data for all blocks
const generateMockData = (): (RutaPedido & { block: string })[] => {
  const allPedidos: (RutaPedido & { block: string })[] = [];

  BLOCKS_LIST.forEach((block, blockIdx) => {
    // Each block gets 2 to 9 total orders to have 1-5 domicilio orders
    const count = 2 + (blockIdx % 8);
    for (let i = 1; i <= count; i++) {
      const idNum = 2500 + (blockIdx * 10) + i;
      const clientIdx = (idNum + i) % CLIENTS.length;
      const vendorIdx = (idNum * i) % VENDORES.length;

      // Determine warehouses (1, 2 or 3) and assign statuses
      const whCount = (idNum % 3) + 1;
      const selectedWh: { id: string; status: 'pending' | 'in-progress' | 'ready' }[] = [];
      const STATUSES: ('pending' | 'in-progress' | 'ready')[] = ['pending', 'in-progress', 'ready'];

      for (let j = 0; j < whCount; j++) {
        const warehouseId = WAREHOUSES[(idNum + j) % 3];
        const statusIdx = (blockIdx + i + j) % 3;
        selectedWh.push({
          id: warehouseId,
          status: STATUSES[statusIdx]
        });
      }

      // Force Vidrio and Corte ONLY for the first qualifying domicilio item in AZTLAN 3 and AZTLAN 4
      const isTargetBlock = block === "AZTLAN 3" || block === "AZTLAN 4";
      const hasVidrio = selectedWh.some(w => w.id === "Vidrio");
      let hasGlassCut = hasVidrio && (idNum % 8 === 0);

      const isFirstDomicilioInBlock = (block === "AZTLAN 3" && i === 2) || (block === "AZTLAN 4" && i === 1);

      if (isTargetBlock && isFirstDomicilioInBlock) {
        // Ensure this specific card has Vidrio and Corte
        if (!hasVidrio) {
          selectedWh.push({ id: "Vidrio", status: "pending" });
        }
        hasGlassCut = true;
      }

      allPedidos.push({
        id: `FAC-${idNum}A`,
        clientName: CLIENTS[clientIdx],
        date: `2025-0${(idNum % 9) + 1}-${(idNum % 28) + 1}`,
        warehouses: selectedWh,
        vendedor: VENDORES[vendorIdx],
        deliveryType: (blockIdx + i) % 2 === 0 ? 'domicilio' : 'sucursal',
        block: block,
        hasGlassCut: hasGlassCut
      });
    }
  });

  return allPedidos;
};

const STATIC_DATA = generateMockData();

export default function RutasPage() {
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState<'sucursal' | 'domicilio'>('domicilio');
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPedidos = useMemo(() => {
    const filtered = STATIC_DATA.filter((p) => {
      const matchesFilter = p.deliveryType === deliveryTypeFilter;
      const matchesSearch = p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.clientName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });

    // Limit sucursal invoices to 11 as requested to avoid clutter
    if (deliveryTypeFilter === "sucursal") {
      return filtered.slice(0, 11);
    }

    return filtered;
  }, [deliveryTypeFilter, searchQuery]);

  // Grouping
  const groupedData = useMemo(() => {
    const groups: Record<string, RutaPedido[]> = {};
    BLOCKS_LIST.forEach(b => groups[b] = []);
    filteredPedidos.forEach(p => {
      if (groups[p.block]) groups[p.block].push(p);
    });
    return groups;
  }, [filteredPedidos]);

  return (
    <div className="w-full flex flex-col gap-4 h-full pb-12 -mt-2 md:-mt-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all w-full mb-2">
        {/* Title & Search Column */}
        <div className="flex flex-col gap-3 w-full md:w-auto shrink-0">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 transition-colors">
            Gestión de rutas
          </h1>

          <div className="relative group w-full md:w-[320px]">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-slate-500 transition-colors pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por factura o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-[#1E293B] border-slate-200 dark:border-slate-800 rounded-2xl pl-12 pr-4 h-11 text-sm focus-visible:ring-slate-500/20 shadow-sm transition-all placeholder:text-slate-400 font-medium"
            />
          </div>
        </div>

        {/* Filter Buttons Section */}
        <div className="flex flex-wrap items-center gap-3 ml-auto">
          <div className="flex items-center gap-1 bg-slate-100/50 dark:bg-[#1E293B] p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 h-11 transition-all">
            {[
              { id: 'domicilio', label: 'Domicilio', Icon: Home },
              { id: 'sucursal', label: 'Sucursal', Icon: Building2 },
            ].map((btn) => (
              <button
                key={btn.id}
                onClick={() => setDeliveryTypeFilter(btn.id as any)}
                className={cn(
                  "flex items-center gap-2 px-6 py-2 rounded-xl text-xs font-bold uppercase transition-all",
                  deliveryTypeFilter === btn.id
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {btn.Icon && <btn.Icon className="size-4" />}
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content View */}
      {deliveryTypeFilter === 'domicilio' ? (
        /* 11 Block Cards Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {BLOCKS_LIST.map((blockName) => {
            const items = groupedData[blockName] || [];
            return (
              <Card key={blockName} className="border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 rounded-2xl overflow-hidden flex flex-col h-full shadow-sm">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-800 px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                      {items.length} Pedidos
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider leading-none">
                      Bloque: {blockName}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-[10px] font-black border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-2 bg-white dark:bg-slate-800 shadow-sm opacity-80 hover:opacity-100 transition-all hover:bg-slate-50"
                    >
                      <Truck className="size-3.5" />
                      <span className="uppercase tracking-widest">Unidad</span>
                      <ChevronDown className="size-3 opacity-50" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="px-2 py-4 flex-1">
                  {items.length > 0 ? (
                    <div className="flex flex-col gap-3 max-h-[510px] overflow-y-auto pr-2 custom-scrollbar">
                      {items.map(p => (
                        <div key={p.id} className="shrink-0">
                          <RutaOrderCard pedido={p} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800/50 rounded-3xl opacity-40">
                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Sin resultados</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Direct Order Grid for Sucursal */
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
              filteredPedidos.map(p => (
                <RutaOrderCard key={p.id} pedido={p} />
              ))
            ) : (
              <div className="col-span-full py-20 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center opacity-50">
                <p className="text-sm font-black uppercase tracking-widest text-slate-400">No hay pedidos pendientes en sucursal</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
