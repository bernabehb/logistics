"use client";

import React, { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import { LogisticsRow } from "../models";
import {
  Grid3x3,
  LayoutGrid,
  PaintbrushVertical,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Package,
} from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";

type Status = "pending" | "in-progress" | "ready" | "none";

interface KanbanBoardProps {
  rows: LogisticsRow[];
}

const COLUMNS = [
  {
    id: "pending" as Status,
    label: "Pendiente",
    Icon: AlertTriangle,
    accent: {
      bar: "bg-red-500",
      header: "text-red-600 dark:text-red-400",
      iconWrap: "bg-red-50 dark:bg-red-500/10",
      badge: "bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-500/30",
      column: "border-red-200 dark:border-red-500/20 bg-red-50/40 dark:bg-red-500/5",
      cardBorder: "border-l-red-400",
    },
  },
  {
    id: "in-progress" as Status,
    label: "En Proceso",
    Icon: Clock,
    accent: {
      bar: "bg-amber-500",
      header: "text-amber-600 dark:text-amber-400",
      iconWrap: "bg-amber-50 dark:bg-amber-500/10",
      badge: "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30",
      column: "border-amber-200 dark:border-amber-500/20 bg-amber-50/40 dark:bg-amber-500/5",
      cardBorder: "border-l-amber-400",
    },
  },
  {
    id: "ready" as Status,
    label: "Listo",
    Icon: CheckCircle2,
    accent: {
      bar: "bg-emerald-500",
      header: "text-emerald-600 dark:text-emerald-400",
      iconWrap: "bg-emerald-50 dark:bg-emerald-500/10",
      badge: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30",
      column: "border-emerald-200 dark:border-emerald-500/20 bg-emerald-50/40 dark:bg-emerald-500/5",
      cardBorder: "border-l-emerald-400",
    },
  },
];

function MaterialDot({ status, columnId }: { status: Status; columnId: Status }) {
  if (status === "none") return null;

  // Color enforced by column state
  let colorClass = "bg-slate-400";
  if (columnId === "pending") colorClass = "bg-red-500";
  else if (columnId === "ready") colorClass = "bg-emerald-500";
  else {
    // In progress column: show their actual preparation status
    if (status === "pending") colorClass = "bg-red-500";
    else if (status === "in-progress") colorClass = "bg-amber-500";
    else if (status === "ready") colorClass = "bg-emerald-500";
  }

  return (
    <div className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0 transition-colors duration-300", colorClass)} />
  );
}

function KanbanCard({
  row,
  cardBorderClass,
  measureRef,
  style,
  index,
  columnId,
}: {
  row: LogisticsRow;
  cardBorderClass: string;
  measureRef?: (el: HTMLElement | null) => void;
  style?: React.CSSProperties;
  index: number;
  columnId: Status;
}) {
  // Only show materials that are NOT 'none'
  const materials = useMemo(() => [
    { label: "ALUM.", Icon: Grid3x3, status: row.aluminio },
    { label: "VID.", Icon: LayoutGrid, status: row.vidrio },
    { label: "HERR.", Icon: PaintbrushVertical, status: row.herrajes },
  ].filter(m => m.status !== 'none'), [row]);

  return (
    <div
      ref={measureRef}
      style={style}
      data-index={index}
      className="absolute top-0 left-0 w-full p-2"
    >
      <div
        className={cn(
          "relative bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm",
          "transition-all duration-200 hover:shadow-md dark:hover:shadow-black/30",
          "border-l-4",
          cardBorderClass
        )}
      >
        {row.isUrgent && (
          <div className="absolute -top-2 right-3 bg-red-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1.5 tracking-tight uppercase scale-105 border border-red-400/30">
            <AlertTriangle className="w-2.5 h-2.5" />
            Client. sucursal
          </div>
        )}

        <div className="flex items-center gap-3 mb-3">
          <div className={cn("flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold shadow-sm", row.clientColor)}>
            {row.clientInitials}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="font-bold text-slate-900 dark:text-slate-100 text-[17px] leading-tight">
              #{row.id}
            </span>
            <span className="text-slate-500 dark:text-slate-400 text-[16px] font-semibold truncate">
              {row.clientName}
            </span>
          </div>
        </div>

        {row.date && (
          <p className="text-[14px] text-slate-400 dark:text-slate-500 font-medium mb-3">
            {row.date}
          </p>
        )}

        {materials.length > 0 && <div className="border-t border-slate-100 dark:border-slate-700 mb-3" />}

        <div className="grid grid-cols-3 gap-2">
          {materials.map(({ label, Icon, status }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 py-2 px-1 rounded-lg bg-slate-50 dark:bg-[#1E293B]/50 border border-slate-100 dark:border-slate-700"
            >
              <Icon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <MaterialDot status={status} columnId={columnId} />
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ col, rows }: { col: (typeof COLUMNS)[0]; rows: LogisticsRow[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { Icon } = col;

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 240,
    overscan: 5,
  });

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border min-h-[600px] h-[calc(100vh-220px)]",
        col.accent.column,
        "shadow-sm dark:shadow-black/20 overflow-hidden"
      )}
    >
      <div className={cn("h-1.5 w-full flex-shrink-0", col.accent.bar)} />

      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200/70 dark:border-slate-700/60 bg-white dark:bg-[#1E293B] z-10">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-lg", col.accent.iconWrap)}>
            <Icon className={cn("w-4 h-4", col.accent.header)} />
          </div>
          <h2 className={cn("font-bold text-[15px]", col.accent.header)}>
            {col.label}
          </h2>
        </div>
        <span className={cn("text-[12px] font-bold px-2.5 py-0.5 rounded-full", col.accent.badge)}>
          {rows.length}
        </span>
      </div>

      <div
        ref={parentRef}
        className="flex-1 overflow-y-auto px-1 no-scrollbar"
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-600">
              <Package className="w-8 h-8 mb-2 opacity-30" />
              <span className="text-[13px] font-medium">Sin pedidos</span>
            </div>
          ) : (
            rowVirtualizer.getVirtualItems().map((virtualRow) => (
              <KanbanCard
                key={virtualRow.key}
                row={rows[virtualRow.index]}
                cardBorderClass={col.accent.cardBorder}
                measureRef={rowVirtualizer.measureElement}
                style={{
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                index={virtualRow.index}
                columnId={col.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function KanbanBoard({ rows }: KanbanBoardProps) {
  const columnData = useMemo(
    () =>
      COLUMNS.map((col) => {
        const columnCards = rows.filter((r) => r.estadoGeneral === col.id);
        // Sort: Urgent items first
        const sortedCards = [...columnCards].sort((a, b) => {
          if (a.isUrgent && !b.isUrgent) return -1;
          if (!a.isUrgent && b.isUrgent) return 1;
          return 0;
        });

        return {
          ...col,
          cards: sortedCards,
        };
      }),
    [rows]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full items-stretch pb-8">
      {columnData.map((col) => (
        <KanbanColumn key={col.id} col={col} rows={col.cards} />
      ))}
    </div>
  );
}
