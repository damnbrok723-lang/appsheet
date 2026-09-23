"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";
import { BarChart3, Download, FileSpreadsheet, RefreshCw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCardPermission } from "@/lib/card-permissions";
import { notifySapDataUpdated, SAP_DATA_UPDATED_EVENT } from "@/lib/sap-sync";
import { supabaseBrowser } from "@/lib/supabase-browser";

const WAREHOUSE_COLORS = ["#2563eb", "#0d9488", "#6366f1", "#f59e0b", "#e11d48"];

type Report = {
  reportDate: string;
  qtyOk: number;
  qtyNg: number;
  warehouse?: string | null;
  tonnageKg?: number | null;
  grQtyPcs?: number | null;
  giQtyPcs?: number | null;
  grBaseUnit?: number | null;
  giBaseUnit?: number | null;
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
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
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
    for (const report of (reportsQuery.data ?? []).filter((item) => {
      const hasStockCategory = (item.stockGrade ?? "").toLowerCase().includes("c") || (item.stockType ?? "").toLowerCase() === "st";
      return item.sourceType === "STOCK" && Boolean(item.warehouse) && (item.tonnageKg ?? 0) > 0 && hasStockCategory;
    })) {
      const warehouse = report.warehouse as string;
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

  const pcsRepairData = useMemo(() => {
    const map: Record<string, { rawDate: string; date: string; grQtyPcs: number; giQtyPcs: number }> = {};
    for (const report of repairReports) {
      const rawDate = report.reportDate.slice(0, 10);
      const current = map[rawDate] ?? {
        rawDate,
        date: new Date(report.reportDate).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" }),
        grQtyPcs: 0,
        giQtyPcs: 0,
      };
      const totalPcs = report.qtyOk + report.qtyNg;
      current.grQtyPcs += report.grQtyPcs ?? totalPcs;
      current.giQtyPcs += report.giQtyPcs ?? (totalPcs > 0 ? Math.round(totalPcs * 0.95) : 0);
      map[rawDate] = current;
    }
    return Object.values(map)
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
      .map((item) => ({
        ...item,
        percentageRatio: item.giQtyPcs > 0 ? Number(((item.grQtyPcs / item.giQtyPcs) * 100).toFixed(1)) : 0,
      }));
  }, [repairReports]);

  const tonnageRepairData = useMemo(() => {
    const map: Record<string, { rawDate: string; date: string; grBaseUnit: number; giBaseUnit: number }> = {};
    for (const report of repairReports) {
      const rawDate = report.reportDate.slice(0, 10);
      const current = map[rawDate] ?? {
        rawDate,
        date: new Date(report.reportDate).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" }),
        grBaseUnit: 0,
        giBaseUnit: 0,
      };
      const tonnage = Number(report.tonnageKg ?? 0);
      current.grBaseUnit += report.grBaseUnit ?? tonnage;
      current.giBaseUnit += report.giBaseUnit ?? (tonnage > 0 ? tonnage * 0.95 : 0);
      map[rawDate] = current;
    }
    return Object.values(map)
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
      .map((item) => ({
        ...item,
        grBaseUnit: Number(item.grBaseUnit.toFixed(2)),
        giBaseUnit: Number(item.giBaseUnit.toFixed(2)),
        percentageRatio: item.giBaseUnit > 0 ? Number(((item.grBaseUnit / item.giBaseUnit) * 100).toFixed(1)) : 0,
      }));
  }, [repairReports]);

  const repairWarehouseData = useMemo(() => {
    const map: Record<string, { warehouse: string; output: number; tonnageKg: number }> = {};
    for (const report of repairReports) {
      const warehouse = report.warehouse || "Tanpa Gudang";
      const current = map[warehouse] ?? { warehouse, output: 0, tonnageKg: 0 };
      current.output += report.qtyOk + report.qtyNg;
      current.tonnageKg += Number(report.tonnageKg ?? 0);
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
    if (!supabaseBrowser) {
      toast.error("Supabase Storage belum terkonfigurasi di browser", { id: "import-control" });
      return;
    }
    setIsImporting(true);
    toast.loading("Mengimpor Control Daily Repair by SAP...", { id: "import-control" });
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const sheetJobs = [
        { names: ["stok grade c", "stok grade", "stok ncr"], hint: "stok" },
        { names: ["repair", "output repair"], hint: "repair" },
        { names: ["mp repair", "mprepair", "monitoring"], hint: "mp repair" },
      ];
      type ImportCounts = { stockImported: number; repairImported: number; manpowerImported: number };
      const results: Partial<ImportCounts>[] = [];
      for (const job of sheetJobs) {
        const sheetName = workbook.SheetNames.find((name) => job.names.includes(name.trim().toLowerCase()));
        if (!sheetName) continue;
        const sheetWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(sheetWorkbook, workbook.Sheets[sheetName], sheetName);
        const bytes = XLSX.write(sheetWorkbook, { bookType: "xlsx", type: "array" });
        const sheetFile = new File([bytes], `${sheetName}.xlsx`, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const uploadUrlResponse = await fetch("/api/control-daily-repair/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: sheetFile.name }),
        });
        const uploadUrlResult = await uploadUrlResponse.json();
        if (!uploadUrlResponse.ok || !uploadUrlResult.success) throw new Error(uploadUrlResult.message || `Upload ${sheetName} gagal`);
        const uploadInfo = uploadUrlResult.data as { bucket: string; path: string; token: string; signedUrl: string };
        const uploadResponse = await fetch(uploadInfo.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": sheetFile.type },
          body: sheetFile,
        });
        if (!uploadResponse.ok) throw new Error(`Upload ${sheetName} ke Supabase gagal (HTTP ${uploadResponse.status}): ${(await uploadResponse.text()).slice(0, 240)}`);

        const response = await fetch("/api/control-daily-repair", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: uploadInfo.path, sheetHint: job.hint }),
        });
        const responseText = await response.text();
        let result: { success?: boolean; message?: string; data?: Partial<ImportCounts> };
        try {
          result = JSON.parse(responseText);
        } catch {
          throw new Error(`Server menolak import ${sheetName} (HTTP ${response.status}): ${responseText.slice(0, 160)}`);
        }
        if (!response.ok || !result.success) throw new Error(result.message || `Import ${sheetName} gagal (HTTP ${response.status})`);
        results.push(result.data ?? {});
      }
      if (!results.length) throw new Error("Sheet SAP yang didukung tidak ditemukan");
      const result = results.reduce<ImportCounts>((total, current) => ({
        stockImported: total.stockImported + (current.stockImported ?? 0),
        repairImported: total.repairImported + (current.repairImported ?? 0),
        manpowerImported: total.manpowerImported + (current.manpowerImported ?? 0),
      }), { stockImported: 0, repairImported: 0, manpowerImported: 0 });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["grafik-sap-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["grafik-sap-monitoring"] }),
        queryClient.invalidateQueries({ queryKey: ["production-reports"] }),
        queryClient.invalidateQueries({ queryKey: ["monitoring"] }),
      ]);
      notifySapDataUpdated();
      toast.success(`Import selesai: ${result.stockImported} stok, ${result.repairImported} repair, ${result.manpowerImported} manpower`, { id: "import-control" });
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
      ...pcsRepairData.map((item) => [item.rawDate, item.grQtyPcs, item.giQtyPcs, ""]),
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
        {showDaily && <Card><CardHeader><h2 className="text-base font-semibold">1. Output Repair Qty (pcs) — GR vs GI</h2><p className="text-xs text-muted-foreground">Sumber sheet Repair (GR Qty pcs vs GI Qty pcs &amp; % GR/GI)</p></CardHeader><CardContent><div className="h-80">{pcsRepairData.length ? <ResponsiveContainer width="100%" height="100%"><ComposedChart data={pcsRepairData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis yAxisId="left" allowDecimals={false} tickFormatter={(val) => `${Number(val).toLocaleString("id-ID")}`} /><YAxis yAxisId="right" orientation="right" domain={[0, 150]} tickFormatter={(val) => `${val}%`} /><Legend verticalAlign="top" align="left" wrapperStyle={{ paddingBottom: 8, fontSize: 11 }} /><Tooltip formatter={(value, name) => [name === "Persentase (GR/GI)" ? `${value}%` : `${Number(value).toLocaleString("id-ID")} pcs`, name]} /><Bar yAxisId="left" dataKey="grQtyPcs" name="GR Qty (pcs)" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={16} /><Bar yAxisId="left" dataKey="giQtyPcs" name="GI Qty (pcs)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} /><Line yAxisId="right" type="monotone" dataKey="percentageRatio" name="Persentase (GR/GI)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} /></ComposedChart></ResponsiveContainer> : chartEmpty("Belum ada data Qty (pcs)")}</div></CardContent></Card>}
        {showDaily && <Card><CardHeader><h2 className="text-base font-semibold">2. Output Repair Tonase (kg) — GR vs GI</h2><p className="text-xs text-muted-foreground">Sumber sheet Repair (GR Base unit vs GI Base unit &amp; % GR/GI)</p></CardHeader><CardContent><div className="h-80">{tonnageRepairData.length ? <ResponsiveContainer width="100%" height="100%"><ComposedChart data={tonnageRepairData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis yAxisId="left" tickFormatter={(val) => `${Number(val).toLocaleString("id-ID")}`} /><YAxis yAxisId="right" orientation="right" domain={[0, 150]} tickFormatter={(val) => `${val}%`} /><Legend verticalAlign="top" align="left" wrapperStyle={{ paddingBottom: 8, fontSize: 11 }} /><Tooltip formatter={(value, name) => [name === "Persentase (GR/GI)" ? `${value}%` : `${Number(value).toLocaleString("id-ID")} kg`, name]} /><Bar yAxisId="left" dataKey="grBaseUnit" name="GR Base unit (kg)" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={16} /><Bar yAxisId="left" dataKey="giBaseUnit" name="GI Base unit (kg)" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={16} /><Line yAxisId="right" type="monotone" dataKey="percentageRatio" name="Persentase (GR/GI)" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} /></ComposedChart></ResponsiveContainer> : chartEmpty("Belum ada data Tonase (kg)")}</div></CardContent></Card>}
        {showWarehouse && <Card><CardHeader><h2 className="text-base font-semibold">Output Repair per Gudang</h2><p className="text-xs text-muted-foreground">Qty dan tonase dari sheet Repair</p></CardHeader><CardContent><div className="h-80">{repairWarehouseData.length ? <ResponsiveContainer width="100%" height="100%"><ComposedChart data={repairWarehouseData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="warehouse" /><YAxis yAxisId="qty" allowDecimals={false} /><YAxis yAxisId="tonnage" orientation="right" tickFormatter={(val) => `${Number(val).toLocaleString("id-ID")}`} /><Legend verticalAlign="top" align="left" wrapperStyle={{ paddingBottom: 8, fontSize: 11 }} /><Tooltip formatter={(value, name) => [`${Number(value).toLocaleString("id-ID")} ${name === "Tonase (kg)" ? "kg" : "Pcs"}`, name]} /><Bar yAxisId="qty" dataKey="output" name="Output Repair (Pcs)" fill="#2563eb" radius={[4, 4, 0, 0]} /><Bar yAxisId="tonnage" dataKey="tonnageKg" name="Tonase (kg)" fill="#0d9488" radius={[4, 4, 0, 0]} /></ComposedChart></ResponsiveContainer> : chartEmpty("Belum ada data output per gudang")}</div></CardContent></Card>}
      </div>
    </div>
  );
}
