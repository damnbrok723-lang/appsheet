"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import {
  Users,
  Warehouse,
  Calendar,
  Filter,
  BarChart3,
  RefreshCw,
  Activity,
  Layers,
} from "lucide-react";

type MonitoringEntry = {
  id: string;
  date: string;
  shift: string;
  operatorCount: number;
  warehouse: string;
  teamLeader: string | null;
};

type MonitoringData = {
  entries: MonitoringEntry[];
  summary: {
    totalOperators: number;
    qtyOk: number;
    qtyNg: number;
    okPercentage: number;
    totalMonthlyManpower: number;
    warehouseManpower: Record<string, number>;
  };
};

const WAREHOUSE_COLORS: Record<string, string> = {
  "1": "#3b82f6",
  "5": "#06b6d4",
  "13": "#8b5cf6",
};

const WAREHOUSE_LABELS: Record<string, string> = {
  "1": "Gd 1",
  "5": "Gd 5",
  "13": "Gd 13",
};

function formatShift(shift?: string) {
  if (!shift) return "1";
  if (shift === "SHIFT_2" || shift === "LONGSHIFT_2") return "2";
  if (shift === "SHIFT_3") return "3";
  return "1";
}

export default function DashboardPage() {
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [selectedWarehouse, setSelectedWarehouse] = useState("ALL");

  const monitoringQuery = useQuery({
    queryKey: ["monitoring-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/monitoring");
      if (!res.ok) throw new Error("Gagal memuat data monitoring");
      return (await res.json()).data as MonitoringData;
    },
    staleTime: 30000,
  });

  const entries = useMemo(() => {
    const all = monitoringQuery.data?.entries ?? [];
    return all.filter((entry) => {
      const entryDate = entry.date.slice(0, 10);
      if (filterFrom && entryDate < filterFrom) return false;
      if (filterTo && entryDate > filterTo) return false;
      if (selectedWarehouse !== "ALL" && entry.warehouse !== selectedWarehouse) return false;
      return true;
    });
  }, [monitoringQuery.data?.entries, filterFrom, filterTo, selectedWarehouse]);

  const summary = monitoringQuery.data?.summary;

  // Transform data into exact layout matching the Excel chart:
  // Y-axis label format: "Gd 5 - 2", "Gd 5 - 1", "Gd 13 - 2", "Gd 13 - 1", etc.
  const chartData = useMemo(() => {
    // Group by Date -> Gudang -> Shift
    const dateMap: Record<string, Record<string, Record<string, number>>> = {};

    for (const entry of entries) {
      const rawDate = entry.date.slice(0, 10);
      const dateFormatted = new Date(entry.date).toLocaleDateString("id-ID", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      });
      const key = `${rawDate}|${dateFormatted}`;

      if (!dateMap[key]) dateMap[key] = {};
      const whKey = `Gd ${entry.warehouse}`;
      if (!dateMap[key][whKey]) dateMap[key][whKey] = {};

      const shiftShort = formatShift(entry.shift);
      dateMap[key][whKey][shiftShort] = (dateMap[key][whKey][shiftShort] ?? 0) + entry.operatorCount;
    }

    // Convert into flat array sorted by date & warehouse
    const result: Array<{
      id: string;
      dateLabel: string;
      groupKey: string;
      gudang: string;
      shift: string;
      Total: number;
      warehouseNum: string;
    }> = [];

    const sortedDates = Object.keys(dateMap).sort().reverse().slice(0, 5); // Take last 5 active dates

    for (const key of sortedDates) {
      const [, dateLabel] = key.split("|");
      const warehouses = dateMap[key];

      // Order: Gd 5, Gd 13, Gd 1
      const whOrder = ["Gd 5", "Gd 13", "Gd 1"];
      for (const wh of whOrder) {
        if (!warehouses[wh]) continue;
        const shifts = warehouses[wh];
        // Shift 2 first then Shift 1 to match Excel screenshot stack order
        const shiftKeys = Object.keys(shifts).sort().reverse();
        for (const sh of shiftKeys) {
          const warehouseNum = wh.replace("Gd ", "");
          result.push({
            id: `${key}-${wh}-${sh}`,
            dateLabel,
            groupKey: `${wh} (${sh})`,
            gudang: wh,
            shift: sh,
            Total: shifts[sh],
            warehouseNum,
          });
        }
      }
    }

    return result.reverse();
  }, [entries]);

  return (
    <div className="space-y-6">
      {/* TITLE & HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            <BarChart3 className="h-6 w-6 text-primary md:h-8 md:w-8" />
            Dashboard Man Power Repair ST
          </h1>
          <p className="text-sm text-muted-foreground">
            Grafik Manpower per Gudang &amp; Shift (Sumber Data: Inputan Monitoring).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => monitoringQuery.refetch()}
            disabled={monitoringQuery.isFetching}
            className="h-8 text-xs"
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${monitoringQuery.isFetching ? "animate-spin" : ""}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="p-4 border-l-4 border-l-blue-600 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Manpower</p>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{summary?.totalMonthlyManpower ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">Akumulasi Bulan Ini</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-600 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">Gudang 13</p>
            <Warehouse className="h-4 w-4 text-purple-600" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{summary?.warehouseManpower?.["13"] ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">Orang / Bulan ini</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-cyan-500 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">Gudang 5</p>
            <Warehouse className="h-4 w-4 text-cyan-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{summary?.warehouseManpower?.["5"] ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">Orang / Bulan ini</p>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500 bg-white dark:bg-slate-900 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Gudang 1</p>
            <Warehouse className="h-4 w-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{summary?.warehouseManpower?.["1"] ?? 0}</p>
          <p className="text-[11px] text-muted-foreground">Orang / Bulan ini</p>
        </Card>
      </div>

      {/* EXCEL HORIZONTAL BAR CHART CONTAINER */}
      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b pb-4">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Activity className="h-5 w-5 text-cyan-600" />
              Man Power Repair ST
            </h2>
            <p className="text-xs text-muted-foreground">
              Visualisasi grafik horizontal sesuai format Excel: Tanggal → Gudang → Shift → Total Operator
            </p>
          </div>

          {/* FILTERS */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground font-medium">Gudang:</span>
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="h-8 rounded border bg-background px-2 font-medium text-foreground focus:outline-none"
              >
                <option value="ALL">Semua Gudang</option>
                <option value="13">Gudang 13</option>
                <option value="5">Gudang 5</option>
                <option value="1">Gudang 1</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <Input
                type="date"
                value={filterFrom}
                onChange={(e) => setFilterFrom(e.target.value)}
                className="h-8 w-32 text-xs"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={filterTo}
                onChange={(e) => setFilterTo(e.target.value)}
                className="h-8 w-32 text-xs"
              />
            </div>

            {(filterFrom || filterTo || selectedWarehouse !== "ALL") && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterFrom("");
                  setFilterTo("");
                  setSelectedWarehouse("ALL");
                }}
                className="h-8 px-2 text-xs"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* CHART GRAPHIC */}
        <div className="w-full bg-white dark:bg-slate-950 p-4 rounded-xl border shadow-xs">
          <div className="mb-2 text-center">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Man Power Repair ST</p>
          </div>

          {chartData.length === 0 ? (
            <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
              Belum ada data Manpower pada periode filter ini. Silakan tambahkan di menu Monitoring.
            </div>
          ) : (
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 10, right: 35, left: 70, bottom: 10 }}
                  barSize={18}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                  <XAxis type="number" allowDecimals={false} domain={[0, "dataMax + 2"]} />
                  <YAxis
                    dataKey="groupKey"
                    type="category"
                    tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }}
                    width={70}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} Orang`, "Total Operator"]}
                    labelFormatter={(label: any) => `Shift & Gudang: ${label}`}
                  />
                  <Bar dataKey="Total" radius={[0, 4, 4, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={WAREHOUSE_COLORS[entry.warehouseNum] || "#06b6d4"}
                      />
                    ))}
                    <LabelList dataKey="Total" position="right" style={{ fontSize: 11, fontWeight: "bold", fill: "#334155" }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* LEGEND & FOOTER */}
          <div className="mt-4 flex flex-wrap items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <span className="h-3 w-3 rounded-xs bg-purple-600 inline-block" /> Gd 13
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <span className="h-3 w-3 rounded-xs bg-cyan-500 inline-block" /> Gd 5
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                <span className="h-3 w-3 rounded-xs bg-blue-600 inline-block" /> Gd 1
              </span>
            </div>
            <span>Angka di kanan batang = Jumlah Operator per Shift</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
