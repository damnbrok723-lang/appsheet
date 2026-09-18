"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ExcelJS from "exceljs";
import { BarChart3, Download, FileSpreadsheet, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const WAREHOUSE_COLORS = ["#2563eb", "#0d9488", "#6366f1", "#f59e0b", "#e11d48"];

type Report = {
  reportDate: string;
  qtyOk: number;
  qtyNg: number;
  warehouse?: string | null;
  tonnageKg?: number | null;
  stockGrade?: string | null;
  stockType?: string | null;
  sourceType?: string;
};

type MonitoringEntry = { date: string; operatorCount: number; warehouse: string };

function formatKg(value: number) {
  return `${value.toLocaleString("id-ID", { maximumFractionDigits: 2 })} Kg`;
}

export default function GrafikSapPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const reportsQuery = useQuery({
    queryKey: ["grafik-sap-reports"],
    queryFn: async () => {
      const response = await fetch("/api/production-reports");
      if (!response.ok) throw new Error("Gagal memuat data SAP");
      return (await response.json()).data.reports as Report[];
    },
    staleTime: 30_000,
  });

  const monitoringQuery = useQuery({
    queryKey: ["grafik-sap-monitoring"],
    queryFn: async () => {
      const response = await fetch("/api/monitoring");
      if (!response.ok) throw new Error("Gagal memuat manpower SAP");
      return (await response.json()).data.entries as MonitoringEntry[];
    },
    staleTime: 30_000,
  });

  const stockChartData = useMemo(() => {
    const map: Record<string, { warehouse: string; gradeC: number; st: number }> = {};
    for (const report of (reportsQuery.data ?? []).filter((item) => item.sourceType === "STOCK")) {
      const warehouse = report.warehouse || "Tanpa Gudang";
      const current = map[warehouse] ?? { warehouse, gradeC: 0, st: 0 };
      const tonnage = report.tonnageKg ?? 0;
      if ((report.stockGrade ?? "").toLowerCase().includes("c")) current.gradeC += tonnage;
      if ((report.stockType ?? "").toLowerCase() === "st") current.st += tonnage;
      map[warehouse] = current;
    }
    return Object.values(map).sort((a, b) => a.warehouse.localeCompare(b.warehouse, undefined, { numeric: true }));
  }, [reportsQuery.data]);

  const repairReports = useMemo(
    () => (reportsQuery.data ?? []).filter((item) => item.sourceType === "OUTPUT_REPAIR"),
    [reportsQuery.data]
  );

  const dailyRepairData = useMemo(() => {
    const map: Record<string, { rawDate: string; date: string; output: number }> = {};
    for (const report of repairReports) {
      const rawDate = report.reportDate.slice(0, 10);
      const current = map[rawDate] ?? {
        rawDate,
        date: new Date(report.reportDate).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" }),
        output: 0,
      };
      current.output += report.qtyOk + report.qtyNg;
      map[rawDate] = current;
    }
    return Object.values(map).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [repairReports]);

  const repairWarehouseData = useMemo(() => {
    const map: Record<string, { warehouse: string; output: number }> = {};
    for (const report of repairReports) {
      const warehouse = report.warehouse || "Tanpa Gudang";
      const current = map[warehouse] ?? { warehouse, output: 0 };
      current.output += report.qtyOk + report.qtyNg;
      map[warehouse] = current;
    }
    return Object.values(map).sort((a, b) => a.warehouse.localeCompare(b.warehouse, undefined, { numeric: true }));
  }, [repairReports]);

  const manpowerData = useMemo(() => {
    const map: Record<string, { warehouse: string; operators: number }> = {};
    for (const entry of monitoringQuery.data ?? []) {
      const warehouse = `Gd ${entry.warehouse}`;
      const current = map[warehouse] ?? { warehouse, operators: 0 };
      current.operators += entry.operatorCount;
      map[warehouse] = current;
    }
    return Object.values(map).sort((a, b) => a.warehouse.localeCompare(b.warehouse, undefined, { numeric: true }));
  }, [monitoringQuery.data]);

  async function importWorkbook(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    toast.loading("Mengimpor Control Daily Repair by SAP...", { id: "import-control" });
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/control-daily-repair", { method: "POST", body });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Gagal mengimpor workbook SAP");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["grafik-sap-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["grafik-sap-monitoring"] }),
        queryClient.invalidateQueries({ queryKey: ["production-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["monitoring"] }),
      ]);
      toast.success(`Import selesai: ${result.data.stockImported} stok, ${result.data.repairImported} repair, ${result.data.manpowerImported} manpower`, { id: "import-control" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengimpor workbook SAP", { id: "import-control" });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function exportWorkbook() {
    const workbook = new ExcelJS.Workbook();
    const dashboard = workbook.addWorksheet("DashBoard Repair");
    dashboard.addRows([
      ["Control Daily Repair by SAP"],
      ["Dibuat dari data grafik OfficeHub"],
      [],
      ["Grafik", "Nilai"],
      ["Total Tonase Grade C (Kg)", stockChartData.reduce((sum, item) => sum + item.gradeC, 0)],
      ["Total Tonase ST (Kg)", stockChartData.reduce((sum, item) => sum + item.st, 0)],
      ["Total Output Repair (Pcs)", repairReports.reduce((sum, item) => sum + item.qtyOk + item.qtyNg, 0)],
    ]);

    const pivot = workbook.addWorksheet("Pivot");
    pivot.addRow(["Post.Date", "Sum of Qty (pcs)", "Sum of Tonase (Kg)", "Gudang"]);
    for (const item of dailyRepairData) pivot.addRow([item.rawDate, item.output, "", ""]);
    for (const item of stockChartData) pivot.addRow(["", "", item.gradeC + item.st, item.warehouse]);

    const repair = workbook.addWorksheet("Repair");
    repair.addRow(["Plant", "Order", "Actual W.C.", "Post.Date", "NAME", "LENGTH SIDE", "WIDTH SIDE", "DIAM MM", "TEBAL", "PANJANG", "Work Centre", "Mvt", "SLOC", "BATCH", "GR Qty Pcs", "GI Qty Pcs", "GR Base Unit", "GI Base Unit", "MATERIAL NUMBER", "% GR/GI", "SETL", "Entry Date", "Trans. Loc.", "User name", "Material Doc.", "Period Pst", "Time of Entry", "Cost Centre", "Qty SETL", "LABELID", "Doc.Date", "HEAT NO.", "REMARK", "XX", "Panjang Pipa", "ST/LT", "Gudang", "Bulan", "Tonase (Kg)", "Qty (pcs)"]);
    for (const item of repairReports) repair.addRow(["", "", "", item.reportDate.slice(0, 10), "", "", "", "", "", "", "", "", "", "", item.qtyOk + item.qtyNg, 0, "", "", "", "", "", "", "", "", "", "", "", "", 0, "", item.reportDate.slice(0, 10), "", "", "", "", item.stockType ?? "", item.warehouse ?? "", "", item.tonnageKg ?? 0, item.qtyOk + item.qtyNg]);

    const stock = workbook.addWorksheet("Stok Grade C");
    stock.addRow(["SLOC", "Customer", "MATERIAL NUMBER", "DIAM \"", "LENGTH SIDE", "WIDTH SIDE", "DIAM MM", "TEBAL", "PANJANG", "Unrestricted Pcs", "Unrestricted Kg", "BATCH", "NOMOR SO", "ITEM SO", "Requested deliv.date", "CUST.REMARK", "Forecats Cust.", "PASM", "PASG", "BLOK STOK BOm", "XX", "Gudang", "Panjang Pipa", "ST/LT", "Grade"]);
    for (const item of (reportsQuery.data ?? []).filter((report) => report.sourceType === "STOCK")) {
      stock.addRow(["", "", "", "", "", "", "", "", "", item.qtyNg, item.tonnageKg ?? 0, "", "", "", "", "", "", "", "", "", "", item.warehouse ?? "", "", item.stockType ?? "", item.stockGrade ?? ""]);
    }

    const manpower = workbook.addWorksheet("MP repair");
    manpower.addRow(["No", "Tanggal", "Jumlah Operator", "Shift", "Gudang"]);
    for (const [index, item] of (monitoringQuery.data ?? []).entries()) manpower.addRow([index + 1, item.date.slice(0, 10), item.operatorCount, "", `Gd ${item.warehouse}`]);

    workbook.addWorksheet("Sheet4").addRow(["Kode Sloc", "Gudang", "Range Coil/Strip", "Coil/Strip", "Kode Batch", "Grade"]);
    for (const worksheet of workbook.worksheets) worksheet.getRow(1).font = { bold: true };

    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "Control Daily Repair by SAP.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  }

  const chartEmpty = (message: string) => <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{message}</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            <BarChart3 className="h-7 w-7 text-primary" />
            Grafik Control Daily Repair SAP
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Semua grafik operasional dari workbook Control Daily Repair by SAP.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={importWorkbook} />
          <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
            <Upload className="mr-1.5 h-4 w-4" /> {isImporting ? "Mengimpor..." : "Import SAP"}
          </Button>
          <Button type="button" variant="outline" onClick={exportWorkbook}>
            <Download className="mr-1.5 h-4 w-4" /> Export SAP
          </Button>
          <Button type="button" variant="outline" onClick={() => { reportsQuery.refetch(); monitoringQuery.refetch(); }}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Refresh
          </Button>
          <a href="/Control Daily Repair by SAP.xlsx" download className="inline-flex h-10 items-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-accent">
            <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600" /> Template SAP
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card><CardHeader><h2 className="text-base font-semibold">Man Power per Gudang</h2><p className="text-xs text-muted-foreground">Sumber sheet MP repair</p></CardHeader><CardContent><div className="h-80">{manpowerData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={manpowerData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="warehouse" /><YAxis allowDecimals={false} /><Tooltip formatter={(value) => [`${Number(value).toLocaleString("id-ID")} Orang`, "Manpower"]} /><Bar dataKey="operators" name="Manpower" fill={WAREHOUSE_COLORS[0]} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : chartEmpty("Belum ada data manpower")}</div></CardContent></Card>
        <Card><CardHeader><h2 className="text-base font-semibold">Tonase Stok Grade C dan ST per Gudang</h2><p className="text-xs text-muted-foreground">Sumber sheet Stok Grade C</p></CardHeader><CardContent><div className="h-80">{stockChartData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={stockChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="warehouse" /><YAxis /><Tooltip formatter={(value) => [formatKg(Number(value)), "Tonase"]} /><Bar dataKey="gradeC" name="Stok Grade C" fill="#e11d48" radius={[4, 4, 0, 0]} /><Bar dataKey="st" name="Stok ST" fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : chartEmpty("Belum ada data tonase stok")}</div></CardContent></Card>
        <Card><CardHeader><h2 className="text-base font-semibold">Daily Output Repair</h2><p className="text-xs text-muted-foreground">Sumber sheet Repair</p></CardHeader><CardContent><div className="h-80">{dailyRepairData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={dailyRepairData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip formatter={(value) => [`${Number(value).toLocaleString("id-ID")} Pcs`, "Output Repair"]} /><Bar dataKey="output" name="Output Repair" fill="#0d9488" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : chartEmpty("Belum ada data output repair")}</div></CardContent></Card>
        <Card><CardHeader><h2 className="text-base font-semibold">Output Repair per Gudang</h2><p className="text-xs text-muted-foreground">Sumber sheet Repair</p></CardHeader><CardContent><div className="h-80">{repairWarehouseData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={repairWarehouseData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="warehouse" /><YAxis allowDecimals={false} /><Tooltip formatter={(value) => [`${Number(value).toLocaleString("id-ID")} Pcs`, "Output Repair"]} /><Bar dataKey="output" name="Output Repair" fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : chartEmpty("Belum ada data output per gudang")}</div></CardContent></Card>
      </div>
    </div>
  );
}
