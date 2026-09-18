"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, Download, Eye, FileBarChart, Filter, Pencil, Printer, Trash2, X } from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import * as XLSX from "xlsx";

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
  status: string;
  photoData?: string | null;
};

type ReportForm = {
  reportDate: string;
  customer: string;
  dimensions: string;
  pipeTypes: string[];
  batchNumber: string;
  ncrNumber: string;
  operatorTypes: string[];
  operatorName: string;
  shift: string;
  qtyOk: string;
  qtyNg: string;
  ngNotes: string;
  processNotes: string;
  photoData: string;
};

const shiftOptions = [
  ["SHIFT_1", "Shift 1"],
  ["SHIFT_2", "Shift 2"],
  ["SHIFT_3", "Shift 3"],
  ["LONGSHIFT_1", "Longshift 1"],
  ["LONGSHIFT_2", "Longshift 2"],
];

function formatShift(shift: string) {
  const map: Record<string, string> = {
    SHIFT_1: "Shift 1",
    SHIFT_2: "Shift 2",
    SHIFT_3: "Shift 3",
    LONGSHIFT_1: "Longshift 1",
    LONGSHIFT_2: "Longshift 2",
    PAGI: "Shift 1 (Pagi)",
    SIANG: "Shift 2 (Siang)",
    MALAM: "Shift 3 (Malam)",
  };
  return map[shift] || shift;
}

const initialForm: ReportForm = {
  reportDate: new Date().toISOString().slice(0, 10),
  customer: "",
  dimensions: "",
  pipeTypes: ["KOTAK"],
  batchNumber: "",
  ncrNumber: "",
  operatorTypes: ["BORONGAN"],
  operatorName: "",
  shift: "SHIFT_1",
  qtyOk: "",
  qtyNg: "",
  ngNotes: "",
  processNotes: "",
  photoData: "",
};

