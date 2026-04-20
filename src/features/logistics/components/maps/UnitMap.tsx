"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { Truck } from "lucide-react";
import { renderToString } from "react-dom/server";

// Icono personalizado premium para la unidad (Camión)
const customIcon = L.divIcon({
  html: renderToString(
    <div className="relative flex items-center justify-center">
      {/* Sombra proyectada */}
      <div className="absolute inset-x-0 bottom-0 top-1/2 bg-black/20 blur-md rounded-full scale-x-150" />
      
      {/* Pulso de señal (Ping) */}
      <div className="absolute inset-0 animate-ping rounded-full bg-blue-500/40 h-10 w-10" />
      
      {/* Contenedor del Icono Principal */}
      <div className="relative bg-white dark:bg-slate-900 p-2.5 rounded-2xl shadow-2xl border-2 border-blue-500 transform transition-shadow duration-300">
        <Truck className="size-6 text-blue-600 dark:text-blue-400" />
        
        {/* Indicador de frente */}
        <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-blue-500" />
      </div>
    </div>
  ),
  className: "custom-unit-marker",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.setView(center, map.getZoom(), { animate: true });
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
  const center: [number, number] = [lat, lng];

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
        {/* lyrs=m significa "Standard Roadmap" de Google. Esto da el aspecto IDÉNTICO que el usuario desea */}
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          maxZoom={20}
        />
        
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
        
        <MapController center={center} />
      </MapContainer>
      
      {/* Sutil overlay de contraste para que se sienta integrado al dashboard */}
      <div className="absolute inset-0 pointer-events-none border-[1px] border-black/5 dark:border-white/5" />
    </div>
  );
}
