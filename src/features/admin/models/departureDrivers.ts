import { DriverProfile, DeliveryRecord, DeliveryStatus } from "@/features/admin/models";
import departuresData from "@/lib/departures.json";
import deliveriesData from "@/lib/deliveries.json";

const AVATAR_COLORS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
];

const mapStatus = (s: string): DeliveryStatus => {
  if (s === "En ruta") return "in-progress";
  if (s === "Completado") return "delivered";
  return "pending";
};

export type TripRecord = {
  id: string;
  driverId: string;
  driverName: string;
  date: string;
  status: DeliveryStatus;
  clientName: string;
  address: string;
  invoices: {
    id: string;
    groups: { warehouse: string; materials: { name: string; quantity: string }[] }[];
  }[];
};

export const ALL_TRIPS: TripRecord[] = (deliveriesData as any[]).map((t) => ({
  ...t,
  status: t.status as DeliveryStatus,
}));

export type InvoiceStats = {
  /** Total invoices summed across all historically delivered trips */
  deliveredInvoices: number;
  /** Invoices in the current active trip when En ruta (0 otherwise) */
  activeInvoices: number;
  /** Invoices pending authorization when Pendiente (0 otherwise) */
  pendingInvoices: number;
};

export type DepartureDriver = {
  driver: DriverProfile;
  deliveries: DeliveryRecord[];
  invoiceStats: InvoiceStats;
};

export const DEPARTURE_DRIVERS: DepartureDriver[] = (departuresData as any[]).map((dep, i) => {
  const parts = dep.driverName.trim().split(" ");
  const initials = parts.slice(0, 2).map((p: string) => p[0]).join("").toUpperCase();

  const driver: DriverProfile = {
    id: dep.id,
    name: dep.driverName,
    initials,
    color: AVATAR_COLORS[i % AVATAR_COLORS.length],
    vehicle: dep.type,
    licensePlate: dep.unitName,
    phone: "—",
  };

  // Active deliveries from current trip (departures.json)
  const activeDeliveries: any[] = (dep.locations as string[]).map((loc, j) => ({
    id: `${dep.id}-active-${j}`,
    driverId: dep.id,
    orderId: dep.invoices[j]?.id ?? `#${j + 1}`,
    clientName: dep.destination,
    address: loc,
    block: (dep as any).blocks ? (dep as any).blocks[j] : "S/A",
    date: dep.invoices[j]?.date ?? new Date().toISOString().split("T")[0],
    deliveryDate: dep.invoices[j]?.deliveryDate ?? undefined,
    status: mapStatus(dep.status),
    groups: dep.invoices[j]?.groups || [], // Pass groups through
  }));

  // Historical deliveries from deliveries.json
  const driverTrips = ALL_TRIPS.filter((t) => t.driverId === dep.id);
  const historicalDeliveries: DeliveryRecord[] = driverTrips.map((t) => ({
    id: t.id,
    driverId: t.driverId,
    orderId: t.invoices[0]?.id ?? t.id,
    clientName: t.clientName,
    address: t.address,
    date: t.date,
    status: t.status,
    deliveryDate: (t as any).deliveryDate,
  }));

  // Invoice stats
  const completedActive = dep.status === "Completado" ? (dep.invoices as any[]).length : 0;
  const deliveredInvoices = driverTrips.reduce((sum, t) => sum + t.invoices.length, 0) + completedActive;
  const activeInvoices  = dep.status === "En ruta"   ? (dep.invoices as any[]).length : 0;
  const pendingInvoices = dep.status === "Pendiente"  ? (dep.invoices as any[]).length : 0;

  return {
    driver,
    deliveries: [...activeDeliveries, ...historicalDeliveries],
    invoiceStats: { deliveredInvoices, activeInvoices, pendingInvoices },
  };
});
