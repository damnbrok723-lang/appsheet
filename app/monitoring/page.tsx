"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type MonitoringEntry = { id: string; date: string; shift: string; operatorCount: number; warehouse: string };
type MonitoringData = { entries: MonitoringEntry[]; summary: { totalOperators: number; qtyOk: number; qtyNg: number; okPercentage: number } };

async function fetchMonitoring() {
  const response = await fetch("/api/monitoring");
  if (!response.ok) throw new Error("Gagal memuat monitoring");
  return (await response.json()).data as MonitoringData;
}

export default function MonitoringPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["monitoring"], queryFn: fetchMonitoring });
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState("PAGI");
  const [operatorCount, setOperatorCount] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const saveMutation = useMutation({
    mutationFn: async () => { const response = await fetch("/api/monitoring", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, shift, operatorCount: Number(operatorCount), warehouse }) }); const result = await response.json(); if (!response.ok) throw new Error(result.message || "Gagal menyimpan monitoring"); },
    onSuccess: () => { toast.success("Data monitoring tersimpan"); setOperatorCount(""); setWarehouse(""); queryClient.invalidateQueries({ queryKey: ["monitoring"] }); },
    onError: (error) => toast.error(error.message),
  });
  function submit(event: FormEvent) { event.preventDefault(); saveMutation.mutate(); }
  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const rows = (await file.text()).split(/\r?\n/).filter(Boolean).slice(1).map((line) => line.split(",").map((value) => value.trim().replace(/^"|"$/g, "")));
    let success = 0;
    for (const [rowDate, rowShift, rowOperators, rowWarehouse] of rows) {
      if (!rowDate || !rowShift || !rowOperators || !rowWarehouse) continue;
      const response = await fetch("/api/monitoring", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: rowDate, shift: rowShift.toUpperCase(), operatorCount: Number(rowOperators), warehouse: rowWarehouse }) });
      if (response.ok) success += 1;
    }
    toast.success(`${success} baris monitoring berhasil diimpor`);
    queryClient.invalidateQueries({ queryKey: ["monitoring"] });
    if (importRef.current) importRef.current.value = "";
  }
  const summary = query.data?.summary;
  const chartData = (query.data?.entries ?? []).map((entry) => ({ date: new Date(entry.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" }), operatorCount: entry.operatorCount, shift: entry.shift, warehouse: entry.warehouse }));
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold tracking-tight">Monitoring Operasional</h1><p className="text-muted-foreground">Input dan pantau operator, shift, gudang, dan hasil produksi.</p></div><div className="grid gap-4 md:grid-cols-4">{[["Operator", summary?.totalOperators ?? 0], ["Qty OK", summary?.qtyOk ?? 0], ["Qty NG", summary?.qtyNg ?? 0], ["Persentase OK", `${summary?.okPercentage ?? 0}%`]].map(([label, value]) => <Card key={String(label)} className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></Card>)}</div><Card className="p-5"><h2 className="mb-4 text-lg font-semibold">Grafik Jumlah Operator</h2><div className="h-72 w-full">{chartData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="operatorCount" name="Operator" fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data monitoring.</p>}</div></Card><Card className="p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-semibold">Input Monitoring</h2><label className="cursor-pointer rounded-md border px-3 py-2 text-sm">Import CSV<input ref={importRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={importCsv} /></label></div><p className="mb-4 text-xs text-muted-foreground">Format: Tanggal, Shift, Jumlah Operator, Gudang</p><form onSubmit={submit} className="grid gap-4 md:grid-cols-4"><label className="space-y-2 text-sm">Tanggal<Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label className="space-y-2 text-sm">Shift<select value={shift} onChange={(event) => setShift(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3"><option value="PAGI">Pagi</option><option value="SIANG">Siang</option><option value="MALAM">Malam</option></select></label><label className="space-y-2 text-sm">Jumlah Operator<Input type="number" min="0" value={operatorCount} onChange={(event) => setOperatorCount(event.target.value)} required /></label><label className="space-y-2 text-sm">Gudang<Input value={warehouse} onChange={(event) => setWarehouse(event.target.value)} required /></label><Button type="submit" disabled={saveMutation.isPending} className="md:col-span-4">{saveMutation.isPending ? "Menyimpan..." : "Simpan monitoring"}</Button></form></Card><Card className="p-5"><h2 className="mb-4 text-lg font-semibold">Riwayat Monitoring</h2><div className="divide-y">{(query.data?.entries ?? []).map((entry) => <div key={entry.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{new Date(entry.date).toLocaleDateString("id-ID")}</span><span>{entry.shift}</span><span>{entry.operatorCount} operator</span><span>{entry.warehouse}</span></div>)}</div></Card></div>;
}