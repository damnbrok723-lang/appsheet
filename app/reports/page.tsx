"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Camera, Download, FileBarChart, Printer } from "lucide-react";

type Report = { id: string; reportDate: string; customer: string; dimensions: string; pipeTypes: string[]; batchNumber: string; operatorName: string; shift: string; qtyOk: number; qtyNg: number; status: string; photoData?: string | null };
type ReportForm = { reportDate: string; customer: string; dimensions: string; pipeTypes: string[]; batchNumber: string; ncrNumber: string; operatorTypes: string[]; operatorName: string; shift: string; qtyOk: string; qtyNg: string; ngNotes: string; processNotes: string; photoData: string };
const initialForm: ReportForm = { reportDate: new Date().toISOString().slice(0, 10), customer: "", dimensions: "", pipeTypes: [], batchNumber: "", ncrNumber: "", operatorTypes: [], operatorName: "", shift: "PAGI", qtyOk: "", qtyNg: "", ngNotes: "", processNotes: "", photoData: "" };

async function fetchReports() {
  const response = await fetch("/api/production-reports");
  if (!response.ok) throw new Error("Gagal memuat laporan");
  return (await response.json()).data.reports as Report[];
}

export default function ReportsPage() {
  const queryClient = useQueryClient();
  const reportsQuery = useQuery({ queryKey: ["production-reports"], queryFn: fetchReports });
  const [form, setForm] = useState(initialForm);
  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/production-reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, qtyOk: Number(form.qtyOk), qtyNg: Number(form.qtyNg) }) });
      if (!response.ok) throw new Error("Gagal menyimpan laporan");
    },
    onSuccess: () => { toast.success("Laporan berhasil disimpan"); setForm({ ...initialForm, reportDate: form.reportDate }); queryClient.invalidateQueries({ queryKey: ["production-reports"] }); },
    onError: (error) => toast.error(error.message),
  });

  function toggleValue(field: "pipeTypes" | "operatorTypes", value: string) {
    setForm((current) => ({ ...current, [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value] }));
  }

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

  function clearPhoto() {
    setForm((current) => ({ ...current, photoData: "" }));
  }

  const qtyNg = Number(form.qtyNg) || 0;

  async function changeStatus(id: string, status: string) {
    const response = await fetch(`/api/production-reports/${id}/status`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "Gagal mengubah status");
    queryClient.invalidateQueries({ queryKey: ["production-reports"] });
    toast.success("Status laporan diperbarui");
  }

  function submit(event: FormEvent) { event.preventDefault(); saveMutation.mutate(); }
  function exportCsv() {
    const rows = reportsQuery.data ?? [];
    const header = ["Tanggal", "Customer", "Dimensi", "Jenis Pipa", "Batch", "Operator", "Shift", "Qty OK", "Qty NG"];
    const lines = [header, ...rows.map((report) => [report.reportDate, report.customer, report.dimensions, report.pipeTypes.join("; "), report.batchNumber, report.operatorName, report.shift, report.qtyOk, report.qtyNg])].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","));
    const url = URL.createObjectURL(new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-produksi-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  const field = (name: keyof ReportForm) => ({ value: form[name] as string, onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [name]: event.target.value }) });

  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold tracking-tight">Laporan Produksi</h1><p className="text-muted-foreground">Input laporan produksi harian dan dokumentasi proses.</p></div>
    <Card><CardHeader><h2 className="text-lg font-semibold">Input Laporan</h2></CardHeader><CardContent><form onSubmit={submit} className="grid gap-5 md:grid-cols-2">
      <label className="space-y-2 text-sm font-medium">Tanggal<Input type="date" required {...field("reportDate")} /></label>
      <label className="space-y-2 text-sm font-medium">Customer<Input required {...field("customer")} /></label>
      <label className="space-y-2 text-sm font-medium">Dimensi<Input required placeholder="Contoh: 100 x 50 x 3 mm" {...field("dimensions")} /></label>
      <fieldset className="space-y-2 text-sm"><legend className="font-medium">Jenis Pipa</legend><div className="flex gap-5 pt-2">{[["KOTAK", "Kotak"], ["BULAT", "Bulat"]].map(([value, label]) => <label key={value} className="flex items-center gap-2"><input type="checkbox" checked={form.pipeTypes.includes(value)} onChange={() => toggleValue("pipeTypes", value)} />{label}</label>)}</div></fieldset>
      <label className="space-y-2 text-sm font-medium">Batch<Input required {...field("batchNumber")} /></label>
      <label className="space-y-2 text-sm font-medium">No NCR<Input required={qtyNg > 0} {...field("ncrNumber")} />{qtyNg > 0 && <span className="text-xs text-destructive">Wajib diisi jika Qty NG lebih dari 0.</span>}</label>
      <fieldset className="space-y-2 text-sm"><legend className="font-medium">Operator</legend><div className="flex gap-5 pt-2">{[["BORONGAN", "Borongan"], ["INTERNAL", "Internal"]].map(([value, label]) => <label key={value} className="flex items-center gap-2"><input type="checkbox" checked={form.operatorTypes.includes(value)} onChange={() => toggleValue("operatorTypes", value)} />{label}</label>)}</div></fieldset>
      <label className="space-y-2 text-sm font-medium">Nama Operator<Input required {...field("operatorName")} /></label>
      <label className="space-y-2 text-sm font-medium">Shift<select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.shift} onChange={(event) => setForm({ ...form, shift: event.target.value })}><option value="PAGI">Pagi</option><option value="SIANG">Siang</option><option value="MALAM">Malam</option></select></label>
      <label className="space-y-2 text-sm font-medium">Qty OK<Input type="number" min="0" required {...field("qtyOk")} /></label>
      <label className="space-y-2 text-sm font-medium">Qty NG<Input type="number" min="0" required {...field("qtyNg")} /></label>
      <div className="rounded-md border bg-muted/40 p-3 text-sm font-medium">Total Qty: <span className="text-lg">{(Number(form.qtyOk) || 0) + qtyNg}</span></div>
      <label className="space-y-2 text-sm font-medium md:col-span-2">Keterangan NG<Textarea {...field("ngNotes")} /></label>
      <label className="space-y-2 text-sm font-medium md:col-span-2">Keterangan Proses<Textarea {...field("processNotes")} /></label>
      <div className="space-y-3 rounded-md border border-dashed p-4 text-sm font-medium md:col-span-2"><label className="flex cursor-pointer items-center gap-3"><Camera className="h-5 w-5" />Ambil foto atau pilih dari galeri<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={handlePhoto} />{form.photoData && <span className="text-xs text-muted-foreground">Foto siap disimpan</span>}</label>{form.photoData && <div className="flex items-start gap-3"><img src={form.photoData} alt="Pratinjau laporan" className="h-24 w-24 rounded-md object-cover" /><Button type="button" variant="outline" size="sm" onClick={clearPhoto}>Ambil ulang</Button></div>}</div>
      <Button type="submit" disabled={saveMutation.isPending} className="md:col-span-2">{saveMutation.isPending ? "Menyimpan..." : "Simpan Laporan"}</Button>
    </form></CardContent></Card>
    <Card><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-semibold"><FileBarChart className="h-5 w-5" />Laporan Tersimpan</h2><div className="flex gap-2"><Button type="button" variant="outline" size="sm" onClick={exportCsv} disabled={!reportsQuery.data?.length}><Download className="mr-2 h-4 w-4" />Export Excel</Button><Button type="button" variant="outline" size="sm" onClick={() => window.print()} disabled={!reportsQuery.data?.length}><Printer className="mr-2 h-4 w-4" />Export PDF</Button></div></div></CardHeader><CardContent><div className="divide-y">{(reportsQuery.data ?? []).map((report) => <div key={report.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><strong>{report.customer}</strong><p className="text-muted-foreground">{new Date(report.reportDate).toLocaleDateString("id-ID")} · {report.dimensions} · {report.batchNumber}</p></div><div className="flex items-center gap-2 text-right"><div><p>OK {report.qtyOk} · NG {report.qtyNg}</p><p className="text-muted-foreground">{report.operatorName} · {report.shift} · {report.status}</p></div>{report.status === "DRAFT" && <Button type="button" size="sm" onClick={() => changeStatus(report.id, "SUBMITTED")}>Kirim</Button>}{report.status === "SUBMITTED" && <><Button type="button" size="sm" onClick={() => changeStatus(report.id, "APPROVED")}>Approve</Button><Button type="button" size="sm" variant="outline" onClick={() => changeStatus(report.id, "REVISION")}>Revisi</Button></>}</div></div>)}</div>{reportsQuery.data?.length === 0 && <p className="py-8 text-center text-muted-foreground">Belum ada laporan.</p>}</CardContent></Card>
  </div>;
}
