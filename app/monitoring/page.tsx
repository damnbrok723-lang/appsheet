"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMemo } from "react";

type MonitoringEntry = { id: string; date: string; shift: string; operatorCount: number; warehouse: string; teamLeader: string | null };
type MonitoringData = { entries: MonitoringEntry[]; summary: { totalOperators: number; qtyOk: number; qtyNg: number; okPercentage: number; totalMonthlyManpower: number; warehouseManpower: Record<string, number> } };
const WAREHOUSE_COLORS: Record<string, string> = { "1": "#2563eb", "5": "#16a34a", "13": "#7c3aed" };
const WAREHOUSE_LABELS: Record<string, string> = { "1": "Gudang 1", "5": "Gudang 5", "13": "Gudang 13" };
const shiftOptions = [["SHIFT_1", "Shift 1"], ["SHIFT_2", "Shift 2"], ["SHIFT_3", "Shift 3"], ["LONGSHIFT_1", "Longshift 1"], ["LONGSHIFT_2", "Longshift 2"]];
const warehouses = ["1", "5", "13"];

async function fetchMonitoring() {
  const response = await fetch("/api/monitoring");
  if (!response.ok) throw new Error("Gagal memuat monitoring");
  const data = (await response.json()).data as MonitoringData;
  window.localStorage.setItem("officehub-monitoring-cache", JSON.stringify(data));
  return data;
}

function getCachedMonitoring() {
  if (typeof window === "undefined") return undefined;
  try {
    const cached = window.localStorage.getItem("officehub-monitoring-cache");
    return cached ? JSON.parse(cached) as MonitoringData : undefined;
  } catch {
    return undefined;
  }
}

