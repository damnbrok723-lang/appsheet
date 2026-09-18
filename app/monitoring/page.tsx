"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useMemo } from "react";
import { Activity, Download, FileSpreadsheet, Printer, Upload } from "lucide-react";
import ExcelJS from "exceljs";

type MonitoringEntry = { id: string; date: string; shift: string; operatorCount: number; warehouse: string; teamLeader: string | null };
type MonitoringData = { entries: MonitoringEntry[]; summary: { totalOperators: number; qtyOk: number; qtyNg: number; okPercentage: number; totalMonthlyManpower: number; warehouseManpower: Record<string, number> } };
const WAREHOUSE_COLORS: Record<string, string> = { "1": "#2563eb", "5": "#0d9488", "13": "#6366f1" };
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

    toast.loading("Mengimpor file Excel / CSV Monitoring...", { id: "import-mon" });
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/monitoring", { method: "POST", body });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || "Gagal mengimpor file");

      toast.success(`${result.data?.imported ?? 0} data monitoring berhasil diimpor!`, { id: "import-mon" });
      queryClient.invalidateQueries({ queryKey: ["monitoring"] });
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat impor", { id: "import-mon" });
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  }

  async function exportMonitoringExcel() {
    toast.loading("Mengeksport data Monitoring...", { id: "export-mon" });
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("MP repair");

      worksheet.columns = [
        { header: "No", key: "no", width: 8 },
        { header: "Tanggal", key: "tanggal", width: 16 },
        { header: "Jumlah Operator", key: "jumlahOperator", width: 18 },
        { header: "Shift", key: "shift", width: 14 },
        { header: "Gudang", key: "gudang", width: 14 },
        { header: "Kepala Regu", key: "teamLeader", width: 22 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.height = 24;

      entries.forEach((entry, idx) => {
        worksheet.addRow({
          no: idx + 1,
          tanggal: entry.date.slice(0, 10),
          jumlahOperator: entry.operatorCount,
          shift: SHIFT_LABEL[entry.shift] ?? entry.shift,
          gudang: `Gd ${entry.warehouse}`,
          teamLeader: entry.teamLeader ?? "-",
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `monitoring-mp-repair-${filterFrom || "all"}-sd-${filterTo || "all"}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Excel Monitoring berhasil di-download!", { id: "export-mon" });
    } catch {
      toast.error("Gagal export Monitoring", { id: "export-mon" });
    }
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
    <div>
      <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
        <Activity className="h-7 w-7 text-primary" />
        Monitoring Operasional
      </h1>
      <p className="text-sm text-muted-foreground mt-0.5">Input dan pantau operator, shift, gudang, dan kepala regu.</p>
    </div>
    <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      <Card className="p-4 border bg-card shadow-xs">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Manpower</p>
        <p className="text-[11px] text-muted-foreground">Bulan ini</p>
        <p className="mt-2 text-2xl font-extrabold text-foreground">{summary?.totalMonthlyManpower ?? 0}</p>
      </Card>
      <Card className="p-4 border bg-card shadow-xs">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Pergudangan</p>
        <p className="text-[11px] text-muted-foreground">Semua gudang</p>
        <p className="mt-2 text-2xl font-extrabold text-foreground">{["1","5","13"].reduce((t,w)=>t+(summary?.warehouseManpower?.[w]??0),0)}</p>
      </Card>
      <Card className="p-4 border bg-card shadow-xs">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Gudang 13</p>
        <p className="text-[11px] text-muted-foreground">Bulan ini</p>
        <p className="mt-2 text-2xl font-extrabold text-foreground">{summary?.warehouseManpower?.["13"] ?? 0}</p>
      </Card>
      <Card className="p-4 border bg-card shadow-xs">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-600 dark:text-teal-400">Gudang 5</p>
        <p className="text-[11px] text-muted-foreground">Bulan ini</p>
        <p className="mt-2 text-2xl font-extrabold text-foreground">{summary?.warehouseManpower?.["5"] ?? 0}</p>
      </Card>
      <Card className="p-4 border bg-card shadow-xs">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Gudang 1</p>
        <p className="text-[11px] text-muted-foreground">Bulan ini</p>
        <p className="mt-2 text-2xl font-extrabold text-foreground">{summary?.warehouseManpower?.["1"] ?? 0}</p>
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
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: `${WAREHOUSE_COLORS[wh] ?? "#94a3b8"}28`, color: WAREHOUSE_COLORS[wh] ?? "#64748b", outline: `1px solid ${WAREHOUSE_COLORS[wh] ?? "#94a3b8"}60` }}>
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
    <Card className="p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Input &amp; Kelola Data Monitoring</h2>
          <p className="text-xs text-muted-foreground">Format Excel/CSV: Tanggal, Shift, Jumlah Operator, Gudang, Kepala Regu</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href="/template-monitoring-mp-repair.xlsx"
            download
            className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
            Template Kosong
          </a>
          <a
            href="/Control Daily Repair by SAP.xlsx"
            download
            className="inline-flex h-8 items-center rounded-md border bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground"
          >
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-blue-600" />
            File SAP Asli
          </a>
          <label className="inline-flex h-8 cursor-pointer items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:bg-primary/90">
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Import Excel / CSV
            <input ref={importRef} type="file" accept=".csv, .xlsx, .xls" className="sr-only" onChange={importCsv} />
          </label>
          <Button type="button" variant="outline" size="sm" onClick={exportMonitoringExcel} className="h-8 text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export Excel
          </Button>
        </div>
      </div>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-5">
        <label className="space-y-2 text-sm font-medium">Tanggal<Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
        <label className="space-y-2 text-sm font-medium">Shift<select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={shift} onChange={(event) => setShift(event.target.value)}>{shiftOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="space-y-2 text-sm font-medium">Jumlah Operator<Input type="number" min="0" value={operatorCount} onChange={(event) => setOperatorCount(event.target.value)} required /></label>
        <label className="space-y-2 text-sm font-medium">Gudang<select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={warehouse} onChange={(event) => setWarehouse(event.target.value)}>{warehouses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
        <label className="space-y-2 text-sm font-medium">Kepala Regu<Input value={teamLeader} onChange={(event) => setTeamLeader(event.target.value)} required /></label>
        <Button type="submit" disabled={saveMutation.isPending} className="md:col-span-5">{saveMutation.isPending ? "Menyimpan..." : "Simpan Data Monitoring"}</Button>
      </form>
    </Card>
  </div>;
}
