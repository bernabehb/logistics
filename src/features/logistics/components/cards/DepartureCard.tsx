import React, { useState, useRef, useEffect } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { MapPin, Truck, FileText, Weight, QrCode, Keyboard, ArrowLeft, CheckCircle, ScanLine, X, User, CircleDollarSign, RefreshCw, Pencil, Save, Undo2, Trash2, ExternalLink, Clock3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { showConfirm, showError, showSuccess } from "@/lib/mySwal";
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
  orderNum?: number;
  routeDocumentType?: string | null;
  routeDocumentNum?: string | null;
  amount?: number;
  groups: WarehouseGroup[];
  isNew?: boolean;
  isScanned?: boolean;
  isDelivered?: boolean;
}

export interface FetchedInvoiceDetails {
  factura: string;
  almacenes: {
    almacen: string;
    materiales: {
      material: string;
      cantidad: number;
      unidadVenta: string;
      corte?: number;
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
  status: "Pendiente" | "Escaneada" | "En ruta" | "Completado";
  logisticsBranch?: string;
}

type RouteDocumentPayload = {
  documentType: "INVOICE" | "ORDER";
  documentNum: string;
  invoiceNum?: string | null;
  orderNum?: number | null;
};

interface DepartureCardProps {
  departure: ReadyDeparture;
  onAuthorize: (id: string) => void;
  onDelivered?: (id: string) => void;
  onSendScannedInRouteManual?: (id: string) => Promise<void>;
  onReturnToRoutes?: (id: string) => Promise<void>;
  onReturnInvoiceToRoutes?: (document: RouteDocumentPayload) => Promise<void>;
}

export function DepartureCard({ departure, onAuthorize, onDelivered, onSendScannedInRouteManual, onReturnToRoutes, onReturnInvoiceToRoutes }: DepartureCardProps) {
  const [authStep, setAuthStep] = useState<"method_select" | "active_verification" | "invoice_review" | "trip_verified">("method_select");
  const [selectedMethod, setSelectedMethod] = useState<"manual" | "scanning" | null>(null);
  const [verifiedInvoiceIds, setVerifiedInvoiceIds] = useState<string[]>([]);
  const [currentInvoiceId, setCurrentInvoiceId] = useState<string | null>(null);

  const [invoiceInput, setInvoiceInput] = useState("");
  const [isError, setIsError] = useState(false);
  const [isScannerFocused, setIsScannerFocused] = useState(false);
  const scannerInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanMode, setScanMode] = useState<"camera" | "reader">("reader");
  const [isAuthorizedSuccess, setIsAuthorizedSuccess] = useState(false);
  const [isAuthDialogOpen, setIsAuthDialogOpen] = useState(false);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const [fetchedInvoiceDetails, setFetchedInvoiceDetails] = useState<FetchedInvoiceDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [isSendingManualRoute, setIsSendingManualRoute] = useState(false);
  const [isReturningToRoutes, setIsReturningToRoutes] = useState(false);
  const [returningInvoiceNum, setReturningInvoiceNum] = useState<string | null>(null);
  const [isOpeningSamsaraRoute, setIsOpeningSamsaraRoute] = useState(false);
  const [locationOverrides, setLocationOverrides] = useState<string[]>(departure.locations || []);
  const [editingLocationIndex, setEditingLocationIndex] = useState<number | null>(null);
  const [editingAddress, setEditingAddress] = useState("");
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  useEffect(() => {
    setLocationOverrides(departure.locations || []);
  }, [departure.locations]);

  const displayedLocations = locationOverrides.length > 0 ? locationOverrides : departure.locations;

  const formatInvoiceAmount = (amount?: number) =>
    typeof amount === 'number'
      ? amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
      : null;
  const normalizeRouteDocumentType = (value?: string | null): "INVOICE" | "ORDER" => {
    const normalized = (value || "").trim().toUpperCase();
    return normalized === "ORDER" ? "ORDER" : "INVOICE";
  };

  const getInvoiceRouteDocument = (invoice: Invoice): RouteDocumentPayload => {
    const documentType = normalizeRouteDocumentType(invoice.routeDocumentType);
    const invoiceNum = (invoice.id || "").trim();
    const documentNum = String(invoice.routeDocumentNum || (documentType === "ORDER" ? invoice.orderNum : invoiceNum) || invoiceNum || "").trim();

    return {
      documentType,
      documentNum,
      invoiceNum: invoiceNum || null,
      orderNum: invoice.orderNum ?? null,
    };
  };

  const getRouteDocumentKey = (document: RouteDocumentPayload) => `${document.documentType}:${document.documentNum}`;

  const getRouteDocumentLabel = (document: RouteDocumentPayload) =>
    document.documentType === "ORDER" ? `orden ${document.documentNum}` : `factura ${document.documentNum}`;

  // Detección de facturas agregadas posteriormente (desde el backend)
  const addedInvoicesCount = React.useMemo(() =>
    departure.invoices.filter(inv => inv.isNew).length,
    [departure.invoices]
  );

  const verifiableInvoices = React.useMemo(() =>
    departure.invoices.filter(inv => !inv.isDelivered),
    [departure.invoices]
  );

  const verifiableInvoiceCount = Math.max(verifiableInvoices.length, 1);


  const currentInvoice = React.useMemo(() =>
    verifiableInvoices.find(inv => inv.id === currentInvoiceId),
    [verifiableInvoices, currentInvoiceId]
  );

  const remainingInvoices = React.useMemo(() =>
    verifiableInvoices.filter(inv => !verifiedInvoiceIds.includes(inv.id)),
    [verifiableInvoices, verifiedInvoiceIds]
  );

  const handleVerificationSuccess = React.useCallback(async (invoice: Invoice) => {
    setCurrentInvoiceId(invoice.id);
    setIsError(false);
    setIsLoadingDetails(true);
    setAuthStep("invoice_review");

    try {
      const detailsUrl = invoice.orderNum
        ? `/api/logistics/order-details/${invoice.orderNum}`
        : `/api/logistics/invoice-details/${invoice.id}`;

      const res = await fetch(detailsUrl);
      if (res.ok) {
        const data = await res.json();
        setFetchedInvoiceDetails(data);
      } else {
        console.error("Failed to fetch order/invoice details");
        setFetchedInvoiceDetails(null);
      }
    } catch (err) {
      console.error(err);
      setFetchedInvoiceDetails(null);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  // Set isMobileDevice on mount (client-side only to prevent SSR mismatch)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMobileDevice(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    }
  }, []);

  // Auto-detect device and select scanMode
  useEffect(() => {
    if (authStep === "active_verification" && selectedMethod === "scanning") {
      setScanMode(isMobileDevice ? "camera" : "reader");
    }
  }, [authStep, selectedMethod, isMobileDevice]);

  // Focus the scanner input when the scanning screen is active in reader mode
  useEffect(() => {
    if (authStep === "active_verification" && selectedMethod === "scanning" && scanMode === "reader") {
      const focusInput = () => {
        if (scannerInputRef.current) {
          scannerInputRef.current.focus();
          setIsScannerFocused(document.activeElement === scannerInputRef.current);
        }
      };

      focusInput();
      const interval = setInterval(focusInput, 500);

      return () => {
        clearInterval(interval);
      };
    }
  }, [authStep, selectedMethod, scanMode]);

  // Helper to match a scanned or typed sales order against remaining invoices in a fuzzy, robust way
  const matchInvoice = React.useCallback((scannedText: string): Invoice | undefined => {
    const trimmed = scannedText.trim();
    const normalize = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    const normalizedText = normalize(trimmed);
    const hyphenPrefix = normalize(trimmed.split("-")[0].trim());

    return remainingInvoices.find(inv => {
      const candidates = [inv.orderNum?.toString(), inv.id]
        .filter((value): value is string => Boolean(value))
        .map(normalize);

      return candidates.some(candidate =>
        candidate === normalizedText ||
        candidate === hyphenPrefix ||
        normalizedText.startsWith(candidate) ||
        hyphenPrefix.startsWith(candidate) ||
        candidate.startsWith(normalizedText) ||
        candidate.startsWith(hyphenPrefix) ||
        normalizedText.endsWith(candidate) ||
        candidate.endsWith(normalizedText) ||
        hyphenPrefix.endsWith(candidate) ||
        candidate.endsWith(hyphenPrefix)
      );
    });
  }, [remainingInvoices]);

  // Handle camera stream for "Scanning" step with html5-qrcode
  useEffect(() => {
    let html5QrcodeScanner: Html5Qrcode | null = null;
    let isMounted = true;

    if (authStep === "active_verification" && selectedMethod === "scanning" && scanMode === "camera") {
      setCameraError(null);

      const startScanner = async () => {
        try {
          // Wait slightly to ensure the DOM element "camera-reader" is fully rendered
          await new Promise(resolve => setTimeout(resolve, 300));
          if (!isMounted) return;

          // Instantiate Html5Qrcode with formats specific to barcodes + QR Code and optimize detector usage
          html5QrcodeScanner = new Html5Qrcode("camera-reader", {
            formatsToSupport: [
              Html5QrcodeSupportedFormats.CODE_128,
              Html5QrcodeSupportedFormats.CODE_39,
              Html5QrcodeSupportedFormats.CODE_93,
              Html5QrcodeSupportedFormats.EAN_13,
              Html5QrcodeSupportedFormats.EAN_8,
              Html5QrcodeSupportedFormats.UPC_A,
              Html5QrcodeSupportedFormats.UPC_E,
              Html5QrcodeSupportedFormats.ITF,
              Html5QrcodeSupportedFormats.QR_CODE
            ],
            verbose: false,
            useBarCodeDetectorIfSupported: false // Set to false to avoid Safari WebKit native detector bugs
          });

          const qrCodeSuccessCallback = async (decodedText: string) => {
            const targetInvoice = matchInvoice(decodedText);

            if (targetInvoice) {
              if (navigator.vibrate) navigator.vibrate(200);

              // Stop scanning first, then proceed to success state
              try {
                if (html5QrcodeScanner && html5QrcodeScanner.isScanning) {
                  await html5QrcodeScanner.stop();
                }
              } catch (stopErr) {
                console.error("Error stopping scanner after success:", stopErr);
              }
              setScannedCode(null);
              setIsError(false);
              handleVerificationSuccess(targetInvoice);
            } else {
              setScannedCode(decodedText.trim());
              setIsError(true);
            }
          };

          const qrCodeErrorCallback = () => {
            // Ignore frame analysis errors
          };

          const scanConfig = {
            fps: 15,
            qrbox: (width: number, height: number) => {
              const boxWidth = Math.floor(width * 0.95);
              const boxHeight = Math.min(Math.floor(height * 0.85), 180);
              return { width: boxWidth, height: boxHeight };
            },
            videoConstraints: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 }
            }
          };

          await html5QrcodeScanner.start(
            { facingMode: "environment" },
            scanConfig,
            qrCodeSuccessCallback,
            qrCodeErrorCallback
          );
        } catch (err) {
          console.error("Failed to start html5-qrcode scanner:", err);
          if (isMounted) {
            setCameraError("No se pudo conectar a la cámara");
          }
        }
      };

      startScanner();

      return () => {
        isMounted = false;
        if (html5QrcodeScanner) {
          if (html5QrcodeScanner.isScanning) {
            html5QrcodeScanner.stop().catch(err => {
              console.error("Error stopping html5-qrcode scanner on cleanup:", err);
            });
          }
        }
      };
    }
  }, [authStep, selectedMethod, scanMode, matchInvoice, handleVerificationSuccess]);

  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const inputVal = scannerInputRef.current?.value.trim() || "";
      if (inputVal) {
        const targetInvoice = matchInvoice(inputVal);
        if (targetInvoice) {
          setScannedCode(null);
          setIsError(false);
          handleVerificationSuccess(targetInvoice);
        } else {
          setScannedCode(inputVal);
          setIsError(true);
          alert(`La orden de venta "${inputVal}" no pertenece a este viaje.`);
        }
      }
      if (scannerInputRef.current) {
        scannerInputRef.current.value = "";
      }
    }
  };

  const handleFileScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    setIsLoadingDetails(true);
    try {
      const fileScanner = new Html5Qrcode("file-reader-temp");
      const decodedText = await fileScanner.scanFile(file, false);
      const targetInvoice = matchInvoice(decodedText);

      if (targetInvoice) {
        if (navigator.vibrate) navigator.vibrate(200);
        setScannedCode(null);
        setIsError(false);
        handleVerificationSuccess(targetInvoice);
      } else {
        setScannedCode(decodedText.trim());
        setIsError(true);
      }
    } catch (err) {
      console.error("Failed to scan file:", err);
      alert("No se pudo detectar ningún código de barras en la foto. Asegúrate de enfocar bien el código de barras y que no tenga sombras ni reflejos.");
    } finally {
      setIsLoadingDetails(false);
      e.target.value = "";
    }
  };

  const confirmInvoiceVerification = async () => {
    if (currentInvoice && !verifiedInvoiceIds.includes(currentInvoice.id)) {
      setIsAuthorizing(true);
      try {
        const relatedInvoiceIds = currentInvoice.orderNum
          ? verifiableInvoices
            .filter(inv => inv.orderNum === currentInvoice.orderNum)
            .map(inv => inv.id)
          : [currentInvoice.id];

        if (departure.deliveryType === "domicilio") {
          const scanUrl = currentInvoice.orderNum
            ? `/api/logistics/scan-order-for-departure/${currentInvoice.orderNum}`
            : `/api/logistics/scan-invoice-for-departure/${currentInvoice.id}`;

          const res = await fetch(scanUrl, {
            method: 'POST'
          });
          if (!res.ok) throw new Error("Failed to scan order/invoice");
        }

        const newVerified = Array.from(new Set([...verifiedInvoiceIds, ...relatedInvoiceIds]));
        setVerifiedInvoiceIds(newVerified);

        if (newVerified.length === verifiableInvoices.length) {
          setAuthStep("trip_verified");
        } else {
          setAuthStep("active_verification");
        }
        setCurrentInvoiceId(null);
        setInvoiceInput("");
        setFetchedInvoiceDetails(null);
      } catch (err) {
        console.error(err);
        alert("Hubo un error al marcar la orden de venta como escaneada.");
      } finally {
        setIsAuthorizing(false);
      }
    }
  };

  const handleManualVerify = () => {
    const targetInvoice = matchInvoice(invoiceInput);

    if (targetInvoice) {
      setScannedCode(null);
      setIsError(false);
      handleVerificationSuccess(targetInvoice);
    } else {
      setScannedCode(invoiceInput.trim());
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
    setScannedCode(null);
  };

  const handleFinalAuthorization = async () => {
    if (isAuthorizing) return;

    if (departure.deliveryType === "sucursal") {
      const invoiceNums = verifiedInvoiceIds.length > 0
        ? verifiedInvoiceIds
        : verifiableInvoices.map(inv => inv.id).filter(Boolean);
      if (invoiceNums.length === 0) return;

      setIsAuthorizing(true);
      try {
        const res = await fetch('/api/logistics/confirm-branch-pickup-delivery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scannedCode: "",
            invoiceNums
          })
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || data?.success === false) {
          throw new Error(data?.message || data?.error || "No se pudo confirmar la entrega en sucursal.");
        }

        setIsAuthDialogOpen(false);
        onDelivered?.(departure.id);
        resetAuth();
        await showSuccess({
          title: "Entrega confirmada",
          html: data?.message || "La recolección en sucursal fue marcada como entregada.",
          timer: 1600
        });
      } catch (err) {
        console.error(err);
        await showError({
          title: "No se pudo entregar",
          text: err instanceof Error ? err.message : "Hubo un error al confirmar la entrega en sucursal."
        });
      } finally {
        setIsAuthorizing(false);
      }
      return;
    }

    setIsAuthDialogOpen(false);
    onAuthorize(departure.id);
    await new Promise(resolve => setTimeout(resolve, 120));

    await showSuccess({
      title: "Carga escaneada",
      html: `La unidad <b>${departure.unitName}</b> quedó lista para sincronizarse con Samsara.`,
      timer: 1600
    });
  };

  const handleDeliverTrip = async () => {
    const invoiceNums = verifiableInvoices.map(inv => inv.id).filter(Boolean);
    if (invoiceNums.length === 0) {
      onDelivered?.(departure.id);
      await showSuccess({
        title: "Todo entregado",
        html: "Todas las facturas de esta unidad ya estaban marcadas como entregadas.",
        timer: 1600
      });
      return;
    }

    const confirmed = window.confirm(
      `¿Deseas marcar como entregadas las facturas ${invoiceNums.join(", ")}?`
    );
    if (!confirmed) return;

    setIsDelivering(true);
    try {
      const res = await fetch('/api/logistics/deliver-invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceNums }),
      });

      if (!res.ok) throw new Error('Failed to deliver invoices');

      const delivered = await res.json();
      if (delivered !== true) {
        throw new Error('Invoices were not delivered');
      }

      onDelivered?.(departure.id);
    } catch (err) {
      console.error(err);
      alert('No se pudieron marcar las facturas como entregadas.');
    } finally {
      setIsDelivering(false);
    }
  };

  const handleSendScannedInRouteManual = async () => {
    if (!onSendScannedInRouteManual || departure.invoices.length === 0) return;

    const confirmed = await showConfirm({
      title: "Mandar en ruta manual",
      html: `Se marcarán como <b>En ruta</b> las facturas escaneadas de la unidad <b>${departure.unitName}</b>.`,
      icon: "question",
      iconColor: "#10b981",
      confirmButtonText: "Si, mandar en ruta",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#059669"
    });

    if (!confirmed) return;

    setIsSendingManualRoute(true);
    try {
      await onSendScannedInRouteManual(departure.id);

      await showSuccess({
        title: "Salida en ruta",
        html: `La unidad <b>${departure.unitName}</b> se marcó en ruta correctamente.`,
        timer: 1600
      });
    } catch (err) {
      console.error(err);
      setEditingLocationIndex(null);
      await new Promise(resolve => setTimeout(resolve, 50));
      await showError({
        title: "No se pudo mandar en ruta",
        text: err instanceof Error ? err.message : "Ocurrió un error al mandar la carga escaneada en ruta."
      });
    } finally {
      setIsSendingManualRoute(false);
    }
  };

  const handleReturnToRoutes = async () => {
    if (!onReturnToRoutes || departure.invoices.length === 0) return;

    const invoiceNums = departure.invoices.map(inv => inv.id).filter(Boolean);
    const confirmed = await showConfirm({
      title: "Regresar a Rutas",
      html: `La factura <b>${invoiceNums.join(", ")}</b> volverá a estar disponible en la interfaz de Rutas.`,
      icon: "question",
      iconColor: "#f59e0b",
      confirmButtonText: "Sí, regresar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d97706"
    });

    if (!confirmed) return;

    setIsReturningToRoutes(true);
    try {
      await onReturnToRoutes(departure.id);

      await showSuccess({
        title: "Regresada a Rutas",
        html: `La factura <b>${invoiceNums.join(", ")}</b> volvió a Rutas correctamente.`,
        timer: 1600
      });
    } catch (err) {
      console.error(err);
      await showError({
        title: "No se pudo regresar",
        text: err instanceof Error ? err.message : "Ocurrió un error al regresar la factura a Rutas."
      });
    } finally {
      setIsReturningToRoutes(false);
    }
  };
  const handleReturnInvoiceToRoutes = async (invoice: Invoice) => {
    if (!onReturnInvoiceToRoutes || returningInvoiceNum) return;

    const routeDocument = getInvoiceRouteDocument(invoice);
    if (!routeDocument.documentNum) return;

    const documentKey = getRouteDocumentKey(routeDocument);
    const documentLabel = getRouteDocumentLabel(routeDocument);

    const confirmed = await showConfirm({
      title: "Regresar a pendiente",
      html: `La <b>${documentLabel}</b> volverá a estar disponible en Rutas para armar una nueva ruta.`,
      icon: "question",
      iconColor: "#f59e0b",
      confirmButtonText: "Sí, regresar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d97706"
    });

    if (!confirmed) return;

    setReturningInvoiceNum(documentKey);
    try {
      await onReturnInvoiceToRoutes(routeDocument);

      await showSuccess({
        title: "Documento regresado",
        html: `La <b>${documentLabel}</b> volvió a Rutas correctamente.`,
        timer: 1600
      });
    } catch (err) {
      console.error(err);
      await showError({
        title: "No se pudo regresar",
        text: err instanceof Error ? err.message : "Ocurrió un error al regresar el documento a Rutas."
      });
    } finally {
      setReturningInvoiceNum(null);
    }
  };
  const handleOpenSamsaraRoute = async () => {
    const invoiceNums = departure.invoices.map(inv => inv.id).filter(Boolean);

    if (invoiceNums.length === 0) {
      await showError({
        title: "Sin facturas",
        text: "No se encontraron facturas para buscar la ruta en Samsara."
      });
      return;
    }

    const samsaraTab = window.open('about:blank', '_blank');
    if (samsaraTab) {
      samsaraTab.opener = null;
      samsaraTab.document.title = 'Cargando ruta Samsara...';
    }

    setIsOpeningSamsaraRoute(true);
    try {
      const response = await fetch('/api/logistics/samsara-route-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceNums }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success === false || !data?.url) {
        throw new Error(data?.message || data?.error || "No se encontró una ruta de Samsara para esta salida.");
      }

      if (samsaraTab) {
        samsaraTab.location.href = data.url;
      } else {
        window.open(data.url, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      samsaraTab?.close();
      console.error(err);
      await showError({
        title: "No se pudo abrir Samsara",
        text: err instanceof Error ? err.message : "Ocurrió un error al buscar la ruta en Samsara."
      });
    } finally {
      setIsOpeningSamsaraRoute(false);
    }
  };
  const openAddressEditor = (index: number, address: string) => {
    setEditingLocationIndex(index);
    setEditingAddress(address);
  };

  const closeAddressEditor = () => {
    if (isSavingAddress) return;
    setEditingLocationIndex(null);
    setEditingAddress("");
  };

  const handleSaveShippingAddress = async () => {
    if (editingLocationIndex === null) return;

    const requestedAddress = editingAddress.trim();
    if (!requestedAddress) {
      setEditingLocationIndex(null);
      await new Promise(resolve => setTimeout(resolve, 50));
      await showError({
        title: "Dirección requerida",
        text: "Escribe la nueva dirección de envío antes de guardar."
      });
      return;
    }

    const invoiceNums = displayedLocations.length <= 1
      ? departure.invoices.map(inv => inv.id).filter(Boolean)
      : [departure.invoices[editingLocationIndex]?.id].filter(Boolean);

    if (invoiceNums.length === 0) {
      setEditingLocationIndex(null);
      await new Promise(resolve => setTimeout(resolve, 50));
      await showError({
        title: "Sin factura",
        text: "No se encontró una factura para actualizar esta dirección."
      });
      return;
    }

    setIsSavingAddress(true);
    try {
      let normalizedAddress = requestedAddress;

      for (const invoiceNum of invoiceNums) {
        const response = await fetch('/api/logistics/update-shipping-address', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoiceNum, requestedAddress }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok || data?.success === false) {
          throw new Error(data?.message || data?.error || `No se pudo actualizar la factura ${invoiceNum}.`);
        }

        normalizedAddress = data?.googleFormattedAddress || data?.GoogleFormattedAddress || data?.requestedAddress || data?.RequestedAddress || normalizedAddress;
      }

      setLocationOverrides(prev => {
        const next = [...(prev.length > 0 ? prev : departure.locations)];
        next[editingLocationIndex] = normalizedAddress;
        return next;
      });

      setEditingLocationIndex(null);
      setEditingAddress("");
      await new Promise(resolve => setTimeout(resolve, 50));

      await showSuccess({
        title: "Dirección actualizada",
        text: invoiceNums.length > 1
          ? `Se actualizó la dirección para ${invoiceNums.length} facturas.`
          : `Se actualizó la dirección de la factura ${invoiceNums[0]}.`,
        timer: 1700
      });
    } catch (err) {
      console.error(err);
      setEditingLocationIndex(null);
      await new Promise(resolve => setTimeout(resolve, 50));
      await showError({
        title: "No se pudo actualizar",
        text: err instanceof Error ? err.message : "Ocurrió un error al actualizar la dirección de envío."
      });
    } finally {
      setIsSavingAddress(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-all duration-300 group flex flex-col h-full overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-sm">
      <CardHeader className={cn("flex flex-col justify-start p-4 pt-3 pb-2", departure.deliveryType === "sucursal" && "hidden")}>
        {/* Header: Unit/Invoice Name */}
        <div className="flex justify-between items-start shrink-0 w-full">
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center justify-between w-full mb-1 flex-nowrap gap-2">
              <CardTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight transition-colors truncate flex-1 min-w-0">
                {departure.deliveryType === 'sucursal'
                  ? (departure.clientName || "Entrega Cliente")
                  : departure.unitName}
              </CardTitle>
              <div className="flex items-center gap-2 shrink-0">
                {addedInvoicesCount > 0 && departure.status === "Pendiente" && (
                  <span className="px-2 py-1 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-lg text-[9px] font-black uppercase tracking-widest animate-pulse shrink-0 whitespace-nowrap shadow-sm shadow-amber-500/10">
                    +{addedInvoicesCount} {addedInvoicesCount === 1 ? 'Factura agregada' : 'Facturas agregadas'}
                  </span>
                )}
                {departure.status === "Escaneada" && (
                  <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors shrink-0 whitespace-nowrap">
                    ESCANEADA
                  </span>
                )}
                {departure.status === "En ruta" && (
                  <span className="px-2 py-1 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest transition-colors shrink-0 whitespace-nowrap">
                    EN RUTA
                  </span>
                )}
              </div>
            </div>
            {/* Subtitle removed as requested */}
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("flex-1 flex flex-col gap-4", departure.deliveryType === "sucursal" && "pt-4")}>
        {/* Details Section */}
        <div className="bg-white dark:bg-[#1E293B] rounded-xl p-4 flex-1 flex flex-col gap-2.5 border border-slate-200 dark:border-slate-800/50">
          {/* Driver/Client Info */}
          <div className="flex flex-col gap-1.5 mb-2">
            <div className="flex items-center gap-1.5 w-full">
              <User className="size-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {departure.deliveryType === "sucursal" ? "Cliente" : "Chofer"}
              </span>
            </div>
            <span className="w-full text-left text-xs font-bold text-slate-700 dark:text-slate-200 uppercase min-w-0 whitespace-normal break-words leading-snug">
              {departure.deliveryType === "sucursal" ? (departure.clientName || "Cliente General") : departure.driverName}
            </span>
          </div>


          {/* Facturas */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 w-full">
              <FileText className="size-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Facturas ({departure.invoices.length})
              </span>
            </div>
            <div className="flex flex-col gap-1.5">
              {departure.invoices.map((inv, idx) => {
                const isNew = !!inv.isNew;
                const isDelivered = !!inv.isDelivered;
                const invoiceAmount = formatInvoiceAmount(inv.amount);
                const routeDocument = getInvoiceRouteDocument(inv);
                const routeDocumentKey = getRouteDocumentKey(routeDocument);
                const routeDocumentLabel = getRouteDocumentLabel(routeDocument);
                return (
                  <div
                    key={`${inv.id}-${idx}`}
                    className={cn(
                      "flex min-w-0 items-center justify-between gap-2 rounded-lg border px-2 py-1 transition-all duration-300 select-none",
                      isDelivered
                        ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/40 dark:border-emerald-500/35 text-emerald-700 dark:text-emerald-300"
                        : isNew
                          ? "bg-amber-500/10 dark:bg-amber-500/20 border-amber-500/50 dark:border-amber-500/50 text-amber-600 dark:text-amber-400 animate-pulse shadow-sm shadow-amber-500/10"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-black select-text">
                      <span className="min-w-0 truncate">{inv.id}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                      {invoiceAmount && <span>{invoiceAmount}</span>}
                      {isNew && <Clock3 className="size-3 shrink-0 text-amber-500 dark:text-amber-400" />}
                      {isDelivered && <CheckCircle className="size-3 shrink-0 text-emerald-500 dark:text-emerald-400" />}
                      {departure.status === "En ruta" && departure.deliveryType === "domicilio" && !isDelivered && onReturnInvoiceToRoutes && (
                        <button
                          type="button"
                          title="Quitar de esta ruta y regresar a pendiente"
                          aria-label={`Quitar ${routeDocumentLabel} de esta ruta y regresar a pendiente`}
                          disabled={returningInvoiceNum === routeDocumentKey}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleReturnInvoiceToRoutes(inv);
                          }}
                          className="ml-0.5 inline-flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-full border border-red-400/70 bg-red-500/10 text-red-500 transition-all hover:bg-red-500/20 hover:text-red-600 disabled:cursor-wait disabled:opacity-60 dark:border-red-400/50 dark:bg-red-500/15 dark:text-red-400 dark:hover:text-red-300"
                        >
                          {returningInvoiceNum === routeDocumentKey ? (
                            <RefreshCw className="size-3 animate-spin" />
                          ) : (
                            <Trash2 className="size-3" />
                          )}
                        </button>
                      )}
                    </span>
                  </div>
                );
              })}
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

                {displayedLocations.map((loc, i) => {
                  const locationInvoices = displayedLocations.length <= 1
                    ? departure.invoices
                    : departure.invoices[i]
                      ? [departure.invoices[i]]
                      : [];
                  const isDeliveredLocation = locationInvoices.length > 0 && locationInvoices.every((inv) => inv.isDelivered);

                  return (
                    <div key={i} className="relative flex items-start gap-4 group/stop">
                      {/* Stop Number Indicator */}
                      <div className="relative z-10 flex items-center justify-center size-3.5 bg-white dark:bg-slate-900 border-2 border-blue-400 dark:border-blue-500 rounded-full shrink-0 mt-0.5 group-hover/stop:scale-110 group-hover/stop:bg-blue-50 dark:group-hover/stop:bg-blue-900/40 transition-all">
                        <span className="text-[7.5px] font-black text-blue-600 dark:text-blue-400 leading-none">{i + 1}</span>
                      </div>

                      <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 leading-snug group-hover/stop:text-blue-600 dark:group-hover/stop:text-blue-400 transition-colors">
                          {loc}
                        </span>

                        {departure.status === "En ruta" && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            disabled={isDeliveredLocation}
                            onClick={() => {
                              if (!isDeliveredLocation) openAddressEditor(i, loc);
                            }}
                            className={cn(
                              "-mt-1 inline-flex size-5 shrink-0 items-center justify-center rounded-full border transition-all",
                              isDeliveredLocation
                                ? "cursor-not-allowed border-slate-300/70 bg-slate-100/70 text-slate-400 opacity-60 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-500"
                                : "cursor-pointer border-blue-400/60 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 hover:text-blue-600 dark:border-blue-400/45 dark:bg-blue-500/15 dark:text-blue-400 dark:hover:text-blue-300"
                            )}
                            title={isDeliveredLocation ? "Direccion bloqueada porque la factura ya fue entregada" : "Editar direccion de envio"}
                          >
                            <Pencil className="size-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <Dialog open={editingLocationIndex !== null} onOpenChange={(open) => {
        if (!open) closeAddressEditor();
      }}>
        <DialogContent className="sm:max-w-[460px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">
              Editar dirección de envio
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Se normalizará con Google y se actualizará el stop pendiente en Samsara.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                Facturas
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(displayedLocations.length <= 1
                  ? departure.invoices
                  : departure.invoices[editingLocationIndex ?? 0]
                    ? [departure.invoices[editingLocationIndex ?? 0]]
                    : []
                ).map((inv) => (
                  <span key={inv.id} className="text-xs font-black px-2.5 py-0.5 border rounded-md bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-sm">
                    {inv.id}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Nueva dirección
              </label>
              <Input
                value={editingAddress}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingAddress(e.target.value)}
                disabled={isSavingAddress}
                className="h-11 rounded-xl text-xs font-bold"
                placeholder="Escribe la dirección de envío"
              />
            </div>
          </div>

          <DialogFooter className="bg-transparent border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={closeAddressEditor}
              disabled={isSavingAddress}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveShippingAddress}
              disabled={isSavingAddress || !editingAddress.trim()}
              className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white"
            >
              {isSavingAddress ? <RefreshCw className="size-4 mr-2 animate-spin" /> : <Save className="size-4 mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CardFooter className="px-5 pb-4">
        <div className="w-full shrink-0 space-y-3">
          {departure.status === "Pendiente" ? (
            <>
              <Button
                variant="outline"
                size="logistics-card"
                onClick={handleOpenSamsaraRoute}
                disabled={isOpeningSamsaraRoute}
                className="cursor-pointer border-blue-400/60 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-500/40 dark:text-blue-300 dark:hover:bg-blue-500/10"
              >
                {isOpeningSamsaraRoute ? <RefreshCw className="size-4 mr-2 animate-spin" /> : <ExternalLink className="size-4 mr-2" />}
                Ver ruta Samsara
              </Button>
              {departure.deliveryType === "sucursal" && onReturnToRoutes && (
                <Button
                  type="button"
                  variant="outline"
                  size="logistics-card"
                  onClick={handleReturnToRoutes}
                  disabled={isReturningToRoutes}
                  className="border-amber-400/60 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-500/40 dark:text-amber-300 dark:hover:bg-amber-500/10"
                >
                  {isReturningToRoutes ? <RefreshCw className="size-4 mr-2 animate-spin" /> : <Undo2 className="size-4 mr-2" />}
                  Regresar a Rutas
                </Button>
              )}
              <Dialog open={isAuthDialogOpen} onOpenChange={(open) => {
                setIsAuthDialogOpen(open);
                if (!open) resetAuth();
              }}>
                <DialogTrigger asChild>
                  <Button
                    variant="logistics-action" size="logistics-card" className="cursor-pointer gap-2"
                  >
                    <ScanLine className="size-4" />
                    ESCANEAR
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
                              {verifiedInvoiceIds.length} / {verifiableInvoices.length} <span className="text-[10px] sm:text-xs normal-case font-bold text-slate-400 ml-1 sm:ml-2">Facturas</span>
                            </h4>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
                              {Math.round((verifiedInvoiceIds.length / verifiableInvoiceCount) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                          <div
                            className="bg-emerald-500 h-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                            style={{ width: `${(verifiedInvoiceIds.length / verifiableInvoiceCount) * 100}%` }}
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
                        <div className="flex items-center gap-3 shrink-0">
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
                              placeholder="Ej: 223899"
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
                        <div className="flex items-center gap-3 shrink-0">
                          <Button variant="ghost" size="icon" onClick={() => setAuthStep("method_select")} className="rounded-full">
                            <ArrowLeft className="size-5" />
                          </Button>
                          <DialogTitle className="text-lg font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                            {scanMode === "camera" ? "Escaneando OV..." : "Escanear con Lector"}
                          </DialogTitle>
                        </div>

                        {scanMode === "camera" ? (
                          /* Camera Scanning View */
                          <div className="flex flex-col gap-3">
                            <div className="relative h-[130px] w-full bg-slate-950 rounded-2xl overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-inner">
                              {cameraError ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                                  <ScanLine className="size-8 text-slate-700 opacity-30" />
                                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{cameraError}</p>
                                </div>
                              ) : (
                                <div id="camera-reader" className="w-full h-full overflow-hidden" />
                              )}
                              {!cameraError && (
                                <>
                                  <style dangerouslySetInnerHTML={{
                                    __html: `
                                  #camera-reader video {
                                    width: 100% !important;
                                    height: 100% !important;
                                    object-fit: cover !important;
                                  }
                                ` }} />
                                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-10">
                                    <div className="w-[85%] h-24 border-2 border-emerald-500/50 rounded-xl relative">
                                      <div className="absolute left-0 w-full h-0.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-scan-line" />
                                      <div className="absolute -top-1 -left-1 size-4 border-t-2 border-l-2 border-emerald-500 rounded-tl-lg" />
                                      <div className="absolute -top-1 -right-1 size-4 border-t-2 border-r-2 border-emerald-500 rounded-tr-lg" />
                                      <div className="absolute -bottom-1 -left-1 size-4 border-b-2 border-l-2 border-emerald-500 rounded-bl-lg" />
                                      <div className="absolute -bottom-1 -right-1 size-4 border-b-2 border-r-2 border-emerald-500 rounded-br-lg" />
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>
                            {isError && scannedCode && (
                              <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 text-center animate-in fade-in duration-300">
                                <p className="text-xs font-bold text-red-500">
                                  Código leído: <span className="font-mono bg-red-100 dark:bg-red-950/50 px-1.5 py-0.5 rounded">{scannedCode}</span>
                                </p>
                                <p className="text-[10px] text-red-400 mt-1 font-semibold">
                                  No pertenece a las facturas pendientes de este viaje.
                                </p>
                              </div>
                            )}
                            {/* Rotation helper tip */}
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium text-center italic mt-1 leading-normal">
                              Tip: Si el escanear en vivo tarda en leer en vertical, gira el teléfono en horizontal (acostado).
                            </p>
                            {/* File Scanner Fallback for Mobile Devices */}
                            <div className="flex flex-col gap-2 mt-1">
                              <input
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handleFileScan}
                                className="hidden"
                                id="file-scanner-input"
                              />
                              <Button
                                variant="outline"
                                onClick={() => document.getElementById("file-scanner-input")?.click()}
                                className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-black uppercase tracking-wider transition-all"
                                disabled={isLoadingDetails}
                              >
                                <ScanLine className="size-4 text-emerald-500" />
                                Tomar Foto para Escanear
                              </Button>
                              <div id="file-reader-temp" className="hidden" />
                            </div>
                          </div>
                        ) : (
                          /* Physical USB Barcode Scanner View */
                          <>
                            <input
                              ref={scannerInputRef}
                              type="text"
                              className="absolute opacity-0 pointer-events-none w-0 h-0"
                              onKeyDown={handleBarcodeKeyDown}
                              autoFocus
                            />

                            {isScannerFocused ? (
                              <div className="flex flex-col items-center justify-center p-6 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-3xl border-2 border-emerald-200 dark:border-emerald-500/20 text-center gap-4 transition-all">
                                <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-widest bg-emerald-100 dark:bg-emerald-500/20 px-4 py-2 rounded-xl">
                                  <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
                                  ESPERANDO ESCANEO
                                </div>
                                <div className="relative p-4 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
                                  <QrCode className="size-10 text-emerald-500" />
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs font-medium">
                                  Apunta al código de barras de la orden de venta y presiona el gatillo para escanear de forma automática.
                                </p>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center p-6 bg-amber-50/50 dark:bg-amber-500/5 rounded-3xl border-2 border-amber-200 dark:border-amber-500/20 text-center gap-4 transition-all">
                                <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-widest bg-amber-100 dark:bg-amber-500/20 px-4 py-2 rounded-xl">
                                  ESCANEO DESACTIVADO
                                </div>
                                <div className="relative p-4 bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
                                  <X className="size-10 text-amber-500" />
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs font-medium">
                                  La ventana del navegador perdió el foco para capturar el lector.
                                </p>
                                <Button
                                  variant="outline"
                                  onClick={() => scannerInputRef.current?.focus()}
                                  className="h-10 rounded-xl font-bold border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950 transition-all text-xs"
                                >
                                  Haga clic aquí para reactivar el lector
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {authStep === "invoice_review" && currentInvoiceId && (
                      <div className="space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="text-center space-y-2 px-2">
                          <DialogTitle className="text-lg font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">Revisar Carga</DialogTitle>
                          <p className="text-xs sm:text-sm font-bold text-emerald-500 uppercase tracking-widest">{currentInvoice?.orderNum ? `OV ${currentInvoice.orderNum}` : currentInvoiceId}</p>
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
                                        <td className="px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span>{mat.material}</span>
                                            {Number(mat.corte) === 1 && (
                                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-red-700 dark:bg-red-500/15 dark:text-red-300">
                                                Corte
                                              </span>
                                            )}
                                          </div>
                                        </td>
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
                                Se han verificado las <span className="text-emerald-600 dark:text-emerald-400 font-black">{verifiableInvoices.length}</span> facturas correctamente.
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
                              className="w-full h-16 rounded-2xl text-lg font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_10px_20px_-10px_rgba(16,185,129,0.5)] transition-all active:scale-[0.98] hover:translate-y-[-2px] disabled:opacity-75 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100 flex items-center justify-center gap-2"
                              onClick={handleFinalAuthorization}
                              disabled={isAuthorizing}
                            >
                              {isAuthorizing && <RefreshCw className="size-5 animate-spin" />}
                              {isAuthorizing
                                ? (departure.deliveryType === "sucursal" ? "Marcando..." : "Finalizando...")
                                : (departure.deliveryType === "sucursal" ? "Marcar Entregado" : "Finalizar Escaneo")}
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in duration-500">
                            <div className="p-10 bg-emerald-600 rounded-full text-white shadow-2xl shadow-emerald-500/40">
                              <CheckCircle className="size-24" />
                            </div>

                            <div className="mt-12 text-center animate-in slide-in-from-bottom-4 duration-700 delay-200">
                              <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">¡CARGA ESCANEADA!</h2>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : departure.status === "Escaneada" ? (
            <>
              <Button
                variant="outline"
                size="logistics-card"
                onClick={handleOpenSamsaraRoute}
                disabled={isOpeningSamsaraRoute}
                className="cursor-pointer border-blue-400/60 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-500/40 dark:text-blue-300 dark:hover:bg-blue-500/10"
              >
                {isOpeningSamsaraRoute ? <RefreshCw className="size-4 mr-2 animate-spin" /> : <ExternalLink className="size-4 mr-2" />}
                Ver ruta Samsara
              </Button>
              <Button
                variant="logistics-action"
                size="logistics-card"
                onClick={handleSendScannedInRouteManual}
                disabled={isSendingManualRoute || !onSendScannedInRouteManual}
                className="bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30 shadow-emerald-500/20"
              >
                {isSendingManualRoute ? <RefreshCw className="size-4 mr-2 animate-spin" /> : <Truck className="size-4 mr-2" />}
                Mandar en ruta manual
              </Button>
            </>
          ) : departure.status === "En ruta" ? (
            <>
              <Button
                variant="outline"
                size="logistics-card"
                onClick={handleOpenSamsaraRoute}
                disabled={isOpeningSamsaraRoute}
                className="cursor-pointer border-blue-400/60 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-500/40 dark:text-blue-300 dark:hover:bg-blue-500/10"
              >
                {isOpeningSamsaraRoute ? <RefreshCw className="size-4 mr-2 animate-spin" /> : <ExternalLink className="size-4 mr-2" />}
                Ver ruta Samsara
              </Button>
              <Button
                variant="logistics-action"
                size="logistics-card"
                onClick={handleDeliverTrip}
                disabled={isDelivering}
                className="bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30 shadow-emerald-500/20"
              >
                {isDelivering ? <RefreshCw className="size-4 mr-2 animate-spin" /> : <CheckCircle className="size-4 mr-2" />}
                Marcar Entregado
              </Button>
            </>
          ) : (
            <Button
              variant="logistics-action"
              size="logistics-card"
              onClick={handleDeliverTrip}
              disabled={isDelivering}
              className="bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/30 shadow-emerald-500/20"
            >
              {isDelivering ? <RefreshCw className="size-4 mr-2 animate-spin" /> : <CheckCircle className="size-4 mr-2" />}
              Marcar Entregado
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