export default function MonitoringPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["monitoring"], queryFn: fetchMonitoring, initialData: getCachedMonitoring, staleTime: 30_000, refetchOnWindowFocus: false });
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState("SHIFT_1");
  const [operatorCount, setOperatorCount] = useState("");
  const [warehouse, setWarehouse] = useState("1");
  const [teamLeader, setTeamLeader] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/monitoring", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, shift, operatorCount: Number(operatorCount), warehouse, teamLeader }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan monitoring");
    },
    onSuccess: () => { toast.success("Data monitoring tersimpan"); setOperatorCount(""); setTeamLeader(""); queryClient.invalidateQueries({ queryKey: ["monitoring"] }); },
    onError: (error) => toast.error(error.message),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const missing = [!date && "Tanggal", !shift && "Shift", !operatorCount && "Jumlah Operator", !warehouse && "Gudang", !teamLeader.trim() && "Kepala Regu"].filter(Boolean);
    if (missing.length) { toast.warning(`Lengkapi dulu: ${missing.join(", ")}`); return; }
    saveMutation.mutate();
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const rows = (await file.text()).split(/\r?\n/).filter(Boolean).slice(1).map((line) => line.split(",").map((value) => value.trim().replace(/^"|"$/g, "")));
    let success = 0;
    for (const [rowDate, rowShift, rowOperators, rowWarehouse, rowLeader] of rows) {
      if (!rowDate || !rowShift || !rowOperators || !warehouses.includes(rowWarehouse) || !rowLeader) continue;
      const response = await fetch("/api/monitoring", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: rowDate, shift: rowShift.toUpperCase(), operatorCount: Number(rowOperators), warehouse: rowWarehouse, teamLeader: rowLeader }) });
      if (response.ok) success += 1;
    }
    toast.success(`${success} baris monitoring berhasil diimpor`);
    queryClient.invalidateQueries({ queryKey: ["monitoring"] });
    if (importRef.current) importRef.current.value = "";
  }

  const entries = (query.data?.entries ?? []).filter((entry) => {
    const entryDate = entry.date.slice(0, 10);
    return (!filterFrom || entryDate >= filterFrom) && (!filterTo || entryDate <= filterTo);
  });
  const summary = query.data?.summary;
  // Kelompokkan: Tanggal → Gudang → [shift entries]
  const groupedData = useMemo(() => {
    const result: Record<string, { dateLabel: string; warehouses: Record<string, { entries: MonitoringEntry[]; total: number }>; total: number }> = {};
    for (const entry of entries) {
      const dateKey = entry.date.slice(0, 10);
      const dateLabel = new Date(entry.date).toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
      if (!result[dateKey]) result[dateKey] = { dateLabel, warehouses: {}, total: 0 };
      if (!result[dateKey].warehouses[entry.warehouse]) result[dateKey].warehouses[entry.warehouse] = { entries: [], total: 0 };
      result[dateKey].warehouses[entry.warehouse].entries.push(entry);
      result[dateKey].warehouses[entry.warehouse].total += entry.operatorCount;
      result[dateKey].total += entry.operatorCount;
    }
    return result;
  }, [entries]);

  const SHIFT_LABEL: Record<string, string> = { SHIFT_1: "Shift 1", SHIFT_2: "Shift 2", SHIFT_3: "Shift 3", LONGSHIFT_1: "Longshift 1", LONGSHIFT_2: "Longshift 2" };

  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold tracking-tight">Monitoring Operasional</h1><p className="text-muted-foreground">Input dan pantau operator, shift, gudang, dan kepala regu.</p></div>
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      <Card className="p-5 border-l-4 border-l-slate-500">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Manpower</p>
        <p className="text-xs text-muted-foreground">Bulan ini</p>
        <p className="mt-2 text-2xl font-bold">{summary?.totalMonthlyManpower ?? 0}</p>
      </Card>
      <Card className="p-5 border-l-4 border-l-amber-500">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Pergudangan</p>
        <p className="text-xs text-muted-foreground">Semua gudang</p>
        <p className="mt-2 text-2xl font-bold">{["1","5","13"].reduce((t,w)=>t+(summary?.warehouseManpower?.[w]??0),0)}</p>
      </Card>
      <Card className="p-5 border-l-4" style={{ borderLeftColor: WAREHOUSE_COLORS["13"] }}>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Gudang 13</p>
        <p className="text-xs text-muted-foreground">Bulan ini</p>
        <p className="mt-2 text-2xl font-bold">{summary?.warehouseManpower?.["13"] ?? 0}</p>
      </Card>
      <Card className="p-5 border-l-4" style={{ borderLeftColor: WAREHOUSE_COLORS["5"] }}>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Gudang 5</p>
        <p className="text-xs text-muted-foreground">Bulan ini</p>
        <p className="mt-2 text-2xl font-bold">{summary?.warehouseManpower?.["5"] ?? 0}</p>
      </Card>
      <Card className="p-5 border-l-4" style={{ borderLeftColor: WAREHOUSE_COLORS["1"] }}>
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Gudang 1</p>
        <p className="text-xs text-muted-foreground">Bulan ini</p>
        <p className="mt-2 text-2xl font-bold">{summary?.warehouseManpower?.["1"] ?? 0}</p>
      </Card>
    </div>
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Man Power Repair ST</h2>
          <p className="text-xs text-muted-foreground">Pengelompokan: Tanggal → Gudang → Shift → Jumlah Operator</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="text-xs font-medium">Dari<Input type="date" value={filterFrom} onChange={(event) => setFilterFrom(event.target.value)} /></label>
          <label className="text-xs font-medium">Sampai<Input type="date" value={filterTo} onChange={(event) => setFilterTo(event.target.value)} /></label>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setFilterFrom(""); setFilterTo(""); }}>Reset</Button>
        </div>
      </div>

      {/* Legenda warna gudang */}
      <div className="mb-4 flex flex-wrap gap-4">
        {Object.entries(WAREHOUSE_LABELS).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs font-medium">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: WAREHOUSE_COLORS[key] }} />
            {label}
          </span>
        ))}
      </div>

      {Object.keys(groupedData).length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Belum ada data pada rentang tanggal ini.</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedData).map(([dateKey, dateGroup]) => (
            <div key={dateKey} className="overflow-hidden rounded-xl border">
              {/* Header Tanggal */}
              <div className="flex items-center justify-between bg-muted/60 px-4 py-2.5">
                <span className="flex items-center gap-2 text-sm font-bold">
                  <span className="text-base">📅</span>
                  {dateGroup.dateLabel}
                </span>
                <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                  Total: {dateGroup.total} orang
                </span>
              </div>

              {/* Per Gudang */}
              {Object.entries(dateGroup.warehouses)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([wh, whGroup]) => (
                <div key={wh} className="border-t">
                  {/* Sub-header Gudang */}
                  <div
                    className="flex items-center justify-between px-5 py-2"
                    style={{ borderLeft: `4px solid ${WAREHOUSE_COLORS[wh] ?? "#94a3b8"}`, backgroundColor: `${WAREHOUSE_COLORS[wh] ?? "#94a3b8"}12` }}
                  >
                    <span className="flex items-center gap-2 text-xs font-semibold" style={{ color: WAREHOUSE_COLORS[wh] ?? "#64748b" }}>
                      🏭 {WAREHOUSE_LABELS[wh] ?? `Gudang ${wh}`}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">Subtotal: {whGroup.total} orang</span>
                  </div>

                  {/* Baris Shift */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-t bg-muted/20 text-xs text-muted-foreground">
                        <th className="px-6 py-1.5 text-left font-medium">Shift</th>
                        <th className="px-4 py-1.5 text-left font-medium">Kepala Regu</th>
                        <th className="px-4 py-1.5 text-right font-medium">Jumlah Operator</th>
                      </tr>
                    </thead>
                    <tbody>
                      {whGroup.entries.map((entry) => (
                        <tr key={entry.id} className="border-t hover:bg-muted/30 transition-colors">
                          <td className="px-6 py-2">
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset" style={{ backgroundColor: `${WAREHOUSE_COLORS[wh] ?? "#94a3b8"}18`, color: WAREHOUSE_COLORS[wh] ?? "#64748b", ringColor: WAREHOUSE_COLORS[wh] ?? "#94a3b8" }}>
                              {SHIFT_LABEL[entry.shift] ?? entry.shift}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">{entry.teamLeader ?? "-"}</td>
                          <td className="px-4 py-2 text-right">
                            <span className="font-bold">{entry.operatorCount}</span>
                            <span className="ml-1 text-xs text-muted-foreground">orang</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </Card>
    <Card className="p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Input Monitoring</h2><p className="text-xs text-muted-foreground">Format CSV: Tanggal, Shift, Jumlah Operator, Gudang, Kepala Regu</p></div><div className="flex gap-2"><a href="/monitoring-template.csv" download className="rounded-md border px-3 py-2 text-sm">Download Template</a><label className="cursor-pointer rounded-md border px-3 py-2 text-sm">Import CSV<input ref={importRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={importCsv} /></label></div></div><form onSubmit={submit} className="grid gap-4 md:grid-cols-5"><label className="space-y-2 text-sm">Tanggal<Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label className="space-y-2 text-sm">Shift<select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={shift} onChange={(event) => setShift(event.target.value)}>{shiftOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="space-y-2 text-sm">Jumlah Operator<Input type="number" min="0" value={operatorCount} onChange={(event) => setOperatorCount(event.target.value)} required /></label><label className="space-y-2 text-sm">Gudang<select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={warehouse} onChange={(event) => setWarehouse(event.target.value)}>{warehouses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="space-y-2 text-sm">Kepala Regu<Input value={teamLeader} onChange={(event) => setTeamLeader(event.target.value)} required /></label><Button type="submit" disabled={saveMutation.isPending} className="md:col-span-5">{saveMutation.isPending ? "Menyimpan..." : "Simpan monitoring"}</Button></form></Card>
  </div>;
}
