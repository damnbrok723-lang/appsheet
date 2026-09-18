"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  AlertTriangle,
  Camera,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  PackageX,
  Printer,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ExcelJS from "exceljs";

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
  photoData?: string | null;
  hasPhoto?: boolean;
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

export default function StokNcrPage() {
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; customer: string; ncr: string; batch: string } | null>(null);

  const reportsQuery = useQuery({
    queryKey: ["production-reports"],
    queryFn: async () => {
      const res = await fetch("/api/production-reports");
      if (!res.ok) throw new Error("Gagal memuat data NCR");
      return (await res.json()).data.reports as Report[];
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filterFrom, filterTo, searchTerm]);

  // Filter khusus data yang memiliki stok NCR / Qty NG > 0
  const ncrReports = useMemo(() => {
    const all = reportsQuery.data ?? [];
    return all.filter((r) => r.qtyNg > 0 || (r.ncrNumber && r.ncrNumber.trim() !== ""));
  }, [reportsQuery.data]);

  const filteredReports = useMemo(() => {
    return ncrReports.filter((r) => {
      const date = r.reportDate.slice(0, 10);
      if (filterFrom && date < filterFrom) return false;
      if (filterTo && date > filterTo) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchCustomer = r.customer.toLowerCase().includes(query);
        const matchNcr = (r.ncrNumber ?? "").toLowerCase().includes(query);
        const matchBatch = r.batchNumber.toLowerCase().includes(query);
        const matchNotes = (r.ngNotes ?? "").toLowerCase().includes(query);
        if (!matchCustomer && !matchNcr && !matchBatch && !matchNotes) return false;
      }
      return true;
    });
  }, [ncrReports, filterFrom, filterTo, searchTerm]);

  // Total statistik NCR
  const stats = useMemo(() => {
    let totalNgPcs = 0;
    const customers = new Set<string>();
    const ncrSet = new Set<string>();

    for (const r of filteredReports) {
      totalNgPcs += r.qtyNg;
      if (r.customer) customers.add(r.customer);
      if (r.ncrNumber) ncrSet.add(r.ncrNumber);
    }

    return {
      totalRecords: filteredReports.length,
      totalNgPcs,
      totalCustomers: customers.size,
      totalNcrDocs: ncrSet.size || filteredReports.length,
    };
  }, [filteredReports]);

  // Chart data NCR per Customer
  const customerChartData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of filteredReports) {
      map[r.customer] = (map[r.customer] ?? 0) + r.qtyNg;
    }
    return Object.entries(map)
      .map(([customer, count]) => ({ customer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [filteredReports]);

  // Chart data NCR per Date
  const dateChartData = useMemo(() => {
    const map: Record<string, { rawDate: string; date: string; ng: number }> = {};
    for (const r of filteredReports) {
      const rawDate = r.reportDate.slice(0, 10);
      const date = new Date(r.reportDate).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" });
      const current = map[rawDate] ?? { rawDate, date, ng: 0 };
      current.ng += r.qtyNg;
      map[rawDate] = current;
    }
    return Object.values(map).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [filteredReports]);

  const totalPages = Math.ceil(filteredReports.length / pageSize) || 1;
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage, pageSize]);

  async function exportNcrExcel() {
    toast.loading("Mengeksport data Stok NCR...", { id: "export-ncr" });
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Stok NCR Grade C");

      worksheet.columns = [
        { header: "No. NCR", key: "ncr", width: 20 },
        { header: "Tanggal Produksi", key: "tanggal", width: 16 },
        { header: "Customer", key: "customer", width: 26 },
        { header: "Dimensi Pipa", key: "dimensi", width: 22 },
        { header: "Jenis Pipa", key: "pipa", width: 14 },
        { header: "No. Batch", key: "batch", width: 18 },
        { header: "Qty NG (Pcs)", key: "qtyNg", width: 16 },
        { header: "Keterangan Cacat / NG", key: "ngNotes", width: 30 },
        { header: "Operator Repair", key: "operator", width: 22 },
        { header: "Shift", key: "shift", width: 16 },
        { header: "Status", key: "status", width: 14 },
        { header: "Foto Cacat", key: "foto", width: 22 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF991B1B" } };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.height = 26;

      for (let i = 0; i < filteredReports.length; i++) {
        const report = filteredReports[i];
        let photoUrl = report.photoData;

        if (!photoUrl && report.hasPhoto) {
          try {
            const res = await fetch(`/api/production-reports/${report.id}`);
            const data = await res.json();
            if (data.data?.photoData) photoUrl = data.data.photoData;
          } catch {}
        }

        const row = worksheet.addRow({
          ncr: report.ncrNumber || `NCR-${report.batchNumber}`,
          tanggal: report.reportDate.slice(0, 10),
          customer: report.customer,
          dimensi: report.dimensions,
          pipa: Array.isArray(report.pipeTypes) ? report.pipeTypes.join("; ") : report.pipeTypes,
          batch: report.batchNumber,
          qtyNg: report.qtyNg,
          ngNotes: report.ngNotes ?? "-",
          operator: report.operatorName,
          shift: formatShift(report.shift),
          status: report.status,
          foto: photoUrl ? "" : "Tanpa Foto",
        });

        row.alignment = { vertical: "middle" };

        if (photoUrl && photoUrl.startsWith("data:image/")) {
          row.height = 65;
          const mimeType = photoUrl.substring(photoUrl.indexOf(":") + 1, photoUrl.indexOf(";"));
          const extension = mimeType.includes("png") ? "png" : "jpeg";
          const base64 = photoUrl.split(",")[1];

          const imageId = workbook.addImage({
            base64: base64,
            extension: extension as "png" | "jpeg",
          });

          worksheet.addImage(imageId, {
            tl: { col: 11, row: i + 1 },
            ext: { width: 110, height: 75 },
            editAs: "oneCell",
          });
        }
      }

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `stok-ncr-grade-c-${filterFrom || "all"}-sd-${filterTo || "all"}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("Excel Stok NCR berhasil di-download!", { id: "export-ncr" });
    } catch {
      toast.error("Gagal export Stok NCR", { id: "export-ncr" });
    }
  }

  return (
    <div className="space-y-6">
      {/* SCREEN VIEW */}
      <div className="print:hidden space-y-6">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight text-rose-700 dark:text-rose-400">
            <ShieldAlert className="h-8 w-8" />
            Pemantauan Stok NCR & Grade C
          </h1>
          <p className="text-muted-foreground">
            Daftar stok pipa defect, Non-Conformance Report (NCR), serta catatan cacat per customer.
          </p>
        </div>

        {/* METRIK STOK NCR */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-rose-300 bg-rose-100/60 p-5 shadow-sm dark:border-rose-800 dark:bg-rose-950/40">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-rose-950 dark:text-rose-200">Total Pcs NG / NCR</p>
              <PackageX className="h-5 w-5 text-rose-700 dark:text-rose-400" />
            </div>
            <p className="mt-2 text-3xl font-extrabold text-rose-950 dark:text-rose-100">{stats.totalNgPcs.toLocaleString("id-ID")}</p>
            <p className="mt-1 text-xs font-medium text-rose-900 dark:text-rose-300">Batang pipa defect tersimpan</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Dokumen NCR</p>
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.totalNcrDocs}</p>
            <p className="mt-1 text-xs text-muted-foreground">Total laporan kasus NCR</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Customer Terpengaruh</p>
              <FileSpreadsheet className="h-5 w-5 text-blue-500" />
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.totalCustomers}</p>
            <p className="mt-1 text-xs text-muted-foreground">Customer pemilik batch NCR</p>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">Total Kasus Defect</p>
              <ShieldAlert className="h-5 w-5 text-purple-500" />
            </div>
            <p className="mt-2 text-3xl font-bold">{stats.totalRecords}</p>
            <p className="mt-1 text-xs text-muted-foreground">Item tercatat dalam database</p>
          </Card>
        </div>

        {/* GRAFIK DISTRIBUSI NCR */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">Tren Qty NG / NCR per Tanggal</h2>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                {dateChartData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dateChartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="ng" name="Qty NG (Pcs)" fill="#e11d48" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data NCR</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-base font-semibold">Top Customer dengan Qty NG Terbanyak</h2>
            </CardHeader>
            <CardContent>
              <div className="h-80 w-full">
                {customerChartData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={customerChartData} layout="vertical" margin={{ top: 8, right: 16, left: 16, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis
                        dataKey="customer"
                        type="category"
                        width={140}
                        interval={0}
                        tick={{ fontSize: 10, fill: "currentColor" }}
                        tickFormatter={(val: string) => (val.length > 18 ? `${val.slice(0, 16)}…` : val)}
                      />
                      <Tooltip formatter={(value) => [`${(Number(value) || 0).toLocaleString("id-ID")} Pcs`, "Qty NG"]} />
                      <Bar dataKey="count" name="Qty NG (Pcs)" fill="#be123c" radius={[0, 4, 4, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data NCR</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* DAFTAR STOK NCR & TABEL DATA */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
                  <ShieldAlert className="h-5 w-5 text-rose-600" />
                  Daftar Stok Pipa NCR / Grade C
                </h2>
                <p className="text-xs text-muted-foreground">Menampilkan {filteredReports.length} data stok NCR</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Cari Customer, NCR, Batch..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-8 w-48 pl-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="h-8 text-xs w-32" />
                  <span>-</span>
                  <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="h-8 text-xs w-32" />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={exportNcrExcel} disabled={!filteredReports.length} className="h-8 text-xs">
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  Export Excel NCR
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => window.print()} disabled={!filteredReports.length} className="h-8 text-xs">
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Cetak PDF
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y">
              {paginatedReports.map((report) => (
                <div key={report.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    {(report.photoData || report.hasPhoto) ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (report.photoData) {
                            setPreviewPhoto({
                              url: report.photoData,
                              customer: report.customer,
                              ncr: report.ncrNumber || `NCR-${report.batchNumber}`,
                              batch: report.batchNumber,
                            });
                          } else {
                            toast.loading("Memuat foto cacat...", { id: "load-ncr-photo" });
                            try {
                              const res = await fetch(`/api/production-reports/${report.id}`);
                              const data = await res.json();
                              toast.dismiss("load-ncr-photo");
                              if (data.data?.photoData) {
                                setPreviewPhoto({
                                  url: data.data.photoData,
                                  customer: report.customer,
                                  ncr: report.ncrNumber || `NCR-${report.batchNumber}`,
                                  batch: report.batchNumber,
                                });
                              } else {
                                toast.error("Foto tidak ditemukan");
                              }
                            } catch {
                              toast.dismiss("load-ncr-photo");
                              toast.error("Gagal memuat foto");
                            }
                          }
                        }}
                        className="group relative h-12 w-12 flex-shrink-0 cursor-pointer overflow-hidden rounded-md border border-rose-300 bg-rose-50 transition hover:ring-2 hover:ring-rose-500 focus:outline-none"
                        title="Klik untuk cek foto cacat NCR"
                      >
                        {report.photoData ? (
                          <img src={report.photoData} alt={report.customer} className="h-full w-full object-cover transition group-hover:scale-110" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-rose-100 text-rose-700">
                            <Camera className="h-5 w-5" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border border-dashed bg-muted/40 text-muted-foreground/40">
                        <Camera className="h-5 w-5" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-rose-100 px-2 py-0.5 font-mono text-xs font-bold text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
                          {report.ncrNumber || `NCR-${report.batchNumber}`}
                        </span>
                        <Link href={`/reports/${report.id}`} className="font-semibold text-foreground hover:underline">
                          {report.customer}
                        </Link>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Tanggal: {report.reportDate.slice(0, 10)} · Dimensi: {report.dimensions} · Batch: {report.batchNumber}
                      </p>
                      {report.ngNotes && (
                        <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                          Cacat: {report.ngNotes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <p className="text-base font-bold text-rose-600 dark:text-rose-400">
                        {report.qtyNg} Pcs NG
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Shift: {formatShift(report.shift)} · Operator: {report.operatorName}
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="h-8 text-xs">
                      <Link href={`/reports/${report.id}`}>
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Detail
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {filteredReports.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                Tidak ada stok NCR / defect yang ditemukan pada rentang filter ini.
              </p>
            ) : (
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
                    {Math.min(currentPage * pageSize, filteredReports.length)} dari {filteredReports.length} kasus NCR
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

      {/* PRINT VIEW PDF DOKUMEN STOK NCR */}
      <div className="print-only print:space-y-6 bg-white text-black p-4">
        <div className="border-b pb-4 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide text-rose-800">Laporan Stok NCR & Grade C</h1>
          <p className="text-xs text-gray-600 mt-1">
            Periode: {filterFrom || "Semua Data"} s/d {filterTo || "Hari Ini"} · Dicetak: {new Date().toLocaleDateString("id-ID")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
          <div className="rounded border border-rose-300 bg-rose-50 p-3">Total Stok NG/NCR: {stats.totalNgPcs.toLocaleString("id-ID")} pcs</div>
          <div className="rounded border border-gray-300 bg-gray-50 p-3">Total Dokumen NCR: {stats.totalNcrDocs} kasus</div>
        </div>

        <table className="w-full border-collapse border border-gray-300 text-xs">
          <thead>
            <tr className="bg-gray-100 font-bold">
              <th className="border p-2">No. NCR</th>
              <th className="border p-2">Tanggal</th>
              <th className="border p-2">Customer</th>
              <th className="border p-2">Dimensi</th>
              <th className="border p-2">Batch</th>
              <th className="border p-2">Qty NG</th>
              <th className="border p-2">Cacat / NG Notes</th>
              <th className="border p-2">Operator</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((r) => (
              <tr key={r.id}>
                <td className="border p-2 font-mono font-bold text-rose-800">{r.ncrNumber || `NCR-${r.batchNumber}`}</td>
                <td className="border p-2 text-center">{r.reportDate.slice(0, 10)}</td>
                <td className="border p-2">{r.customer}</td>
                <td className="border p-2">{r.dimensions}</td>
                <td className="border p-2">{r.batchNumber}</td>
                <td className="border p-2 text-center font-bold text-rose-700">{r.qtyNg}</td>
                <td className="border p-2">{r.ngNotes || "-"}</td>
                <td className="border p-2">{r.operatorName}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredReports.some((r) => r.photoData) && (
          <div className="pt-6 page-break-before">
            <h2 className="mb-4 border-b pb-2 text-base font-bold uppercase">Dokumentasi Foto Cacat NCR</h2>
            <div className="grid grid-cols-2 gap-4">
              {filteredReports.filter((r) => r.photoData).map((r) => (
                <div key={r.id} className="rounded border p-3 text-center">
                  <img src={r.photoData!} alt={r.customer} className="mx-auto max-h-48 rounded object-contain mb-2" />
                  <p className="font-semibold text-xs">{r.ncrNumber || `NCR-${r.batchNumber}`} · {r.customer}</p>
                  <p className="text-[10px] text-gray-500">{r.reportDate.slice(0, 10)} · Qty NG: {r.qtyNg} pcs</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* MODAL PHOTO PREVIEW */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewPhoto(null)}
        >
          <div
            className="relative flex max-h-[92vh] w-full max-w-2xl flex-col rounded-xl bg-background p-5 shadow-2xl border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold text-rose-600">{previewPhoto.ncr} - {previewPhoto.customer}</h3>
                <p className="text-xs text-muted-foreground">Batch: {previewPhoto.batch}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPreviewPhoto(null)} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="my-4 flex flex-1 items-center justify-center overflow-auto rounded-lg bg-black/5 p-2 dark:bg-black/20">
              <img
                src={previewPhoto.url}
                alt={`Foto cacat ${previewPhoto.ncr}`}
                className="max-h-[65vh] w-auto max-w-full rounded-md object-contain shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
              <span>Dokumentasi Cacat Pipa NCR</span>
              <Button size="sm" variant="default" onClick={() => setPreviewPhoto(null)}>
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
