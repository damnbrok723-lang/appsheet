"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Wrench,
  CheckCircle2,
  XCircle,
  BarChart3,
  Download,
  Upload,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Trash2,
} from "lucide-react";
import ExcelJS from "exceljs";
import { Bar, CartesianGrid, ComposedChart, Legend, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SAP_DATA_UPDATED_EVENT, notifySapDataUpdated } from "@/lib/sap-sync";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Report = {
  id: string;
  userId: string;
  reportDate: string;
  customer: string;
  dimensions: string;
  pipeTypes: string[];
  batchNumber: string;
  ncrNumber?: string | null;
  operatorTypes: string[];
  operatorName: string;
  shift: string;
  qtyOk: number;
  qtyNg: number;
  ngNotes?: string | null;
  processNotes?: string | null;
  sourceType?: string;
  warehouse?: string | null;
  stockType?: string | null;
  tonnageKg?: number | null;
  grQtyPcs?: number | null;
  giQtyPcs?: number | null;
  grBaseUnit?: number | null;
  giBaseUnit?: number | null;
  status: string;
};

function formatShift(shift?: string) {
  if (!shift) return "-";
  const map: Record<string, string> = {
    SHIFT_1: "Shift 1",
    SHIFT_2: "Shift 2",
    SHIFT_3: "Shift 3",
    LONGSHIFT_1: "Longshift 1",
    LONGSHIFT_2: "Longshift 2",
  };
  return map[shift] || shift;
}

