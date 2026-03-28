"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Cell, LabelList,
  PieChart, Pie
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, BarChart2, PieChart as PieIcon } from "lucide-react";

interface AnalyticsChartsProps {
  invoices: any[];
  getStableTime: (id: string) => string;
  driverId?: string;
}

export function AnalyticsCharts({ invoices, getStableTime, driverId }: AnalyticsChartsProps) {
  const [chartType, setChartType] = useState<"bar" | "pie">("pie");

  // ================= DESTINOS =================
  const destinationsData = useMemo(() => {
    const counts: Record<string, { count: number; times: string[] }> = {};

    invoices.forEach(inv => {
      const loc = inv.block || inv.clientName || "Otro";
      const time = getStableTime(inv.invoiceId);

      if (!counts[loc]) counts[loc] = { count: 0, times: [] };

      counts[loc].count += 1;
      counts[loc].times.push(time);
    });

    return Object.entries(counts)
      .map(([name, data]) => {
        const hourCounts: Record<string, number> = {};

        data.times.forEach(t => {
          const h = t.split(":")[0];
          hourCounts[h] = (hourCounts[h] || 0) + 1;
        });

        const peakHour = Object.entries(hourCounts)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || "--";

        return {
          name,
          Entregas: data.count,
          horario: `${peakHour}:00`,
        };
      })
      .sort((a, b) => b.Entregas - a.Entregas)
      .slice(0, 5);
  }, [invoices, getStableTime]);

  // ================= DISPONIBILIDAD (SUAVE) =================
  const occupancyData = useMemo(() => {
    const points: { h: number; hour: string; busy: number; isEnRuta: boolean }[] = [];

    // MÁS PUNTOS = curva más suave
    for (let h = 8; h <= 18.5; h += 0.25) {
      points.push({
        h,
        hour:
          h % 1 === 0
            ? `${h.toString().padStart(2, "0")}:00`
            : `${Math.floor(h).toString().padStart(2, "0")}:${h % 1 === 0.5 ? "30" : h % 1 === 0.25 ? "15" : "45"
            }`,
        busy: 0,
        isEnRuta: false
      });
    }

    let activeDepartures = [9, 11, 14];
    let getDuration: (startH: number) => number = (startH) => {
      // Por defecto para la vista global
      if (startH === 9) return 1.5;
      if (startH === 11) return 2.0;
      return 4.0;
    };

    if (driverId) {
      const hash = driverId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const patterns = [
        [9], [14],                           // 1 trip (largo)
        [9, 14], [11, 14],                   // 2 trips (medianos)
        [9, 11, 14], [9, 11, 14]             // 3 trips (cortos)
      ];
      activeDepartures = patterns[hash % patterns.length];

      getDuration = (startH: number) => {
        const len = activeDepartures.length;
        if (len === 1) {
          // Viaje largo de 9 a 1 (4 hrs) o de 2 a 6 (4 hrs) para no chocar con la comida
          return 4.0; 
        } else if (len === 3) {
          // Viajes cortos y rápidos (1.5 hrs cada uno)
          return 1.5;
        } else {
          // 2 viajes, duración media
          if (startH === 9) {
            return activeDepartures.includes(11) ? 1.5 : 4.0;
          }
          if (startH === 11) return 2.0; // Termina exactamente a la 1:00 PM
          if (startH === 14) return 3.5; // De 2:00 PM a 5:30 PM
          return 2.5;
        }
      };
    }

    activeDepartures.forEach(startH => {
      const duration = getDuration(startH);
      points.forEach(point => {
        const diff = point.h - startH;
        if (diff >= 0 && diff <= duration) {
          const value = Math.sin((diff / duration) * Math.PI);
          point.busy = Math.max(point.busy, value);
          if (diff >= 0 && diff < duration) point.isEnRuta = true;
        }
      });
    });

    return points;
  }, [driverId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <style>{`
        .recharts-wrapper, .recharts-surface, .recharts-wrapper *, .recharts-surface * {
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
          -webkit-tap-highlight-color: transparent;
        }
        .recharts-wrapper:focus, .recharts-surface:focus, .recharts-wrapper *:focus,
        path:focus, rect:focus, circle:focus {
          outline: none !important;
        }
      `}</style>

      {/* DESTINOS */}
      <Card className="h-[420px] flex flex-col">
        <CardHeader className="pb-3 border-b">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="w-4 h-4 text-blue-500" />
                Destinos Frecuentes
              </CardTitle>
              <CardDescription className="text-xs">
                Lugares con mayor recurrencia
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-lg p-1">
                <button
                  onClick={() => setChartType("bar")}
                  className={`p-1.5 rounded-md transition-colors ${chartType === "bar" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                  title="Ver Gráfica de Barras"
                >
                  <BarChart2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setChartType("pie")}
                  className={`p-1.5 rounded-md transition-colors ${chartType === "pie" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                  title="Ver Gráfica de Pastel"
                >
                  <PieIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 pt-4 pb-2 [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "bar" ? (
              <BarChart
                data={destinationsData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                style={{ outline: "none" }}
                tabIndex={-1}
              >
                <CartesianGrid horizontal={false} opacity={0.1} />
                <XAxis type="number" hide axisLine={false} tickLine={false} />

                <YAxis
                  dataKey="name"
                  type="category"
                  width={140}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip cursor={false} />

                <Bar dataKey="Entregas" radius={[0, 6, 6, 0]} barSize={28}>
                  {destinationsData.map((_, i) => (
                    <Cell
                      key={`bar-cell-${i}`}
                      fill={["#3b82f6", "#818cf8", "#0ea5e9", "#94a3b8", "#93c5fd"][i % 5]}
                    />
                  ))}

                  <LabelList
                    dataKey="horario"
                    position="right"
                    style={{ fontSize: 11 }}
                  />
                </Bar>
              </BarChart>
            ) : (
              <PieChart margin={{ top: 20, right: 30, left: 30, bottom: 20 }} style={{ outline: "none" }} tabIndex={-1}>
                <Tooltip 
                  formatter={(value: any, name: any) => [`${value} Entregas`, name]}
                />
                <Pie
                  data={destinationsData}
                  dataKey="Entregas"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  stroke="currentColor"
                  className="stroke-white dark:stroke-[#1E293B]"
                  labelLine={{ className: "stroke-slate-300 dark:stroke-slate-600", strokeWidth: 1 }}
                  label={(props: any) => {
                    const { x, y, name, value, textAnchor } = props;
                    return (
                      <text x={x} y={y} textAnchor={textAnchor} fill="currentColor" className="text-slate-600 dark:text-slate-400 text-[11px] font-medium" dominantBaseline="central">
                        {`${name} (${value})`}
                      </text>
                    );
                  }}
                >
                  {destinationsData.map((_, i) => (
                    <Cell
                      key={`pie-cell-${i}`}
                      fill={["#3b82f6", "#818cf8", "#0ea5e9", "#94a3b8", "#93c5fd"][i % 5]}
                    />
                  ))}
                </Pie>
              </PieChart>
            )}
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* DISPONIBILIDAD */}
      <Card className="h-[420px] flex flex-col">
        <CardHeader className="pb-3 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xs uppercase flex items-center gap-2 text-slate-500">
              <Clock className="w-4 h-4 text-blue-500" />
              Disponibilidad
            </CardTitle>

            <Badge variant="outline" className="text-[10px]">
              08:00 - 18:30
            </Badge>
          </div>

          <CardDescription className="text-xs">
            Flujo de actividad
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 pt-4 pb-4 flex flex-col min-h-0 [&_.recharts-wrapper]:outline-none [&_.recharts-surface]:outline-none">
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={occupancyData}
                margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                style={{ outline: "none" }}
                tabIndex={-1}
              >
                <defs>
                  <linearGradient id="colorBusy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <Tooltip
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const isBusy = data.isEnRuta;

                      const [hourStr, minStr] = data.hour.split(":");
                      let hr = parseInt(hourStr, 10);
                      const ampm = hr >= 12 ? "PM" : "AM";
                      hr = hr % 12 || 12;
                      const time12 = `${hr}:${minStr} ${ampm}`;

                      return (
                        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs text-slate-700">
                          <p className="font-semibold mb-2 pb-1 border-b">{time12}</p>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${isBusy ? "bg-blue-500" : "bg-emerald-500"}`} />
                            <span className={isBusy ? "text-blue-600 font-medium" : "text-emerald-600 font-medium"}>
                              {isBusy ? "En ruta" : "Libre"}
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <XAxis dataKey="h" hide axisLine={false} tickLine={false} />
                <YAxis hide axisLine={false} tickLine={false} domain={[0, 1.4]} />

                <Area
                  type="monotone"
                  dataKey="busy"
                  stroke="#3b82f6"
                  fill="url(#colorBusy)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between text-[10px] mt-4 text-slate-400 font-medium px-2">
            <span>8:00 AM</span>
            <span>6:30 PM</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}