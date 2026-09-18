"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ExcelJS from "exceljs";
import { BarChart3, Download, FileSpreadsheet, RefreshCw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCardPermission } from "@/lib/card-permissions";
import { notifySapDataUpdated, SAP_DATA_UPDATED_EVENT } from "@/lib/sap-sync";

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
  const [isDeleting, setIsDeleting] = useState(false);

  const sessionQuery = useQuery({
    queryKey: ["auth-session"],
    queryFn: async () => (await fetch("/api/auth/session")).json(),
    staleTime: 5 * 60 * 1000,
  });
  const userRole = (sessionQuery.data?.user?.role as string) || "EMPLOYEE";
  const userPermissions = sessionQuery.data?.user?.permissions as string[] | undefined;
  const showManpower = useCardPermission("grafik_sap_manpower", userRole, userPermissions);
  const showStock = useCardPermission("grafik_sap_stock", userRole, userPermissions);
  const showDaily = useCardPermission("grafik_sap_daily", userRole, userPermissions);
  const showWarehouse = useCardPermission("grafik_sap_warehouse", userRole, userPermissions);
  const showImport = useCardPermission("grafik_sap_import", userRole, userPermissions);
  const showExport = useCardPermission("grafik_sap_export", userRole, userPermissions);
  const showDelete = useCardPermission("grafik_sap_delete", userRole, userPermissions);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== SAP_DATA_UPDATED_EVENT) return;
      queryClient.invalidateQueries({ queryKey: ["grafik-sap-reports"] });
      queryClient.invalidateQueries({ queryKey: ["grafik-sap-monitoring"] });
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [queryClient]);

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
      notifySapDataUpdated();
      toast.success(`Import selesai: ${result.data.stockImported} stok, ${result.data.repairImported} repair, ${result.data.manpowerImported} manpower`, { id: "import-control" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengimpor workbook SAP", { id: "import-control" });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function exportWorkbook() {
    const templateResponse = await fetch("/Control Daily Repair by SAP.xlsx");
    if (!templateResponse.ok) {
      toast.error("Template SAP tidak ditemukan");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await templateResponse.arrayBuffer());

    function replaceSheetRows(sheetName: string, rows: (string | number)[][]) {
      const worksheet = workbook.getWorksheet(sheetName);
      if (!worksheet) return;
      const templateRow = worksheet.getRow(2);
      if (worksheet.rowCount > 1) worksheet.spliceRows(2, worksheet.rowCount - 1);
      for (const values of rows) {
        const row = worksheet.addRow(values);
        values.forEach((_, index) => {
          row.getCell(index + 1).style = templateRow.getCell(index + 1).style;
        });
      }
    }

    replaceSheetRows("DashBoard Repair", [
      ["Control Daily Repair by SAP"],
      ["Dibuat dari data grafik OfficeHub"],
      [],
      ["Grafik", "Nilai"],
      ["Total Tonase Grade C (Kg)", stockChartData.reduce((sum, item) => sum + item.gradeC, 0)],
      ["Total Tonase ST (Kg)", stockChartData.reduce((sum, item) => sum + item.st, 0)],
      ["Total Output Repair (Pcs)", repairReports.reduce((sum, item) => sum + item.qtyOk + item.qtyNg, 0)],
    ]);

    replaceSheetRows("Pivot", [
      ["Post.Date", "Sum of Qty (pcs)", "Sum of Tonase (Kg)", "Gudang"],
      ...dailyRepairData.map((item) => [item.rawDate, item.output, "", ""]),
      ...stockChartData.map((item) => ["", "", item.gradeC + item.st, item.warehouse]),
    ]);

    replaceSheetRows("Repair", repairReports.map((item) => ["", "", "", item.reportDate.slice(0, 10), "", "", "", "", "", "", "", "", "", "", item.qtyOk + item.qtyNg, 0, "", "", "", "", "", "", "", "", "", "", "", "", 0, "", item.reportDate.slice(0, 10), "", "", "", "", item.stockType ?? "", item.warehouse ?? "", "", item.tonnageKg ?? 0, item.qtyOk + item.qtyNg]));

    replaceSheetRows("Stok Grade C", (reportsQuery.data ?? []).filter((report) => report.sourceType === "STOCK").map((item) => ["", "", "", "", "", "", "", "", "", item.qtyNg, item.tonnageKg ?? 0, "", "", "", "", "", "", "", "", "", "", item.warehouse ?? "", "", item.stockType ?? "", item.stockGrade ?? ""]));

    replaceSheetRows("MP repair", (monitoringQuery.data ?? []).map((item, index) => [index + 1, item.date.slice(0, 10), item.operatorCount, "", `Gd ${item.warehouse}`]));

    const buffer = await workbook.xlsx.writeBuffer();
    const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "Control Daily Repair by SAP.xlsx";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function deleteImportedData() {
    if (!window.confirm("Hapus semua data import SAP milik user ini? Data Laporan dan foto tidak akan dihapus.")) return;
    setIsDeleting(true);
    try {
      const response = await fetch("/api/control-daily-repair", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Gagal menghapus data SAP");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["grafik-sap-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["grafik-sap-monitoring"] }),
      ]);
      notifySapDataUpdated();
      toast.success(`Data SAP dihapus: ${result.data.reportsDeleted} report, ${result.data.monitoringDeleted} manpower`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus data SAP");
    } finally {
      setIsDeleting(false);
    }
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
          {showImport && <Button type="button" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
            <Upload className="mr-1.5 h-4 w-4" /> {isImporting ? "Mengimpor..." : "Import SAP"}
          </Button>}
          {showExport && <Button type="button" variant="outline" onClick={exportWorkbook}>
            <Download className="mr-1.5 h-4 w-4" /> Export SAP
          </Button>}
          <Button type="button" variant="outline" onClick={() => { reportsQuery.refetch(); monitoringQuery.refetch(); }}>
            <RefreshCw className="mr-1.5 h-4 w-4" /> Reset / Refresh
          </Button>
          {showImport && <a href="/Control Daily Repair by SAP.xlsx" download className="inline-flex h-10 items-center rounded-md border bg-background px-3 text-sm font-medium hover:bg-accent">
            <FileSpreadsheet className="mr-1.5 h-4 w-4 text-emerald-600" /> Template SAP
          </a>}
          {showDelete && <Button type="button" variant="outline" onClick={deleteImportedData} disabled={isDeleting} className="border-rose-300 text-rose-600 hover:bg-rose-50 hover:text-rose-700">
            <Trash2 className="mr-1.5 h-4 w-4" /> {isDeleting ? "Menghapus..." : "Hapus Data SAP"}
          </Button>}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {showManpower && <Card><CardHeader><h2 className="text-base font-semibold">Man Power per Gudang</h2><p className="text-xs text-muted-foreground">Sumber sheet MP repair</p></CardHeader><CardContent><div className="h-80">{manpowerData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={manpowerData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="warehouse" /><YAxis allowDecimals={false} /><Tooltip formatter={(value) => [`${Number(value).toLocaleString("id-ID")} Orang`, "Manpower"]} /><Bar dataKey="operators" name="Manpower" fill={WAREHOUSE_COLORS[0]} radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : chartEmpty("Belum ada data manpower")}</div></CardContent></Card>}
        {showStock && <Card><CardHeader><h2 className="text-base font-semibold">Tonase Stok Grade C dan ST per Gudang</h2><p className="text-xs text-muted-foreground">Sumber sheet Stok Grade C</p></CardHeader><CardContent><div className="h-80">{stockChartData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={stockChartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="warehouse" /><YAxis /><Tooltip formatter={(value) => [formatKg(Number(value)), "Tonase"]} /><Bar dataKey="gradeC" name="Stok Grade C" fill="#e11d48" radius={[4, 4, 0, 0]} /><Bar dataKey="st" name="Stok ST" fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : chartEmpty("Belum ada data tonase stok")}</div></CardContent></Card>}
        {showDaily && <Card><CardHeader><h2 className="text-base font-semibold">Daily Output Repair</h2><p className="text-xs text-muted-foreground">Sumber sheet Repair</p></CardHeader><CardContent><div className="h-80">{dailyRepairData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={dailyRepairData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip formatter={(value) => [`${Number(value).toLocaleString("id-ID")} Pcs`, "Output Repair"]} /><Bar dataKey="output" name="Output Repair" fill="#0d9488" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : chartEmpty("Belum ada data output repair")}</div></CardContent></Card>}
        {showWarehouse && <Card><CardHeader><h2 className="text-base font-semibold">Output Repair per Gudang</h2><p className="text-xs text-muted-foreground">Sumber sheet Repair</p></CardHeader><CardContent><div className="h-80">{repairWarehouseData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={repairWarehouseData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="warehouse" /><YAxis allowDecimals={false} /><Tooltip formatter={(value) => [`${Number(value).toLocaleString("id-ID")} Pcs`, "Output Repair"]} /><Bar dataKey="output" name="Output Repair" fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : chartEmpty("Belum ada data output per gudang")}</div></CardContent></Card>}
      </div>
    </div>
  );
}