export default function OutputRepairPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [shiftFilter, setShiftFilter] = useState("ALL");
  const [stockTypeFilter, setStockTypeFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === SAP_DATA_UPDATED_EVENT) queryClient.invalidateQueries({ queryKey: ["output-repair-reports"] });
    }
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [queryClient]);

  const reportsQuery = useQuery({
    queryKey: ["output-repair-reports"],
    queryFn: async () => {
      const res = await fetch("/api/production-reports?sourceTypes=MANUAL,OUTPUT_REPAIR");
      if (!res.ok) throw new Error("Gagal memuat data output repair");
      return (await res.json()).data.reports as Report[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const filteredReports = useMemo(() => {
    const all = reportsQuery.data ?? [];
    return all.filter((r) => {
      if (r.sourceType === "STOCK" || r.sourceType === "DEMO") return false;
      const date = r.reportDate.slice(0, 10);
      if (filterFrom && date < filterFrom) return false;
      if (filterTo && date > filterTo) return false;
      if (shiftFilter !== "ALL" && r.shift !== shiftFilter) return false;
      if (stockTypeFilter !== "ALL" && (r.stockType ?? "").toUpperCase() !== stockTypeFilter) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchCustomer = r.customer.toLowerCase().includes(query);
        const matchBatch = r.batchNumber.toLowerCase().includes(query);
        const matchOp = r.operatorName.toLowerCase().includes(query);
        const matchNotes = (r.processNotes ?? "").toLowerCase().includes(query);
        if (!matchCustomer && !matchBatch && !matchOp && !matchNotes) return false;
      }
      return true;
    });
  }, [reportsQuery.data, filterFrom, filterTo, shiftFilter, stockTypeFilter, searchTerm]);

  const metrics = useMemo(() => {
    let totalGr = 0;
    let totalGi = 0;
    for (const r of filteredReports) {
      const tonnage = Number(r.tonnageKg ?? 0);
      totalGr += Number(r.grBaseUnit ?? tonnage);
      totalGi += Number(r.giBaseUnit ?? (tonnage > 0 ? tonnage * 0.95 : 0));
    }

    const grVsGiRate = totalGi > 0 ? ((totalGr / totalGi) * 100).toFixed(1) : totalGr > 0 ? "100.0" : "0.0";

    return {
      totalGr,
      totalGi,
      grVsGiRate,
      totalBatches: filteredReports.length,
    };
  }, [filteredReports]);

  // Grafik 1: Pcs (GR Qty Pcs vs GI Qty Pcs & Persentase GR/GI)
  const pcsOutputChartData = useMemo(() => {
    const map: Record<string, { rawDate: string; date: string; grQtyPcs: number; giQtyPcs: number }> = {};
    for (const report of filteredReports) {
      const rawDate = report.reportDate.slice(0, 10);
      const current = map[rawDate] ?? {
        rawDate,
        date: new Date(report.reportDate).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" }),
        grQtyPcs: 0,
        giQtyPcs: 0,
      };
      const totalPcs = report.qtyOk + report.qtyNg;
      const gr = report.grQtyPcs ?? totalPcs;
      const gi = report.giQtyPcs ?? (totalPcs > 0 ? Math.round(totalPcs * 0.95) : 0);
      current.grQtyPcs += gr;
      current.giQtyPcs += gi;
      map[rawDate] = current;
    }
    return Object.values(map)
      .sort((a, b) => a.rawDate.localeCompare(b.rawDate))
      .map((item) => ({
        ...item,
        percentageRatio: item.giQtyPcs > 0 ? Number(((item.grQtyPcs / item.giQtyPcs) * 100).toFixed(1)) : 0,
      }));
  }, [filteredReports]);

  // Grafik 2: Tonase Kg (GR Base unit vs GI Base unit & Persentase GR/GI)
  const tonnageOutputChartData = useMemo(() => {
    const map: Record<string, { rawDate: string; date: string; grBaseUnit: number; giBaseUnit: number }> = {};
    for (const report of filteredReports) {
      const rawDate = report.reportDate.slice(0, 10);
      const current = map[rawDate] ?? {
        rawDate,
        date: new Date(report.reportDate).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" }),
        grBaseUnit: 0,
        giBaseUnit: 0,
      };
      const tonnage = Number(report.tonnageKg ?? 0);
      const gr = report.grBaseUnit ?? tonnage;
      const gi = report.giBaseUnit ?? (tonnage > 0 ? tonnage * 0.95 : 0);
      current.grBaseUnit += gr;
      current.giBaseUnit += gi;
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
  }, [filteredReports]);

  const warehouseOutputChartData = useMemo(() => {
    const map: Record<string, { warehouse: string; output: number; tonnageKg: number }> = {};
    for (const report of filteredReports) {
      const warehouse = report.warehouse || "Tanpa Gudang";
      const current = map[warehouse] ?? { warehouse, output: 0, tonnageKg: 0 };
      current.output += report.qtyOk + report.qtyNg;
      current.tonnageKg += Number(report.tonnageKg ?? 0);
      map[warehouse] = current;
    }
    return Object.values(map).sort((a, b) => a.warehouse.localeCompare(b.warehouse, undefined, { numeric: true }));
  }, [filteredReports]);

  const totalPages = Math.ceil(filteredReports.length / pageSize) || 1;
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage, pageSize]);

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    toast.loading("Mengimpor data Output Repair...", { id: "import-repair" });

    try {
      if (!supabaseBrowser) throw new Error("Supabase Storage belum terkonfigurasi di browser");
      const uploadUrlResponse = await fetch("/api/control-daily-repair/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name }),
      });
      const uploadUrlResult = await uploadUrlResponse.json();
      if (!uploadUrlResponse.ok || !uploadUrlResult.success) throw new Error(uploadUrlResult.message || "Gagal menyiapkan upload file");
      const uploadInfo = uploadUrlResult.data as { bucket: string; path: string; token: string };
      const { error: uploadError } = await supabaseBrowser.storage.from(uploadInfo.bucket).uploadToSignedUrl(uploadInfo.path, uploadInfo.token, file);
      if (uploadError) throw new Error(`Upload Supabase gagal: ${uploadError.message}`);
      const res = await fetch("/api/control-daily-repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: uploadInfo.path, sheetHint: "repair" }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal mengimpor file Output Repair");
      }

      toast.success(`Berhasil mengimpor ${data.data?.repairImported ?? 0} data Output Repair!`, { id: "import-repair" });
      notifySapDataUpdated();
      queryClient.invalidateQueries({ queryKey: ["output-repair-reports"] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal mengimpor file", { id: "import-repair" });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function exportExcel() {
    toast.loading("Mengeksport data Output Repair...", { id: "export-repair" });
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Output Repair");

      worksheet.columns = [
        { header: "Tanggal Produksi", key: "tanggal", width: 16 },
        { header: "Customer", key: "customer", width: 26 },
        { header: "No. Batch", key: "batch", width: 18 },
        { header: "Dimensi Pipa", key: "dimensi", width: 22 },
        { header: "Operator", key: "operator", width: 22 },
        { header: "Shift", key: "shift", width: 16 },
        { header: "Qty OK (Pcs)", key: "qtyOk", width: 16 },
        { header: "Qty NG (Pcs)", key: "qtyNg", width: 16 },
        { header: "Keterangan Proses / Repair", key: "notes", width: 30 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2563EB" } };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.height = 26;

      for (const report of filteredReports) {
        worksheet.addRow({
          tanggal: report.reportDate.slice(0, 10),
          customer: report.customer,
          batch: report.batchNumber,
          dimensi: report.dimensions,
          operator: report.operatorName,
          shift: formatShift(report.shift),
          qtyOk: report.qtyOk,
          qtyNg: report.qtyNg,
          notes: report.processNotes || "-",
        });
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `output-repair-${filterFrom || "all"}-sd-${filterTo || "all"}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Excel Output Repair berhasil didownload!", { id: "export-repair" });
    } catch {
      toast.error("Gagal export Output Repair", { id: "export-repair" });
    }
  }

  async function deleteAllOutputRepair() {
    if (!window.confirm("Hapus semua data Output Repair? Data Stok NCR, Monitoring, dan laporan manual tidak akan dihapus.")) return;
    setIsDeleting(true);
    try {
      const response = await fetch("/api/control-daily-repair?scope=output-repair", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || "Gagal menghapus data Output Repair");
      await queryClient.invalidateQueries({ queryKey: ["output-repair-reports"] });
      notifySapDataUpdated();
      toast.success(`${result.data.reportsDeleted} data Output Repair berhasil dihapus`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menghapus data Output Repair");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">
            <Wrench className="h-7 w-7 text-primary" />
            Output Repair Pipa
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Laporan hasil perbaikan pipa (Qty OK &amp; Qty NG) per operator dan per shift.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".csv, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="hidden"
          />
          <a
            href="/template-output-repair.xlsx"
            download
            className="inline-flex h-9 w-full items-center justify-center rounded-md border bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground sm:w-auto"
          >
            <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
            Template Kosong
          </a>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="w-full sm:w-auto"
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {isImporting ? "Mengimpor..." : "Import Excel"}
          </Button>

          <Button type="button" variant="outline" size="sm" onClick={exportExcel} disabled={!filteredReports.length} className="w-full sm:w-auto">
            <Download className="mr-1.5 h-4 w-4" />
            Export Excel
          </Button>

          <Button type="button" variant="outline" size="sm" onClick={deleteAllOutputRepair} disabled={isDeleting || !reportsQuery.data?.length} className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 sm:w-auto">
            <Trash2 className="mr-1.5 h-4 w-4" />
            {isDeleting ? "Menghapus..." : "Hapus Semua Data"}
          </Button>

        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="h-full rounded-[18px] border-[2px] border-[#e85c5c] bg-[#f0d9d5] p-4 shadow-none">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#e63d3d]">Total Tonase GR</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e63d3d] text-white shadow-sm">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-6 text-[30px] font-black leading-none tracking-tight text-[#e63d3d]">{Number(metrics.totalGr).toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
          <p className="mt-3 text-[11px] text-[#c24f4f]"></p>
        </Card>

        <Card className="h-full rounded-[18px] border-[2px] border-[#5ea4ee] bg-[#dbeaf9] p-4 shadow-none">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#2d7ddd]">Total Tonase GI</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#2d7ddd] text-white shadow-sm">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-6 text-[30px] font-black leading-none tracking-tight text-[#2d7ddd]">{Number(metrics.totalGi).toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="mt-3 text-[11px] text-[#2c6db3]"></p>
        </Card>

        <Card className="h-full rounded-[18px] border-[2px] border-[#d79d60] bg-[#e9d3bb] p-4 shadow-none">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-black uppercase tracking-[0.08em] text-[#d78d2b]">Tingkat Keberhasilan GR terhadap GI</p>
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#d78d2b] text-white shadow-sm">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-6 text-[30px] font-black leading-none tracking-tight text-[#d78d2b]">{metrics.grVsGiRate}%</p>
          <p className="mt-3 text-[11px] text-[#b97b21]"></p>
        </Card>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-6">
          {/* GRAFIK 1: QTY PCS (GR vs GI & PERSENTASE %) */}
          <Card className="border border-red-200 bg-white shadow-none">
            <CardHeader className="border-b border-red-100 pb-2 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold tracking-tight text-slate-800">1. Output Repair (pcs)</h2>
                </div>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                  Satuan: Pcs
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-80 w-full">
                {pcsOutputChartData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={pcsOutputChartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: "#cbd5e1" }} tick={{ fill: "#475569", fontSize: 11 }} />
                      <YAxis yAxisId="left" allowDecimals={false} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={(val) => `${Number(val).toLocaleString("id-ID")}`} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 150]} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} tick={{ fill: "#f59e0b", fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
                      <Legend verticalAlign="top" align="left" wrapperStyle={{ paddingBottom: 8, fontSize: 11, color: "#475569" }} />
                      <Tooltip
                        formatter={(value, name) => {
                          const numericValue = Number(value ?? 0);
                          if (name === "Persentase (GR/GI)") return [`${numericValue}%`, name];
                          return [`${numericValue.toLocaleString("id-ID")} pcs`, name];
                        }}
                      />
                      <Bar yAxisId="left" dataKey="grQtyPcs" name="GR Qty (pcs)" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={16} />
                      <Bar yAxisId="left" dataKey="giQtyPcs" name="GI Qty (pcs)" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={16} />
                      <Line yAxisId="right" type="monotone" dataKey="percentageRatio" name="Persentase (GR/GI)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data Qty (pcs)</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* GRAFIK 2: TONASE KG (GR vs GI & PERSENTASE %) */}
          <Card className="border border-blue-200 bg-white shadow-none">
            <CardHeader className="border-b border-blue-100 pb-2 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold tracking-tight text-slate-800">2. Output Repair (Kg)</h2>
                </div>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                  Satuan: Kg
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="h-80 w-full">
                {tonnageOutputChartData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={tonnageOutputChartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="date" tickLine={false} axisLine={{ stroke: "#cbd5e1" }} tick={{ fill: "#475569", fontSize: 11 }} />
                      <YAxis yAxisId="left" tickLine={false} axisLine={{ stroke: "#cbd5e1" }} tick={{ fill: "#475569", fontSize: 11 }} tickFormatter={(val) => `${Number(val).toLocaleString("id-ID")}`} />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 150]} tickLine={false} axisLine={{ stroke: "#cbd5e1" }} tick={{ fill: "#f59e0b", fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
                      <Legend verticalAlign="top" align="left" wrapperStyle={{ paddingBottom: 8, fontSize: 11, color: "#475569" }} />
                      <Tooltip
                        formatter={(value, name) => {
                          const numericValue = Number(value ?? 0);
                          if (name === "Persentase (GR/GI)") return [`${numericValue}%`, name];
                          return [`${numericValue.toLocaleString("id-ID")} kg`, name];
                        }}
                      />
                      <Bar yAxisId="left" dataKey="grBaseUnit" name="GR Base unit (kg)" fill="#dc2626" radius={[4, 4, 0, 0]} barSize={16} />
                      <Bar yAxisId="left" dataKey="giBaseUnit" name="GI Base unit (kg)" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={16} />
                      <Line yAxisId="right" type="monotone" dataKey="percentageRatio" name="Persentase (GR/GI)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data Tonase (kg)</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-slate-200 bg-white shadow-none">
          <CardHeader className="border-b border-slate-200 pb-2 pt-4">
            <h2 className="text-base font-bold tracking-tight text-slate-800">Output Repair per Gudang</h2>
            <p className="text-xs text-slate-500">Total Qty dan tonase berdasarkan gudang</p>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-80 w-full">
              {warehouseOutputChartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={warehouseOutputChartData} margin={{ top: 12, right: 16, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="warehouse"
                      tickLine={false}
                      axisLine={{ stroke: "#cbd5e1" }}
                      tick={{ fill: "#475569", fontSize: 11 }}
                    />
                    <YAxis
                      yAxisId="qty"
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={{ stroke: "#cbd5e1" }}
                      tick={{ fill: "#475569", fontSize: 11 }}
                      tickFormatter={(value) => `${Number(value).toLocaleString("id-ID")}`}
                    />
                    <YAxis
                      yAxisId="tonnage"
                      orientation="right"
                      tickLine={false}
                      axisLine={{ stroke: "#cbd5e1" }}
                      tick={{ fill: "#0d9488", fontSize: 11 }}
                      tickFormatter={(value) => `${Number(value).toLocaleString("id-ID")}`}
                    />
                    <Legend
                      verticalAlign="top"
                      align="left"
                      wrapperStyle={{ paddingBottom: 8, fontSize: 11, color: "#475569" }}
                    />
                    <Tooltip formatter={(value, name) => [
                      `${Number(value).toLocaleString("id-ID")} ${name === "Tonase (kg)" ? "kg" : "Pcs"}`,
                      name,
                    ]} />
                    <Bar yAxisId="qty" dataKey="output" name="Output Repair (Pcs)" fill="#2563eb" radius={[4, 4, 0, 0]} fillOpacity={0.92} />
                    <Bar yAxisId="tonnage" dataKey="tonnageKg" name="Tonase (kg)" fill="#0d9488" radius={[4, 4, 0, 0]} fillOpacity={0.92} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data gudang output repair</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER & DATA TABLE CARD */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Daftar Transaksi Output Repair
              </h2>
              <p className="text-xs text-muted-foreground">Menampilkan {filteredReports.length} transaksi perbaikan</p>
            </div>

            <div className="flex w-full flex-col gap-2 rounded-md border border-slate-200 bg-slate-50/60 p-2.5 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari Customer, Batch, Operator..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 w-full pl-8 text-xs sm:w-48"
                />
              </div>

              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="h-8 w-full rounded-md border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-auto"
              >
                <option value="ALL">Semua Shift</option>
                <option value="SHIFT_1">Shift 1</option>
                <option value="SHIFT_2">Shift 2</option>
                <option value="SHIFT_3">Shift 3</option>
                <option value="LONGSHIFT_1">Longshift 1</option>
                <option value="LONGSHIFT_2">Longshift 2</option>
              </select>

              <select
                value={stockTypeFilter}
                onChange={(e) => setStockTypeFilter(e.target.value)}
                className="h-8 w-full rounded-md border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary sm:w-auto"
              >
                <option value="ALL">Semua ST/LT</option>
                <option value="ST">ST</option>
                <option value="LT">LT</option>
              </select>

              <div className="flex w-full items-center gap-1 text-xs sm:w-auto">
                <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="h-8 min-w-0 w-full flex-1 text-xs sm:max-w-[8.5rem]" />
                <span className="text-muted-foreground">-</span>
                <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="h-8 min-w-0 w-full flex-1 text-xs sm:max-w-[8.5rem]" />
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterFrom("");
                  setFilterTo("");
                  setSearchTerm("");
                  setShiftFilter("ALL");
                  setStockTypeFilter("ALL");
                }}
                className="h-8 w-full px-2 text-xs sm:w-auto"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Batch</th>
                  <th className="px-4 py-3">Dimensi</th>
                  <th className="px-4 py-3">Operator</th>
                  <th className="px-4 py-3">Shift</th>
                  <th className="px-4 py-3 text-right">Qty OK</th>
                  <th className="px-4 py-3 text-right">Qty NG</th>
                  <th className="px-4 py-3">Keterangan Repair</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {paginatedReports.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{r.reportDate.slice(0, 10)}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{r.customer}</td>
                    <td className="px-4 py-3 font-mono text-xs">{r.batchNumber}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{r.dimensions}</td>
                    <td className="px-4 py-3 font-medium">{r.operatorName}</td>
                    <td className="px-4 py-3 text-xs">
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 font-medium text-primary">
                        {formatShift(r.shift)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">{r.qtyOk}</td>
                    <td className="px-4 py-3 text-right font-bold text-rose-600 dark:text-rose-400">{r.qtyNg}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-xs truncate">{r.processNotes || r.ngNotes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredReports.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Tidak ada data Output Repair yang sesuai dengan kriteria filter.
              </p>
            )}
          </div>

          {/* PAGINATION */}
          {filteredReports.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2">
                <span>Tampilkan</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="rounded border bg-background px-2 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value={10}>10 per halaman</option>
                  <option value={25}>25 per halaman</option>
                  <option value={50}>50 per halaman</option>
                </select>
                <span>
                  · Menampilkan {Math.min((currentPage - 1) * pageSize + 1, filteredReports.length)} -{" "}
                  {Math.min(currentPage * pageSize, filteredReports.length)} dari {filteredReports.length} data
                </span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Prev
                </Button>
                <span className="px-2 font-medium text-foreground">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="h-8 px-2"
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
