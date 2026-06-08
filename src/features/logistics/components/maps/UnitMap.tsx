"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Truck } from "lucide-react";
import { renderToString } from "react-dom/server";



function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (map && typeof map.getContainer === 'function' && map.getContainer()) {
          map.invalidateSize();
          map.setView(center, map.getZoom(), { animate: false });
        }
      } catch (e) {
        console.warn("Leaflet map container was unmounted before update.", e);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [center, map]);
  
  return null;
}

interface UnitMapProps {
  lat: number;
  lng: number;
  unitName: string;
}

export default function UnitMap({ lat, lng, unitName }: UnitMapProps) {
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");
  const center: [number, number] = [lat, lng];

  const customIcon = typeof window !== 'undefined' ? L.divIcon({
    html: renderToString(
      <div className="relative flex items-center justify-center">
        {/* Pulso de señal (Ping) */}
        <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/30 h-12 w-12" />
        
        {/* Contenedor principal de la chincheta circular */}
        <div className="relative bg-gradient-to-br from-blue-600 to-blue-500 text-white p-2.5 rounded-full shadow-[0_4px_16px_rgba(37,99,235,0.4)] border-2 border-white dark:border-slate-900 flex items-center justify-center transition-all duration-300 hover:scale-110">
          <Truck className="size-5.5 text-white" />
          
          {/* Cola/Puntero inferior de la chincheta */}
          <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 rotate-45 border-r-2 border-b-2 border-white dark:border-slate-900 z-[-1]" />
        </div>
      </div>
    ),
    className: "custom-unit-marker",
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  }) : null;

  return (
    <div className="h-full w-full relative overflow-hidden">
      <MapContainer
        center={center}
        zoom={16}
        scrollWheelZoom={true}
        className="h-full w-full z-0"
        style={{ height: '100%', width: '100%' }}
      >
        {/* CAPA REAL DE GOOGLE MAPS (Street View Tiles) */}
        <TileLayer
          key={mapType}
          attribution='&copy; Google Maps'
          url={
            mapType === "roadmap"
              ? "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              : "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          }
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          maxZoom={20}
        />
        
        {customIcon && (
          <Marker position={center} icon={customIcon}>
            <Popup className="custom-popup" offset={[0, -10]}>
              <div className="p-2 min-w-[120px]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-black uppercase tracking-tighter text-blue-500/80">Monitoreo Real</span>
                  <span className="text-sm font-bold text-slate-800 leading-tight">{unitName}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
        
        <MapController center={center} />
      </MapContainer>

      {/* Selector de Capa Flotante */}
      <div className="absolute top-3 right-3 z-[400] flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm p-1 rounded-xl shadow-lg border border-slate-200/80 dark:border-slate-800/80 transition-all select-none">
        <button
          onClick={() => setMapType("roadmap")}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            mapType === "roadmap"
              ? "bg-blue-600 text-white shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Mapa
        </button>
        <div className="w-[1px] h-3.5 bg-slate-200 dark:bg-slate-800 mx-1" />
        <button
          onClick={() => setMapType("hybrid")}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
            mapType === "hybrid"
              ? "bg-blue-600 text-white shadow-sm font-bold"
              : "text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          Satélite
        </button>
      </div>
      
      {/* Sutil overlay de contraste para que se sienta integrado al dashboard */}
      <div className="absolute inset-0 pointer-events-none border-[1px] border-black/5 dark:border-white/5" />
    </div>
  );
}