async function fetchReports() {
  const response = await fetch("/api/production-reports");
  if (!response.ok) throw new Error("Gagal memuat laporan");
  return (await response.json()).data.reports as Report[];
}

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const photoInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const reportsQuery = useQuery({ queryKey: ["production-reports"], queryFn: fetchReports, staleTime: 0, refetchInterval: 30_000 });
  const sessionQuery = useQuery({ queryKey: ["auth-session"], queryFn: async () => (await fetch("/api/auth/session")).json(), staleTime: 5 * 60 * 1000 });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; customer: string; date: string; batch: string; shift: string } | null>(null);

  const currentUser = sessionQuery.data?.user as { id?: string; role?: string } | undefined;
  const isReviewer = currentUser?.role === "ADMIN" || currentUser?.role === "MANAGER";

  // Close photo modal on Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setPreviewPhoto(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(editingId ? `/api/production-reports/${editingId}` : "/api/production-reports", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, qtyOk: Number(form.qtyOk), qtyNg: Number(form.qtyNg) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan laporan");
    },
    onSuccess: () => {
      toast.success(editingId ? "Laporan berhasil diperbarui" : "Laporan berhasil disimpan");
      setEditingId(null);
      setForm({ ...initialForm, reportDate: form.reportDate });
      queryClient.invalidateQueries({ queryKey: ["production-reports"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/production-reports", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal mengimpor file");
      return result.data.imported as number;
    },
    onSuccess: (count) => {
      toast.success(`${count} laporan berhasil diimpor`);
      queryClient.invalidateQueries({ queryKey: ["production-reports"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/production-reports/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menghapus laporan");
    },
    onSuccess: () => {
      toast.success("Laporan dihapus");
      queryClient.invalidateQueries({ queryKey: ["production-reports"] });
    },
    onError: (error) => toast.error(error.message),
  });

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 10 MB");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, photoData: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) importMutation.mutate(file);
    event.target.value = "";
  }

  function editReport(report: Report) {
    setEditingId(report.id);
    setForm({
      reportDate: report.reportDate.slice(0, 10),
      customer: report.customer,
      dimensions: report.dimensions,
      pipeTypes: Array.isArray(report.pipeTypes) && report.pipeTypes.length ? [report.pipeTypes[0]] : ["KOTAK"],
      batchNumber: report.batchNumber,
      ncrNumber: report.ncrNumber ?? "",
      operatorTypes: Array.isArray(report.operatorTypes) && report.operatorTypes.length ? [report.operatorTypes[0]] : ["BORONGAN"],
      operatorName: report.operatorName,
      shift: report.shift,
      qtyOk: String(report.qtyOk),
      qtyNg: String(report.qtyNg),
      ngNotes: report.ngNotes ?? "",
      processNotes: report.processNotes ?? "",
      photoData: report.photoData ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function clearPhoto() {
    setForm((current) => ({ ...current, photoData: "" }));
  }

  const qtyNg = Number(form.qtyNg) || 0;

  async function changeStatus(id: string, status: string) {
    const response = await fetch(`/api/production-reports/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Gagal mengubah status");
    queryClient.invalidateQueries({ queryKey: ["production-reports"] });
    toast.success("Status laporan diperbarui");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    saveMutation.mutate();
  }

  function setQuickFilter(preset: number | "today" | "month" | "all") {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    if (preset === "all") {
      setFilterFrom("");
      setFilterTo("");
      return;
    }
    if (preset === "today") {
      setFilterFrom(todayStr);
      setFilterTo(todayStr);
      return;
    }
    if (preset === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      setFilterFrom(firstDay);
      setFilterTo(todayStr);
      return;
    }
    const fromDate = new Date();
    fromDate.setDate(today.getDate() - preset);
    setFilterFrom(fromDate.toISOString().slice(0, 10));
    setFilterTo(todayStr);
  }

  const allReports = reportsQuery.data ?? [];
  const filteredReports = allReports.filter((report) => {
    const date = report.reportDate.slice(0, 10);
    if (filterFrom && date < filterFrom) return false;
    if (filterTo && date > filterTo) return false;
    return true;
  });

  function exportCsv() {
    const rows = filteredReports;
    const sheet = XLSX.utils.json_to_sheet(
      rows.map((report) => ({
        Tanggal: report.reportDate.slice(0, 10),
        Customer: report.customer,
        Dimensi: report.dimensions,
        "Jenis Pipa": report.pipeTypes.join("; "),
        Batch: report.batchNumber,
        "No NCR": report.ncrNumber ?? "",
        "Jenis Operator": report.operatorTypes.join("; "),
        Operator: report.operatorName,
        Shift: formatShift(report.shift),
        "Qty OK": report.qtyOk,
        "Qty NG": report.qtyNg,
        Status: report.status,
      }))
    );
    sheet["!cols"] = [{ wch: 14 }, { wch: 24 }, { wch: 20 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 22 }, { wch: 16 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
    sheet["!autofilter"] = { ref: `A1:L${rows.length + 1}` };
    sheet["!freeze"] = { xSplit: 0, ySplit: 1 };
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Laporan Produksi");
    const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const url = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-produksi-${filterFrom || "all"}-sd-${filterTo || "all"}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const field = (name: keyof ReportForm) => ({
    value: form[name] as string,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [name]: event.target.value }),
  });

  const chartData = Object.values(
    filteredReports.reduce<Record<string, { date: string; ok: number; ng: number }>>((groups, report) => {
      const date = new Date(report.reportDate).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" });
      const current = groups[date] ?? { date, ok: 0, ng: 0 };
      current.ok += report.qtyOk;
      current.ng += report.qtyNg;
      groups[date] = current;
      return groups;
    }, {})
  ).reverse();

  const totalOk = filteredReports.reduce((total, report) => total + report.qtyOk, 0);
  const totalNg = filteredReports.reduce((total, report) => total + report.qtyNg, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Laporan Produksi</h1>
        <p className="text-muted-foreground">Input laporan produksi harian dan dokumentasi proses.</p>
      </div>

      {/* FORM INPUT LAPORAN */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{editingId ? "Edit Laporan" : "Input Laporan"}</h2>
            {editingId && (
              <Button type="button" variant="outline" size="sm" onClick={() => { setEditingId(null); setForm(initialForm); }}>
                Batal Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium">
              Tanggal
              <Input type="date" required {...field("reportDate")} />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Customer
              <Input required {...field("customer")} />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Dimensi
              <Input required placeholder="Contoh: 100 x 50 x 3 mm" {...field("dimensions")} />
            </label>

            {/* JENIS PIPA (SINGLE CHOICE) */}
            <fieldset className="space-y-2 text-sm">
              <legend className="font-medium">Jenis Pipa (Pilih salah satu)</legend>
              <div className="flex gap-6 pt-2">
                {[["KOTAK", "Kotak"], ["BULAT", "Bulat"]].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="pipeTypes"
                      value={value}
                      checked={form.pipeTypes.includes(value)}
                      onChange={() => setForm((current) => ({ ...current, pipeTypes: [value] }))}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="space-y-2 text-sm font-medium">
              Batch
              <Input required {...field("batchNumber")} />
            </label>
            <label className="space-y-2 text-sm font-medium">
              No NCR
              <Input required={qtyNg > 0} {...field("ncrNumber")} />
              {qtyNg > 0 && <span className="text-xs text-destructive">Wajib diisi jika Qty NG lebih dari 0.</span>}
            </label>

            {/* OPERATOR (SINGLE CHOICE) */}
            <fieldset className="space-y-2 text-sm">
              <legend className="font-medium">Operator (Pilih salah satu)</legend>
              <div className="flex gap-6 pt-2">
                {[["BORONGAN", "Borongan"], ["INTERNAL", "Internal"]].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="operatorTypes"
                      value={value}
                      checked={form.operatorTypes.includes(value)}
                      onChange={() => setForm((current) => ({ ...current, operatorTypes: [value] }))}
                      className="h-4 w-4 text-primary focus:ring-primary"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="space-y-2 text-sm font-medium">
              Nama Operator
              <Input required {...field("operatorName")} />
            </label>

            {/* SHIFT (SHIFT 1, 2, 3, LONGSHIFT 1, LONGSHIFT 2) */}
            <label className="space-y-2 text-sm font-medium">
              Shift
              <select
                className="flex h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={form.shift}
                onChange={(event) => setForm({ ...form, shift: event.target.value })}
              >
                {shiftOptions.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium">
              Qty OK
              <Input type="number" min="0" required {...field("qtyOk")} />
            </label>
            <label className="space-y-2 text-sm font-medium">
              Qty NG
              <Input type="number" min="0" required {...field("qtyNg")} />
            </label>
            <div className="rounded-md border bg-muted/40 p-3 text-sm font-medium">
              Total Qty: <span className="text-lg">{(Number(form.qtyOk) || 0) + qtyNg}</span>
            </div>

            <label className="space-y-2 text-sm font-medium md:col-span-2">
              Keterangan NG
              <Textarea {...field("ngNotes")} />
            </label>
            <label className="space-y-2 text-sm font-medium md:col-span-2">
              Keterangan Proses
              <Textarea {...field("processNotes")} />
            </label>

            {/* INPUT FOTO DOKUMENTASI DENGAN PREVIEW */}
            <div className="space-y-3 rounded-md border border-dashed p-4 text-sm font-medium md:col-span-2">
              <input
                ref={photoInputRef}
                className="sr-only"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="environment"
                onChange={handlePhoto}
              />
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant="outline" onClick={() => photoInputRef.current?.click()}>
                  <Camera className="mr-2 h-5 w-5" />
                  {form.photoData ? "Ganti foto" : "Ambil foto atau pilih dari galeri"}
                </Button>
                {form.photoData && <span className="text-xs text-muted-foreground">Foto siap disimpan</span>}
              </div>
              {form.photoData && (
                <div className="flex flex-wrap items-center gap-4 rounded-md bg-muted/30 p-3">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewPhoto({
                        url: form.photoData,
                        customer: form.customer || "Pratinjau Baru",
                        date: form.reportDate,
                        batch: form.batchNumber || "-",
                        shift: formatShift(form.shift),
                      })
                    }
                    className="group relative h-28 w-28 overflow-hidden rounded-md border object-cover cursor-pointer hover:ring-2 hover:ring-primary focus:outline-none"
                    title="Klik untuk memperbesar foto"
                  >
                    <img src={form.photoData} alt="Pratinjau laporan" className="h-full w-full object-cover transition group-hover:scale-105" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition">
                      <Eye className="h-5 w-5 text-white" />
                    </div>
                  </button>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Klik gambar untuk melihat ukuran penuh</p>
                    <Button type="button" variant="outline" size="sm" onClick={clearPhoto}>
                      Hapus foto
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Button type="submit" disabled={saveMutation.isPending} className="md:col-span-2">
              {saveMutation.isPending ? "Menyimpan..." : editingId ? "Perbarui Laporan" : "Simpan Laporan"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* FILTER TANGGAL */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 font-semibold text-sm">
                <Filter className="h-4 w-4 text-primary" />
                <span>Filter Tanggal Laporan & Grafik:</span>
              </div>
              {(filterFrom || filterTo) ? (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {filteredReports.length} dari {allReports.length} data
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">
                  (Semua data ditampilkan: {allReports.length})
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Dari:</span>
                <Input
                  type="date"
                  className="h-8 w-36 text-xs"
                  value={filterFrom}
                  onChange={(e) => setFilterFrom(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">Sampai:</span>
                <Input
                  type="date"
                  className="h-8 w-36 text-xs"
                  value={filterTo}
                  onChange={(e) => setFilterTo(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <Button type="button" variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={() => setQuickFilter("today")}>
                  Hari Ini
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={() => setQuickFilter(7)}>
                  7 Hari
                </Button>
                <Button type="button" variant="outline" size="sm" className="h-8 px-2.5 text-xs" onClick={() => setQuickFilter("month")}>
                  Bulan Ini
                </Button>
                {(filterFrom || filterTo) && (
                  <Button type="button" variant="ghost" size="sm" className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10" onClick={() => setQuickFilter("all")}>
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* GRAFIK PRODUKSI */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <FileBarChart className="h-5 w-5" />
                Grafik Produksi
              </h2>
              <p className="text-sm text-muted-foreground">
                Ringkasan Qty OK dan Qty NG{filterFrom || filterTo ? ` (${filterFrom || "Awal"} s/d ${filterTo || "Hari ini"})` : " dari seluruh laporan tersimpan"}.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reportsQuery.isLoading ? (
            <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
              Memuat grafik...
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
              Belum ada data untuk rentang tanggal yang dipilih.
            </div>
          ) : (
            <>
              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-700 font-medium">Total Qty OK</p>
                  <p className="text-2xl font-bold text-emerald-900">{totalOk.toLocaleString("id-ID")}</p>
                </div>
                <div className="rounded-md border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm text-rose-700 font-medium">Total Qty NG</p>
                  <p className="text-2xl font-bold text-rose-900">{totalNg.toLocaleString("id-ID")}</p>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="ok" name="Qty OK" fill="#16a34a" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="ng" name="Qty NG" fill="#e11d48" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* LAPORAN TERSIMPAN */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <FileBarChart className="h-5 w-5" />
                Laporan Tersimpan
              </h2>
              {(filterFrom || filterTo) && (
                <p className="text-xs text-muted-foreground">
                  Menampilkan {filteredReports.length} data sesuai filter tanggal
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <a href="/laporan-produksi-template.xlsx" download className="inline-flex h-9 items-center rounded-md border px-3 text-sm font-medium hover:bg-accent">
                Download Template
              </a>
              <input ref={importInputRef} className="sr-only" type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} />
              <Button type="button" variant="outline" size="sm" onClick={() => importInputRef.current?.click()} disabled={importMutation.isPending}>
                {importMutation.isPending ? "Mengimpor..." : "Import Excel"}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={exportCsv} disabled={!filteredReports.length}>
                <Download className="mr-2 h-4 w-4" />
                Export Excel
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => window.print()} disabled={!filteredReports.length}>
                <Printer className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {filteredReports.map((report) => {
              const canSubmit = report.userId === currentUser?.id && (report.status === "DRAFT" || report.status === "REVISION");
              const canEdit = currentUser?.role === "ADMIN" || (report.userId === currentUser?.id && (report.status === "DRAFT" || report.status === "REVISION"));
              const canDelete = currentUser?.role === "ADMIN" || (report.userId === currentUser?.id && report.status === "DRAFT");

              return (
                <div key={report.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                  {/* DETAIL DAN FOTO THUMBNAIL LANGSUNG DI DAFTAR */}
                  <div className="flex items-center gap-3">
                    {report.photoData ? (
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewPhoto({
                            url: report.photoData!,
                            customer: report.customer,
                            date: new Date(report.reportDate).toLocaleDateString("id-ID"),
                            batch: report.batchNumber,
                            shift: formatShift(report.shift),
                          })
                        }
                        className="group relative h-12 w-12 flex-shrink-0 cursor-pointer overflow-hidden rounded-md border border-border bg-muted transition hover:ring-2 hover:ring-primary focus:outline-none"
                        title="Klik untuk cek foto langsung"
                      >
                        <img src={report.photoData} alt={report.customer} className="h-full w-full object-cover transition group-hover:scale-110" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div
                        className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md border border-dashed bg-muted/30 text-muted-foreground/40"
                        title="Tidak ada lampiran foto"
                      >
                        <Camera className="h-5 w-5" />
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/reports/${report.id}`} className="font-semibold text-foreground hover:underline">
                          {report.customer}
                        </Link>
                        {report.photoData && (
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewPhoto({
                                url: report.photoData!,
                                customer: report.customer,
                                date: new Date(report.reportDate).toLocaleDateString("id-ID"),
                                batch: report.batchNumber,
                                shift: formatShift(report.shift),
                              })
                            }
                            className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20"
                          >
                            <Camera className="h-3 w-3" /> Cek Foto
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(report.reportDate).toLocaleDateString("id-ID")} · {report.dimensions} · {report.batchNumber}
                      </p>
                    </div>
                  </div>

                  {/* AKSI DAN STATUS */}
                  <div className="flex items-center gap-2 text-right">
                    <div>
                      <p className="font-medium">OK {report.qtyOk} · NG {report.qtyNg}</p>
                      <p className="text-xs text-muted-foreground">
                        {report.operatorName} · {formatShift(report.shift)} · Status: <span className="font-semibold">{report.status}</span>
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/reports/${report.id}`}>
                        <Eye className="mr-1 h-4 w-4" />
                        Detail
                      </Link>
                    </Button>
                    {canEdit && (
                      <Button type="button" variant="outline" size="sm" onClick={() => editReport(report)}>
                        <Pencil className="mr-1 h-4 w-4" />
                        Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button type="button" variant="destructive" size="sm" onClick={() => deleteMutation.mutate(report.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="mr-1 h-4 w-4" />
                        Hapus
                      </Button>
                    )}
                    {canSubmit && (
                      <Button type="button" size="sm" onClick={() => changeStatus(report.id, "SUBMITTED")}>
                        Kirim
                      </Button>
                    )}
                    {isReviewer && report.status === "SUBMITTED" && (
                      <>
                        <Button type="button" size="sm" onClick={() => changeStatus(report.id, "APPROVED")}>
                          Approve
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => changeStatus(report.id, "REVISION")}>
                          Revisi
                        </Button>
                        <Button type="button" size="sm" variant="destructive" onClick={() => changeStatus(report.id, "REJECTED")}>
                          Tolak
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {filteredReports.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              {allReports.length === 0 ? "Belum ada laporan tersimpan." : "Tidak ada laporan pada rentang tanggal ini."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* MODAL POPUP PREVIEW FOTO LANGSUNG DI HALAMAN INI */}
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
                <h3 className="text-lg font-bold text-foreground">{previewPhoto.customer}</h3>
                <p className="text-xs text-muted-foreground">
                  Tanggal: {previewPhoto.date} · Batch: {previewPhoto.batch} · {previewPhoto.shift}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setPreviewPhoto(null)} className="h-8 w-8 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="my-4 flex flex-1 items-center justify-center overflow-auto rounded-lg bg-black/5 p-2 dark:bg-black/20">
              <img
                src={previewPhoto.url}
                alt={`Foto laporan ${previewPhoto.customer}`}
                className="max-h-[65vh] w-auto max-w-full rounded-md object-contain shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
              <span>Dokumentasi Foto Lapangan</span>
              <div className="flex gap-2">
                <a
                  href={previewPhoto.url}
                  download={`foto-laporan-${previewPhoto.customer}-${previewPhoto.batch}.jpg`}
                  className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent text-foreground"
                >
                  <Download className="h-3.5 w-3.5" />
                  Unduh Foto
                </a>
                <Button size="sm" variant="default" onClick={() => setPreviewPhoto(null)}>
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

