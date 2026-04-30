import React, { useState, useRef, useEffect } from "react";
import { MapPin, Truck, FileText, Weight, QrCode, Keyboard, ArrowLeft, CheckCircle, ScanLine, X, User, CircleDollarSign, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export interface Material {
  name: string;
  quantity: string;
}

interface WarehouseGroup {
  warehouse: "Aluminio" | "Vidrio" | "Herrajes" | string;
  materials: Material[];
}

export interface Invoice {
  id: string;
  groups: WarehouseGroup[];
}

export interface FetchedInvoiceDetails {
  factura: string;
  almacenes: {
    almacen: string;
    materiales: {
      material: string;
      cantidad: number;
      unidadVenta: string;
    }[];
  }[];
}

export interface ReadyDeparture {
  id: string;
  unitName: string;
  type: string;
  driverName: string;
  clientName?: string;
  destination: string;
  invoices: Invoice[];
  totalWeightTons: number;
  totalAmount: number;
  deliveryType: "domicilio" | "sucursal";
  locations: string[];
  status: "Pendiente" | "En ruta" | "Completado";
}

interface DepartureCardProps {
  departure: ReadyDeparture;
  onAuthorize: (id: string) => void;
}

export function DepartureCard({ departure, onAuthorize }: DepartureCardProps) {
  const [authStep, setAuthStep] = useState<"method_select" | "active_verification" | "invoice_review" | "trip_verified">("method_select");
  const [selectedMethod, setSelectedMethod] = useState<"manual" | "scanning" | null>(null);
  const [verifiedInvoiceIds, setVerifiedInvoiceIds] = useState<string[]>([]);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);

  const [invoiceInput, setInvoiceInput] = useState("");
  const [isError, setIsError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAuthorizedSuccess, setIsAuthorizedSuccess] = useState(false);

  const [fetchedInvoiceDetails, setFetchedInvoiceDetails] = useState<FetchedInvoiceDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Derived state
  const isTripComplete = verifiedInvoiceIds.length === departure.invoices.length;

  const currentInvoice = React.useMemo(() =>
    departure.invoices.find(inv => inv.id === currentInvoiceId),
    [departure.invoices, currentInvoiceId]
  );

  const remainingInvoices = React.useMemo(() =>
    departure.invoices.filter(inv => !verifiedInvoiceIds.includes(inv.id)),
    [departure.invoices, verifiedInvoiceIds]
  );

  const handleVerificationSuccess = React.useCallback(async (code: string) => {
    setCurrentInvoiceId(code);
    setIsError(false);
    setIsLoadingDetails(true);
    setAuthStep("invoice_review");
    
    try {
      const res = await fetch(`/api/logistics/invoice-details/${code}`);
      if (res.ok) {
        const data = await res.json();
        setFetchedInvoiceDetails(data);
      } else {
        console.error("Failed to fetch invoice details");
        setFetchedInvoiceDetails(null);
      }
    } catch (err) {
      console.error(err);
      setFetchedInvoiceDetails(null);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  // Handle camera stream for "Scanning" step
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        setCameraError(null);
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.warn("Camera access failed:", err.name);
        setCameraError(err.name === "NotFoundError" ? "Dispositivo no encontrado" : "Error de cámara");
      }
    };

    if (authStep === "active_verification" && selectedMethod === "scanning") {
      startCamera();
      setIsCameraActive(true);

      // Simulate an automatic scan after 2 seconds for demo purposes
      const timer = setTimeout(() => {
        if (remainingInvoices.length > 0) {
          const autoCode = remainingInvoices[0].id;
          handleVerificationSuccess(autoCode);
        }
      }, 2000);

      return () => {
        clearTimeout(timer);
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setIsCameraActive(false);
      };
    }
  }, [authStep, selectedMethod, remainingInvoices, handleVerificationSuccess]);

  const confirmInvoiceVerification = async () => {
    if (currentInvoiceId && !verifiedInvoiceIds.includes(currentInvoiceId)) {
      setIsAuthorizing(true);
      try {
        const res = await fetch(`/api/logistics/authorize-invoice/${currentInvoiceId}`, {
          method: 'POST'
        });
        if (!res.ok) throw new Error("Failed to authorize");
        
        // Authorization successful, proceed
        const newVerified = [...verifiedInvoiceIds, currentInvoiceId];
        setVerifiedInvoiceIds(newVerified);

        if (newVerified.length === departure.invoices.length) {
          setAuthStep("trip_verified");
        } else {
          setAuthStep("active_verification");
        }
        setCurrentInvoiceId(null);
        setInvoiceInput("");
        setFetchedInvoiceDetails(null);
      } catch (err) {
        console.error(err);
        alert("Hubo un error al autorizar la carga de la factura.");
      } finally {
        setIsAuthorizing(false);
      }
    }
  };

  const handleManualVerify = () => {
    const normalizedInput = invoiceInput.trim().toUpperCase();
    const targetInvoice = remainingInvoices.find(inv => inv.id.toUpperCase() === normalizedInput);

    if (targetInvoice) {
      handleVerificationSuccess(targetInvoice.id);
    } else {
      setIsError(true);
    }
  };
  const resetAuth = () => {
    setAuthStep("method_select");
    setSelectedMethod(null);
    setVerifiedInvoiceIds([]);
    setCurrentInvoiceId(null);
    setInvoiceInput("");
    setIsError(false);
    setIsAuthorizedSuccess(false);
    setFetchedInvoiceDetails(null);
  };

  const handleFinalAuthorization = () => {
    setIsAuthorizedSuccess(true);
    // Add a delay for the animation before closing
    setTimeout(() => {
      onAuthorize(departure.id);
    }, 1000);
  };

  return (
    <Card className="hover:shadow-md transition-all duration-300 group flex flex-col h-full overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-sm">
      <CardHeader className="flex flex-col justify-start p-4 pt-3 pb-2">
        {/* Header: Unit/Invoice Name */}
        <div className="flex justify-between items-start shrink-0 w-full">
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-nowrap">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight transition-colors truncate">
                {departure.deliveryType === 'sucursal'
                  ? (departure.clientName || "Entrega Cliente")
                  : departure.unitName}
              </CardTitle>
              <span className={cn(
                "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-colors shrink-0 whitespace-nowrap",
                departure.status === "Pendiente"
                  ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20"
                  : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20"
              )}>
                {departure.status === "Pendiente" ? "PENDIENTE" : "EN RUTA"}
              </span>
            </div>
            {/* Subtitle removed as requested */}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Details Section */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 flex-1 flex flex-col gap-2.5 border border-slate-200 dark:border-slate-800/50">
          {/* Driver/Client Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shrink-0">
                <User className="size-4 text-slate-500 dark:text-slate-400" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {departure.deliveryType === 'sucursal' ? "Cliente" : "Chofer"}
              </span>
            </div>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase truncate ml-2 text-right flex-1 min-w-0">
              {departure.deliveryType === 'sucursal' ? (departure.clientName || 'Cliente General') : departure.driverName}
            </span>
          </div>

          {/* Facturas */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shrink-0">
                  <FileText className="size-4 text-slate-500 dark:text-slate-400" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Facturas ({departure.invoices.length})
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pl-1">
              {departure.invoices.map((inv, idx) => (
                <span key={`${inv.id}-${idx}`} className="text-[10px] font-bold px-2 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300">
                  #{inv.id}
                </span>
              ))}
            </div>
          </div>

          {/* Peso y Monto (Fluid layout) */}
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 py-1">
            <div className="flex items-center gap-3 min-w-fit flex-1">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shrink-0 border border-slate-100 dark:border-slate-800 shadow-sm">
                <Weight className="size-4 text-slate-500 dark:text-slate-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  Peso Total
                </span>
                <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                  {departure.totalWeightTons?.toFixed(1)} <span className="text-[9px] opacity-70">KG.</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 min-w-fit flex-1">
              <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shrink-0 border border-slate-100 dark:border-slate-800 shadow-sm">
                <CircleDollarSign className="size-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                  Monto Total
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  ${departure.totalAmount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Locations Section (Timeline Style) */}
          {departure.deliveryType === 'domicilio' && (
            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-blue-50 dark:bg-blue-500/10 rounded-lg shrink-0">
                  <MapPin className="size-3.5 text-blue-500 dark:text-blue-400" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                  Ruta de Entrega
                </span>
              </div>

              <div className="relative pl-3 space-y-4">
                {/* Vertical Connecting Line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-blue-200 to-slate-200 dark:from-blue-500/30 dark:to-slate-700/30 rounded-full" />

                {departure.locations.map((loc, i) => (
                  <div key={i} className="relative flex items-start gap-4 group/stop">
                    {/* Stop Number Indicator */}
                    <div className="relative z-10 flex items-center justify-center size-3.5 bg-white dark:bg-slate-900 border-2 border-blue-400 dark:border-blue-500 rounded-full shrink-0 mt-0.5 group-hover/stop:scale-110 group-hover/stop:bg-blue-50 dark:group-hover/stop:bg-blue-900/40 transition-all">
                      <span className="text-[7.5px] font-black text-blue-600 dark:text-blue-400 leading-none">{i + 1}</span>
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-snug group-hover/stop:text-blue-600 dark:group-hover/stop:text-blue-400 transition-colors">
                        {loc}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="px-5 pb-4">
        <div className="w-full shrink-0">
          {departure.status === "Pendiente" ? (
            <Dialog onOpenChange={(open) => !open && resetAuth()}>
              <DialogTrigger asChild>
                <Button
                  variant="logistics-action" size="logistics-card"
                >
                  Autorizar Salida
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full h-full sm:h-auto sm:max-w-[500px] p-0 overflow-y-auto sm:overflow-hidden bg-white dark:bg-slate-900 border-none shadow-2xl rounded-none sm:rounded-3xl">
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Global Progress Header (Hidden in final success step) */}
                  {authStep !== "trip_verified" && (
                    <div className="space-y-4 animate-in fade-in duration-500">
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Progreso de Validación</p>
                          <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 uppercase leading-none">
                            {verifiedInvoiceIds.length} / {departure.invoices.length} <span className="text-[10px] sm:text-xs normal-case font-bold text-slate-400 ml-1 sm:ml-2">Facturas</span>
                          </h4>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
                            {Math.round((verifiedInvoiceIds.length / departure.invoices.length) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                          style={{ width: `${(verifiedInvoiceIds.length / departure.invoices.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {authStep === "method_select" && (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                      <div className="text-center space-y-2 px-2 sm:px-0">
                        <DialogTitle className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Validar Carga</DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400">
                          Selecciona un método para validar las facturas de <strong>{departure.unitName}</strong>. Este método se mantendrá para todo el viaje.
                        </DialogDescription>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button
                          onClick={() => {
                            setSelectedMethod("manual");
                            setAuthStep("active_verification");
                          }}
                          className="flex flex-col items-center justify-center gap-3 sm:gap-4 p-5 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border-2 border-slate-100 dark:border-slate-800 hover:border-slate-900 dark:hover:border-white transition-all group relative overflow-hidden"
                        >
                          <div className="p-3 sm:p-4 rounded-full bg-white dark:bg-slate-800 shadow-sm group-hover:scale-110 transition-transform text-slate-600 dark:text-slate-300">
                            <Keyboard className="size-6 sm:size-8" />
                          </div>
                          <span className="font-black text-[9px] sm:text-[10px] text-slate-700 dark:text-slate-200 uppercase tracking-[0.15em] sm:tracking-[0.2em] text-center">Ingreso Manual</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedMethod("scanning");
                            setAuthStep("active_verification");
                          }}
                          className="flex flex-col items-center justify-center gap-3 sm:gap-4 p-5 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-400 transition-all group relative overflow-hidden"
                        >
                          <div className="p-3 sm:p-4 rounded-full bg-white dark:bg-slate-800 shadow-sm group-hover:scale-110 transition-transform text-emerald-500">
                            <QrCode className="size-6 sm:size-8" />
                          </div>
                          <span className="font-black text-[9px] sm:text-[10px] text-slate-700 dark:text-slate-200 uppercase tracking-[0.15em] sm:tracking-[0.2em] text-center">Escanear Código</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {authStep === "active_verification" && selectedMethod === "manual" && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => setAuthStep("method_select")} className="rounded-full">
                          <ArrowLeft className="size-5" />
                        </Button>
                        <DialogTitle className="text-lg font-bold uppercase tracking-widest">Validación Manual</DialogTitle>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Factura</label>
                          <Input
                            autoFocus
                            placeholder="Ej: FAC-1001"
                            value={invoiceInput}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              setInvoiceInput(e.target.value);
                              setIsError(false);
                            }}
                            className={cn(
                              "h-14 text-xl font-mono tracking-widest rounded-2xl border-2",
                              isError ? "border-red-500 bg-red-50/50 dark:bg-red-500/10" : "border-slate-100 dark:border-slate-800"
                            )}
                          />
                          {isError && (
                            <p className="text-xs font-bold text-red-500 ml-1 italic animate-pulse">Esta factura no pertenece a este viaje.</p>
                          )}
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">
                            Factura de prueba: <span className="text-slate-900 dark:text-slate-100 font-black tracking-normal">{remainingInvoices[0]?.id}</span>
                          </p>
                        </div>

                        <Button
                          className="w-full h-14 rounded-2xl text-md font-black uppercase tracking-widest bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl transition-all active:scale-95"
                          onClick={handleManualVerify}
                          disabled={!invoiceInput}
                        >
                          Verificar Factura
                        </Button>
                      </div>
                    </div>
                  )}

                  {authStep === "active_verification" && selectedMethod === "scanning" && (
                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" onClick={() => setAuthStep("method_select")} className="rounded-full">
                          <ArrowLeft className="size-5" />
                        </Button>
                        <DialogTitle className="text-lg font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-2">

                          Escaneando Factura...
                        </DialogTitle>
                      </div>

                      <div className="relative h-[75px] w-full bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-inner group/video">
                        {cameraError ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                            <ScanLine className="size-8 text-slate-700 opacity-30" />
                          </div>
                        ) : (
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover grayscale opacity-60"
                          />
                        )}

                        {!cameraError && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[85%] h-10 border-2 border-emerald-500/50 rounded-xl relative">
                              <div className="absolute left-0 w-full h-0.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-scan-line" />
                              <div className="absolute -top-1 -left-1 size-4 border-t-2 border-l-2 border-emerald-500 rounded-tl-lg" />
                              <div className="absolute -top-1 -right-1 size-4 border-t-2 border-r-2 border-emerald-500 rounded-tr-lg" />
                              <div className="absolute -bottom-1 -left-1 size-4 border-b-2 border-l-2 border-emerald-500 rounded-bl-lg" />
                              <div className="absolute -bottom-1 -right-1 size-4 border-b-2 border-r-2 border-emerald-500 rounded-br-lg" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {authStep === "invoice_review" && currentInvoiceId && (
                    <div className="space-y-6 animate-in zoom-in-95 duration-300">
                      <div className="text-center space-y-2 px-2">
                        <DialogTitle className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Revisar Carga</DialogTitle>
                        <p className="text-xs sm:text-sm font-bold text-emerald-500 uppercase tracking-widest">{currentInvoiceId}</p>
                      </div>

                      <div className="space-y-4 max-h-[60vh] sm:max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {isLoadingDetails ? (
                          <div className="flex justify-center items-center py-10">
                            <RefreshCw className="size-8 text-emerald-500 animate-spin" />
                          </div>
                        ) : fetchedInvoiceDetails && fetchedInvoiceDetails.almacenes?.length > 0 ? (
                          fetchedInvoiceDetails.almacenes.map((group, gIdx) => (
                            <div key={gIdx} className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden">
                              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Almacén: {group.almacen}</span>
                                <span className="text-[10px] font-bold text-slate-400 capitalize">{group.materiales.length} productos</span>
                              </div>
                              <table className="w-full text-left">
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {group.materiales.map((mat, mIdx) => (
                                    <tr key={mIdx}>
                                      <td className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200">{mat.material}</td>
                                      <td className="px-4 py-3 text-sm font-black text-slate-900 dark:text-slate-100 text-right">{mat.cantidad} {mat.unidadVenta}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10 text-slate-500 font-bold uppercase text-xs">
                            No se encontraron detalles para esta factura
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <Button
                          variant="ghost"
                          className="h-14 sm:flex-1 rounded-2xl font-bold uppercase tracking-widest text-slate-500 shrink-0"
                          onClick={() => setAuthStep("active_verification")}
                          disabled={isAuthorizing}
                        >
                          Re-intentar
                        </Button>
                        <Button
                          className="h-14 sm:flex-[2] rounded-2xl text-md font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
                          onClick={confirmInvoiceVerification}
                          disabled={isLoadingDetails || isAuthorizing || !fetchedInvoiceDetails}
                        >
                          {isAuthorizing ? <RefreshCw className="size-5 animate-spin" /> : null}
                          Carga Verificada
                        </Button>
                      </div>
                    </div>
                  )}






                  {authStep === "trip_verified" && (
                    <div className="space-y-8 py-4 text-center">
                      {!isAuthorizedSuccess ? (
                        <div className="animate-in zoom-in-95 duration-300 space-y-8">
                          <div className="flex justify-center">
                            <div className="p-5 sm:p-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-4 border-emerald-50 dark:border-emerald-500/10 shadow-lg">
                              <CheckCircle className="size-16 sm:size-20" />
                            </div>
                          </div>

                          <div className="space-y-2 px-2">
                            <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">¡Carga Validada!</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium">
                              Se han verificado las <span className="text-emerald-600 dark:text-emerald-400 font-black">{departure.invoices.length}</span> facturas correctamente.
                            </p>
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-inner group">
                            {departure.deliveryType === 'domicilio' ? (
                              <>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-slate-400 uppercase tracking-widest">Unidad</span>
                                  <span className="font-black text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 transition-colors">{departure.unitName}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                                  <span className="font-bold text-slate-400 uppercase tracking-widest">Chofer</span>
                                  <span className="font-black text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 transition-colors uppercase">{departure.driverName}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-bold text-slate-400 uppercase tracking-widest">Cliente</span>
                                <span className="font-black text-slate-700 dark:text-slate-200 group-hover:text-emerald-600 transition-colors uppercase">{departure.clientName || 'Cliente General'}</span>
                              </div>
                            )}
                          </div>

                          <Button
                            className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] transition-all active:scale-[0.98] hover:translate-y-[-2px]"
                            onClick={handleFinalAuthorization}
                          >
                            Autorizar Salida Ahora
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in duration-500">
                          <div className="p-10 bg-emerald-600 rounded-full text-white shadow-2xl shadow-emerald-500/40">
                            <CheckCircle className="size-24" />
                          </div>

                          <div className="mt-12 text-center animate-in slide-in-from-bottom-4 duration-700 delay-200">
                            <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">¡SALIDA AUTORIZADA!</h2>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          ) : (
            <Button
              variant="logistics-ghost" size="logistics-card" disabled
            >
              Unidad en Ruta
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
