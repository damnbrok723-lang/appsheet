"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, ChevronLeft, ChevronRight, Download, Eye, FileBarChart, Filter, Pencil, Printer, Trash2, X } from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ExcelJS from "exceljs";
import { useCardPermission } from "@/lib/card-permissions";

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
  const reportsQuery = useQuery({
    queryKey: ["production-reports"],
    queryFn: fetchReports,
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const sessionQuery = useQuery({ queryKey: ["auth-session"], queryFn: async () => (await fetch("/api/auth/session")).json(), staleTime: 5 * 60 * 1000 });
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  // filterFrom/filterTo = filter AKTIF yang benar-benar diterapkan ke data
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  // pendingFrom/pendingTo = nilai input sementara (belum diterapkan)
  const [pendingFrom, setPendingFrom] = useState("");
  const [pendingTo, setPendingTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [previewPhoto, setPreviewPhoto] = useState<{ url: string; customer: string; date: string; batch: string; shift: string } | null>(null);

  const currentUser = sessionQuery.data?.user as { id?: string; role?: string; permissions?: string[] } | undefined;
  const userRole = currentUser?.role || "EMPLOYEE";
  const userPermissions = currentUser?.permissions;
  const isReviewer = userRole === "ADMIN" || userRole === "MANAGER";

  const showQtyOkCard = useCardPermission("reports_qty_ok", userRole, userPermissions);
  const showQtyNgCard = useCardPermission("reports_qty_ng", userRole, userPermissions);
  const showInputFormCard = useCardPermission("reports_input_form", userRole, userPermissions);
  const showExportCard = useCardPermission("reports_export", userRole, userPermissions);
  const showReviewerActions = useCardPermission("reports_reviewer_actions", userRole, userPermissions);

  // Terapkan filter dari pending ke aktif
  function applyFilter() {
    setFilterFrom(pendingFrom);
    setFilterTo(pendingTo);
    setCurrentPage(1);
  }

  // Cek apakah ada perubahan pending yang belum diterapkan
  const hasPendingChange = pendingFrom !== filterFrom || pendingTo !== filterTo;

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
    onSuccess: async () => {
      toast.success(editingId ? "Laporan berhasil diperbarui" : "Laporan berhasil disimpan");
      setEditingId(null);
      setForm({ ...initialForm, reportDate: form.reportDate });
      await queryClient.invalidateQueries({ queryKey: ["production-reports"] });
      await queryClient.refetchQueries({ queryKey: ["production-reports"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      toast.loading("Mengimpor file Excel... Harap tunggu.", { id: "import-progress" });
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/production-reports", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal mengimpor file");
      return result.data.imported as number;
    },
    onSuccess: async (count) => {
      toast.loading("Memuat ulang data...", { id: "import-progress" });
      await queryClient.invalidateQueries({ queryKey: ["production-reports"] });
      await queryClient.refetchQueries({ queryKey: ["production-reports"] });
      setCurrentPage(1);
      toast.success(`✅ ${count} laporan berhasil diimpor & dimuat!`, { id: "import-progress", duration: 4000 });
    },
    onError: (error) => {
      toast.error(`❌ ${error.message}`, { id: "import-progress" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/production-reports/${id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menghapus laporan");
    },
    onSuccess: async () => {
      toast.success("Laporan dihapus");
      await queryClient.invalidateQueries({ queryKey: ["production-reports"] });
      await queryClient.refetchQueries({ queryKey: ["production-reports"] });
    },
    onError: (error) => toast.error(error.message),
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/production-reports", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menghapus semua laporan");
      return result.data.deleted as number;
    },
    onSuccess: async (count) => {
      toast.success(`${count} laporan berhasil dihapus`);
      await queryClient.invalidateQueries({ queryKey: ["production-reports"] });
      await queryClient.refetchQueries({ queryKey: ["production-reports"] });
      setCurrentPage(1);
    },
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
    await queryClient.invalidateQueries({ queryKey: ["production-reports"] });
    await queryClient.refetchQueries({ queryKey: ["production-reports"] });
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
      setPendingFrom("");
      setPendingTo("");
      return;
    }
    if (preset === "today") {
      setFilterFrom(todayStr);
      setFilterTo(todayStr);
      setPendingFrom(todayStr);
      setPendingTo(todayStr);
      return;
    }
    if (preset === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
      setFilterFrom(firstDay);
      setFilterTo(todayStr);
      setPendingFrom(firstDay);
      setPendingTo(todayStr);
      return;
    }
    const fromDate = new Date();
    fromDate.setDate(today.getDate() - preset);
    const fromStr = fromDate.toISOString().slice(0, 10);
    setFilterFrom(fromStr);
    setFilterTo(todayStr);
    setPendingFrom(fromStr);
    setPendingTo(todayStr);
  }

  const allReports = reportsQuery.data ?? [];
  const filteredReports = useMemo(() => {
    return allReports.filter((report) => {
      const date = report.reportDate.slice(0, 10);
      if (filterFrom && date < filterFrom) return false;
      if (filterTo && date > filterTo) return false;
      return true;
    });
  }, [allReports, filterFrom, filterTo]);

  async function exportCsv() {
    toast.loading("Mengeksport Excel dengan foto...", { id: "export-excel" });
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Laporan Produksi");

      worksheet.columns = [
        { header: "Tanggal Produksi", key: "tanggal", width: 16 },
        { header: "Customer", key: "customer", width: 26 },
        { header: "Dimensi", key: "dimensi", width: 22 },
        { header: "Jenis Pipa", key: "pipa", width: 14 },
        { header: "Batch Pipa", key: "batch", width: 18 },
        { header: "No. NCR", key: "ncr", width: 18 },
        { header: "Jenis Operator", key: "jenisOperator", width: 18 },
        { header: "Nama Penanggung Jawab Repair", key: "operator", width: 24 },
        { header: "Shift", key: "shift", width: 16 },
        { header: "Qty Standard (OK)", key: "ok", width: 16 },
        { header: "Qty NG/REPAIR", key: "ng", width: 16 },
        { header: "Keterangan Rep/NG", key: "ngNotes", width: 24 },
        { header: "Kategori Repair", key: "processNotes", width: 24 },
        { header: "Foto Dokumentasi", key: "foto", width: 22 },
      ];

      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E293B" } };
      headerRow.alignment = { vertical: "middle", horizontal: "center" };
      headerRow.height = 24;

      for (let i = 0; i < filteredReports.length; i++) {
        const report = filteredReports[i];
        let photoDataUrl = report.photoData;

        if (!photoDataUrl && (report as Report & { hasPhoto?: boolean }).hasPhoto) {
          try {
            const res = await fetch(`/api/production-reports/${report.id}`);
            const data = await res.json();
            if (data.data?.photoData) {
              photoDataUrl = data.data.photoData;
            }
          } catch {
            // fallback if fetch fails
          }
        }

        const row = worksheet.addRow({
          tanggal: report.reportDate.slice(0, 10),
          customer: report.customer,
          dimensi: report.dimensions,
          pipa: Array.isArray(report.pipeTypes) ? report.pipeTypes.join("; ") : report.pipeTypes,
          batch: report.batchNumber,
          ncr: report.ncrNumber ?? "",
          jenisOperator: Array.isArray(report.operatorTypes) ? report.operatorTypes.join("; ") : report.operatorTypes,
          operator: report.operatorName,
          shift: formatShift(report.shift),
          ok: report.qtyOk,
          ng: report.qtyNg,
          ngNotes: report.ngNotes ?? "",
          processNotes: report.processNotes ?? "",
          foto: photoDataUrl ? "" : "Tidak Ada Foto",
        });

        row.alignment = { vertical: "middle" };

        if (photoDataUrl && photoDataUrl.startsWith("data:image/")) {
          row.height = 65;
          const mimeType = photoDataUrl.substring(photoDataUrl.indexOf(":") + 1, photoDataUrl.indexOf(";"));
          const extension = mimeType.includes("png") ? "png" : "jpeg";
          const base64 = photoDataUrl.split(",")[1];

          const imageId = workbook.addImage({
            base64: base64,
            extension: extension as "png" | "jpeg",
          });

          worksheet.addImage(imageId, {
            tl: { col: 13, row: i + 1 },
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
      link.download = `laporan-produksi-${filterFrom || "all"}-sd-${filterTo || "all"}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("File Excel berhasil di-export!", { id: "export-excel" });
    } catch (error) {
      console.error("Export Excel error:", error);
      toast.error("Gagal mengeksport Excel", { id: "export-excel" });
    }
  }

  const field = (name: keyof ReportForm) => ({
    value: form[name] as string,
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [name]: event.target.value }),
  });

  const chartData = useMemo(() => {
    return Object.values(
      filteredReports.reduce<Record<string, { rawDate: string; date: string; ok: number; ng: number }>>((groups, report) => {
        const rawDate = report.reportDate.slice(0, 10);
        const date = new Date(report.reportDate).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" });
        const current = groups[rawDate] ?? { rawDate, date, ok: 0, ng: 0 };
        current.ok += report.qtyOk;
        current.ng += report.qtyNg;
        groups[rawDate] = current;
        return groups;
      }, {})
    ).sort((a, b) => a.rawDate.localeCompare(b.rawDate));
  }, [filteredReports]);

  const { totalOk, totalNg } = useMemo(() => {
    let ok = 0;
    let ng = 0;
    for (const r of filteredReports) {
      ok += r.qtyOk;
      ng += r.qtyNg;
    }
    return { totalOk: ok, totalNg: ng };
  }, [filteredReports]);

  const totalPages = Math.ceil(filteredReports.length / pageSize) || 1;
  const paginatedReports = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredReports.slice(start, start + pageSize);
  }, [filteredReports, currentPage, pageSize]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* IMPORT LOADING OVERLAY */}
      {importMutation.isPending && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-2xl border bg-background p-8 shadow-2xl">
            {/* Spinner */}
            <svg
              className="h-12 w-12 animate-spin text-primary"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <div className="text-center">
              <p className="text-base font-semibold text-foreground">Mengimpor data Excel...</p>
              <p className="mt-1 text-sm text-muted-foreground">Harap tunggu, jangan tutup halaman ini.</p>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN ONLY CONTENT */}
      <div className="print:hidden space-y-4 md:space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Laporan Produksi</h1>
          <p className="text-sm text-muted-foreground">Input laporan produksi harian dan dokumentasi proses.</p>
        </div>

      {/* FORM INPUT LAPORAN */}
      {showInputFormCard && (
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
      )}

      {/* FILTER TANGGAL */}
      <Card className={hasPendingChange ? "ring-2 ring-primary/40" : ""}>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col gap-3">
            {/* Header row: label + status badge */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 font-semibold text-sm">
                <Filter className="h-4 w-4 text-primary" />
                <span>Filter Tanggal:</span>
              </div>
              {(filterFrom || filterTo) ? (
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  {filteredReports.length} dari {allReports.length} data
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Semua: {allReports.length} data</span>
              )}
              {hasPendingChange && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 animate-pulse">
                  Belum diterapkan
                </span>
              )}
            </div>

            {/* Date range inputs */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 text-xs text-muted-foreground">Dari:</span>
                <Input
                  type="date"
                  className="h-8 min-w-0 max-w-[9rem] flex-1 text-xs"
                  value={pendingFrom}
                  onChange={(e) => setPendingFrom(e.target.value)}
                />
              </div>
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="shrink-0 text-xs text-muted-foreground">s/d:</span>
                <Input
                  type="date"
                  className="h-8 min-w-0 max-w-[9rem] flex-1 text-xs"
                  value={pendingTo}
                  onChange={(e) => setPendingTo(e.target.value)}
                />
              </div>
              {/* Terapkan button — prominent when there's a pending change */}
              <Button
                type="button"
                size="sm"
                className={"h-8 px-3 text-xs font-semibold transition-all " + (hasPendingChange ? "bg-primary text-white shadow-md scale-[1.03]" : "bg-primary/80 text-white")}
                onClick={applyFilter}
              >
                Terapkan
              </Button>
            </div>

            {/* Quick preset buttons */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] text-muted-foreground mr-1">Cepat:</span>
              <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setQuickFilter("today")}>
                Hari Ini
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setQuickFilter(7)}>
                7 Hari
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setQuickFilter("month")}>
                Bulan Ini
              </Button>
              {(filterFrom || filterTo) && (
                <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10" onClick={() => setQuickFilter("all")}>
                  Reset
                </Button>
              )}
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
              <div className="mb-5 grid gap-4 sm:grid-cols-2">
                {showQtyOkCard && (
                  <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-xs dark:border-emerald-900/50 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Total Qty OK</p>
                      <div className="rounded-full bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                        <FileBarChart className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </div>
                    <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-slate-50">{totalOk.toLocaleString("id-ID")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Total batang pipa lolos standard</p>
                  </div>
                )}
                {showQtyNgCard && (
                  <div className="rounded-xl border border-rose-200 bg-white p-4 shadow-xs dark:border-rose-900/50 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Total Qty NG</p>
                      <div className="rounded-full bg-rose-100 p-2 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                        <FileBarChart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                      </div>
                    </div>
                    <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-slate-50">{totalNg.toLocaleString("id-ID")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Total batang pipa defect / repair</p>
                  </div>
                )}
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
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold md:text-lg">
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
              <a href="/template-output-repair.xlsx" download className="inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-medium hover:bg-accent hover:text-accent-foreground">
                <FileBarChart className="mr-1.5 h-3.5 w-3.5 text-emerald-600" />
                Template SAP
              </a>
              <input ref={importInputRef} className="sr-only" type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} />
              <Button type="button" variant="default" size="sm" className="h-8 text-xs" onClick={() => importInputRef.current?.click()} disabled={importMutation.isPending}>
                {importMutation.isPending ? "Mengimpor..." : "Import Excel"}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={exportCsv} disabled={!filteredReports.length}>
                <Download className="mr-1 h-3.5 w-3.5" />
                Export
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.print()} disabled={!filteredReports.length}>
                <Printer className="mr-1 h-3.5 w-3.5" />
                PDF
              </Button>
              {currentUser?.role === "ADMIN" && allReports.length > 0 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={deleteAllMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Yakin hapus SEMUA ${allReports.length} laporan? Tindakan ini tidak bisa dibatalkan.`)) {
                      deleteAllMutation.mutate();
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleteAllMutation.isPending ? "Menghapus..." : "Hapus Semua"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            {paginatedReports.map((report) => {
              const canSubmit = report.userId === currentUser?.id && (report.status === "DRAFT" || report.status === "REVISION");
              const canEdit = currentUser?.role === "ADMIN" || (report.userId === currentUser?.id && (report.status === "DRAFT" || report.status === "REVISION"));
              const canDelete = currentUser?.role === "ADMIN" || (report.userId === currentUser?.id && report.status === "DRAFT");

              return (
                <div key={report.id} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  {/* DETAIL DAN FOTO THUMBNAIL */}
                  <div className="flex items-start gap-3">
                    {(report.photoData || (report as Report & { hasPhoto?: boolean }).hasPhoto) ? (
                      <button
                        type="button"
                        onClick={async () => {
                          if (report.photoData) {
                            setPreviewPhoto({
                              url: report.photoData,
                              customer: report.customer,
                              date: new Date(report.reportDate).toLocaleDateString("id-ID"),
                              batch: report.batchNumber,
                              shift: formatShift(report.shift),
                            });
                          } else {
                            toast.loading("Memuat foto...", { id: "load-photo" });
                            try {
                              const res = await fetch(`/api/production-reports/${report.id}`);
                              const data = await res.json();
                              toast.dismiss("load-photo");
                              if (data.data?.photoData) {
                                setPreviewPhoto({
                                  url: data.data.photoData,
                                  customer: report.customer,
                                  date: new Date(report.reportDate).toLocaleDateString("id-ID"),
                                  batch: report.batchNumber,
                                  shift: formatShift(report.shift),
                                });
                              } else {
                                toast.error("Foto tidak ditemukan");
                              }
                            } catch {
                              toast.dismiss("load-photo");
                              toast.error("Gagal memuat foto");
                            }
                          }
                        }}
                        className="group relative h-12 w-12 shrink-0 cursor-pointer overflow-hidden rounded-md border border-border bg-muted transition hover:ring-2 hover:ring-primary focus:outline-none"
                        title="Klik untuk cek foto langsung"
                      >
                        {report.photoData ? (
                          <img src={report.photoData} alt={report.customer} className="h-full w-full object-cover transition group-hover:scale-110" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary">
                            <Camera className="h-5 w-5" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                          <Eye className="h-4 w-4 text-white" />
                        </div>
                      </button>
                    ) : (
                      <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-dashed bg-muted/30 text-muted-foreground/40"
                        title="Tidak ada lampiran foto"
                      >
                        <Camera className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/reports/${report.id}`} className="font-semibold text-foreground hover:underline truncate max-w-[180px] sm:max-w-none">
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
                            <Camera className="h-3 w-3" /> Foto
                          </button>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {new Date(report.reportDate).toLocaleDateString("id-ID")} · {report.dimensions} · {report.batchNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        OK <span className="font-semibold text-emerald-600">{report.qtyOk}</span> · NG <span className="font-semibold text-rose-600">{report.qtyNg}</span> · {report.operatorName} · {formatShift(report.shift)} ·{" "}
                        <span className={"font-semibold " + (report.status === "APPROVED" ? "text-emerald-600" : report.status === "REJECTED" ? "text-rose-600" : "text-foreground")}>
                          {report.status}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* AKSI — wraps on mobile, inline on sm+ */}
                  <div className="flex flex-wrap items-center gap-1.5 sm:shrink-0 sm:flex-nowrap">
                    <Button asChild variant="outline" size="sm" className="h-7 px-2 text-xs">
                      <Link href={`/reports/${report.id}`}>
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        Detail
                      </Link>
                    </Button>
                    {canEdit && (
                      <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => editReport(report)}>
                        <Pencil className="mr-1 h-3.5 w-3.5" />
                        Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button type="button" variant="destructive" size="sm" className="h-7 px-2 text-xs" onClick={() => deleteMutation.mutate(report.id)} disabled={deleteMutation.isPending}>
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        Hapus
                      </Button>
                    )}
                    {canSubmit && (
                      <Button type="button" size="sm" className="h-7 px-2 text-xs" onClick={() => changeStatus(report.id, "SUBMITTED")}>
                        Kirim
                      </Button>
                    )}
                    {isReviewer && report.status === "SUBMITTED" && (
                      <>
                        <Button type="button" size="sm" className="h-7 px-2 text-xs" onClick={() => changeStatus(report.id, "APPROVED")}>
                          Approve
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => changeStatus(report.id, "REVISION")}>
                          Revisi
                        </Button>
                        <Button type="button" size="sm" variant="destructive" className="h-7 px-2 text-xs" onClick={() => changeStatus(report.id, "REJECTED")}>
                          Tolak
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {filteredReports.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              {allReports.length === 0 ? "Belum ada laporan tersimpan." : "Tidak ada laporan pada rentang tanggal ini."}
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
                  <option value={100}>100 per halaman</option>
                </select>
                <span>
                  · Menampilkan {Math.min((currentPage - 1) * pageSize + 1, filteredReports.length)} -{" "}
                  {Math.min(currentPage * pageSize, filteredReports.length)} dari {filteredReports.length} laporan
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

      {/* DOKUMEN CETAK / EXPORT PDF KHUSUS PRINT */}
      <div className="print-only print:space-y-6 bg-white text-black p-4">
        <div className="border-b pb-4 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-wide">Laporan Hasil Produksi & Daily Repair</h1>
          <p className="text-xs text-gray-600 mt-1">
            Periode: {filterFrom || "Semua Data"} s/d {filterTo || "Hari Ini"} · Tanggal Cetak: {new Date().toLocaleDateString("id-ID")}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm font-semibold">
          <div className="rounded border border-emerald-300 bg-emerald-50 p-3">Total Qty OK: {totalOk.toLocaleString("id-ID")} pcs</div>
          <div className="rounded border border-rose-300 bg-rose-50 p-3">Total Qty NG: {totalNg.toLocaleString("id-ID")} pcs</div>
        </div>

        <table className="w-full border-collapse border border-gray-300 text-xs">
          <thead>
            <tr className="bg-gray-100 font-bold">
              <th className="border p-2">Tanggal</th>
              <th className="border p-2">Customer</th>
              <th className="border p-2">Dimensi</th>
              <th className="border p-2">Batch</th>
              <th className="border p-2">No. NCR</th>
              <th className="border p-2">Operator</th>
              <th className="border p-2">Shift</th>
              <th className="border p-2">Qty OK</th>
              <th className="border p-2">Qty NG</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.map((r) => (
              <tr key={r.id}>
                <td className="border p-2 text-center">{r.reportDate.slice(0, 10)}</td>
                <td className="border p-2">{r.customer}</td>
                <td className="border p-2">{r.dimensions}</td>
                <td className="border p-2">{r.batchNumber}</td>
                <td className="border p-2">{r.ncrNumber || "-"}</td>
                <td className="border p-2">{r.operatorName}</td>
                <td className="border p-2 text-center">{formatShift(r.shift)}</td>
                <td className="border p-2 text-center font-bold text-emerald-700">{r.qtyOk}</td>
                <td className="border p-2 text-center font-bold text-rose-700">{r.qtyNg}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* SECTION FOTO DOKUMENTASI UNTUK PDF */}
        {filteredReports.some((r) => r.photoData) && (
          <div className="pt-6 page-break-before">
            <h2 className="mb-4 border-b pb-2 text-base font-bold uppercase">Dokumentasi Foto Lapangan</h2>
            <div className="grid grid-cols-2 gap-4">
              {filteredReports.filter((r) => r.photoData).map((r) => (
                <div key={r.id} className="rounded border p-3 text-center">
                  <img src={r.photoData!} alt={r.customer} className="mx-auto max-h-48 rounded object-contain mb-2" />
                  <p className="font-semibold text-xs">{r.customer} ({r.batchNumber})</p>
                  <p className="text-[10px] text-gray-500">{r.reportDate.slice(0, 10)} · {formatShift(r.shift)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

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

