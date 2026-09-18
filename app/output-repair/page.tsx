"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
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
  Layers,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileSpreadsheet,
} from "lucide-react";
import Link from "next/link";
import ExcelJS from "exceljs";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const reportsQuery = useQuery({
    queryKey: ["output-repair-reports"],
    queryFn: async () => {
      const res = await fetch("/api/production-reports");
      if (!res.ok) throw new Error("Gagal memuat data output repair");
      return (await res.json()).data.reports as Report[];
    },
    staleTime: 30000,
  });

  const filteredReports = useMemo(() => {
    const all = reportsQuery.data ?? [];
    return all.filter((r) => {
      if (r.sourceType === "STOCK") return false;
      const date = r.reportDate.slice(0, 10);
      if (filterFrom && date < filterFrom) return false;
      if (filterTo && date > filterTo) return false;
      if (shiftFilter !== "ALL" && r.shift !== shiftFilter) return false;

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
  }, [reportsQuery.data, filterFrom, filterTo, shiftFilter, searchTerm]);

  const metrics = useMemo(() => {
    let totalOk = 0;
    let totalNg = 0;
    for (const r of filteredReports) {
      totalOk += r.qtyOk;
      totalNg += r.qtyNg;
    }
    const totalPcs = totalOk + totalNg;
    const efficiencyRate = totalPcs > 0 ? ((totalOk / totalPcs) * 100).toFixed(1) : "0.0";

    return {
      totalOk,
      totalNg,
      totalPcs,
      totalBatches: filteredReports.length,
      efficiencyRate,
    };
  }, [filteredReports]);

  const dailyOutputChartData = useMemo(() => {
    const map: Record<string, { rawDate: string; date: string; output: number }> = {};
    for (const report of filteredReports) {
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
  }, [filteredReports]);

  const warehouseOutputChartData = useMemo(() => {
    const map: Record<string, { warehouse: string; output: number }> = {};
    for (const report of filteredReports) {
      const warehouse = report.warehouse || "Tanpa Gudang";
      const current = map[warehouse] ?? { warehouse, output: 0 };
      current.output += report.qtyOk + report.qtyNg;
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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sheetHint", "repair"); // Ambil sheet "Repair" dari SAP file

      const res = await fetch("/api/production-reports", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal mengimpor file Output Repair");
      }

      toast.success(`Berhasil mengimpor ${data.data?.imported ?? 0} data Output Repair!`, { id: "import-repair" });
      queryClient.invalidateQueries({ queryKey: ["output-repair-reports"] });
    } catch (err: any) {
      toast.error(err.message || "Gagal mengimpor file", { id: "import-repair" });
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

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            <Wrench className="h-7 w-7 text-primary" />
            Output Repair Pipa
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Laporan hasil perbaikan pipa (Qty OK &amp; Qty NG) per operator dan per shift.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
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
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            <Upload className="mr-1.5 h-4 w-4" />
            {isImporting ? "Mengimpor..." : "Import Excel"}
          </Button>

          <Button type="button" variant="outline" size="sm" onClick={exportExcel} disabled={!filteredReports.length}>
            <Download className="mr-1.5 h-4 w-4" />
            Export Excel
          </Button>

          <Button asChild size="sm" variant="outline">
            <Link href="/reports">
              <Plus className="mr-1.5 h-4 w-4" />
              Input Laporan Baru
            </Link>
          </Button>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Qty OK</p>
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-950 p-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{metrics.totalOk.toLocaleString("id-ID")}</p>
          <p className="text-[11px] text-muted-foreground">Batang pipa lolos perbaikan</p>
        </Card>

        <Card className="p-4 border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Qty NG / NCR</p>
            <div className="rounded-md bg-rose-50 dark:bg-rose-950 p-2 text-rose-600 dark:text-rose-400">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-rose-600 dark:text-rose-400">{metrics.totalNg.toLocaleString("id-ID")}</p>
          <p className="text-[11px] text-muted-foreground">Batang pipa tidak lolos (defect)</p>
        </Card>

        <Card className="p-4 border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Processed</p>
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{metrics.totalPcs.toLocaleString("id-ID")}</p>
          <p className="text-[11px] text-muted-foreground">Total batang pipa diproses</p>
        </Card>

        <Card className="p-4 border bg-card shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tingkat Keberhasilan</p>
            <div className="rounded-md bg-primary/10 p-2 text-primary">
              <BarChart3 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-extrabold text-foreground">{metrics.efficiencyRate}%</p>
          <p className="text-[11px] text-muted-foreground">Persentase Qty OK</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">Daily Output Repair</h2>
            <p className="text-xs text-muted-foreground">Total Qty OK + Qty NG per tanggal</p>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              {dailyOutputChartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyOutputChartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString("id-ID")} Pcs`, "Output Repair"]} />
                    <Bar dataKey="output" name="Output Repair" fill="#0d9488" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data output repair</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-base font-semibold">Output Repair per Gudang</h2>
            <p className="text-xs text-muted-foreground">Total Qty OK + Qty NG berdasarkan gudang</p>
          </CardHeader>
          <CardContent>
            <div className="h-80 w-full">
              {warehouseOutputChartData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={warehouseOutputChartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="warehouse" />
                    <YAxis allowDecimals={false} />
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString("id-ID")} Pcs`, "Output Repair"]} />
                    <Bar dataKey="output" name="Output Repair" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
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

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
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
                className="h-8 rounded-md border bg-background px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">Semua Shift</option>
                <option value="SHIFT_1">Shift 1</option>
                <option value="SHIFT_2">Shift 2</option>
                <option value="SHIFT_3">Shift 3</option>
                <option value="LONGSHIFT_1">Longshift 1</option>
                <option value="LONGSHIFT_2">Longshift 2</option>
              </select>

              <div className="flex items-center gap-1 text-xs">
                <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="h-8 min-w-0 max-w-[8.5rem] flex-1 text-xs" />
                <span className="text-muted-foreground">-</span>
                <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="h-8 min-w-0 max-w-[8.5rem] flex-1 text-xs" />
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
                }}
                className="h-8 px-2 text-xs"
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
