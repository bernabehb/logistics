"use client";

import { DriverProfile, DeliveryRecord } from "@/features/admin/models";
import { InvoiceStats } from "@/features/admin/models/departureDrivers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock3, ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface DriverCardProps {
  driver: DriverProfile;
  deliveries: DeliveryRecord[];
  invoiceStats: InvoiceStats;
}

function StatBadge({
  count,
  label,
  icon: Icon,
  cls,
}: {
  count: number;
  label: string;
  icon: React.ElementType;
  cls: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-xl p-3 gap-0.5 flex-1", cls)}>
      <span className="text-xl font-bold leading-tight">{count}</span>
      <div className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        <span className="text-[10px] font-semibold leading-none">{label}</span>
      </div>
    </div>
  );
}

export function DriverCard({ driver, deliveries: _deliveries, invoiceStats }: DriverCardProps) {
  const router = useRouter();
  const { deliveredInvoices, activeInvoices, pendingInvoices } = invoiceStats;

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1E293B] shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 rounded-2xl overflow-hidden">
      <CardContent className="p-5 flex flex-col gap-4">

        {/* Header */}
        <div>
          <p className="font-bold text-slate-900 dark:text-slate-100 text-[15px]">{driver.name}</p>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{driver.licensePlate}</span>
        </div>

        {/* Stats — always show Entregadas; En ruta and Pendientes only if > 0 */}
        <div className="flex gap-1.5">
          <StatBadge
            count={deliveredInvoices}
            label="Entregadas"
            icon={CheckCircle2}
            cls="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
          />
          {activeInvoices > 0 && (
            <StatBadge
              count={activeInvoices}
              label="En ruta"
              icon={Clock3}
              cls="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            />
          )}
          {pendingInvoices > 0 && (
            <StatBadge
              count={pendingInvoices}
              label="Pendientes"
              icon={AlertCircle}
              cls="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
            />
          )}

          {activeInvoices === 0 && pendingInvoices === 0 && (
            <span className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-500/20 text-[11px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest shadow-sm transition-all duration-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Chofer disponible
            </span>
          )}
        </div>

        {/* Action */}
        <Button
          variant="logistics-action"
          size="logistics-card"
          onClick={() => router.push(`/admin/${driver.id}`)}
        >
          Ver detalles
          <ChevronRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
