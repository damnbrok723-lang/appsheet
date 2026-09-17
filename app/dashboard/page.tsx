"use client";

import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BarChart3, Warehouse } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type MonitoringEntry = { id: string; date: string; shift: string; operatorCount: number; warehouse: string };
type MonitoringSummary = { totalOperators: number; qtyOk: number; qtyNg: number; okPercentage: number };

async function fetchMonitoring() {
  const response = await fetch("/api/monitoring");
  if (!response.ok) throw new Error("Gagal memuat data monitoring");
  const data = (await response.json()).data;
  return { entries: data.entries as MonitoringEntry[], summary: data.summary as MonitoringSummary };
}

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const monitoringQuery = useQuery({ queryKey: ["monitoring"], queryFn: fetchMonitoring, staleTime: 30_000, retry: 1 });
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), shift: "PAGI", operatorCount: "", warehouse: "" });
  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/monitoring", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, operatorCount: Number(form.operatorCount) }) });
      if (!response.ok) throw new Error("Gagal menyimpan monitoring");
    },
    onSuccess: () => { toast.success("Data monitoring tersimpan"); setForm({ ...form, operatorCount: "", warehouse: "" }); queryClient.invalidateQueries({ queryKey: ["monitoring"] }); },
    onError: (error) => toast.error(error.message),
  });

  const chartData = useMemo(() => monitoringQuery.data?.entries.slice(-14).map((entry) => ({ ...entry, label: new Date(entry.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) })) ?? [], [monitoringQuery.data]);
  const maxOperators = Math.max(...chartData.map((entry) => entry.operatorCount), 1);
  const summary = monitoringQuery.data?.summary;
  function submit(event: FormEvent) { event.preventDefault(); saveMutation.mutate(); }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Monitoring operasional berdasarkan input user.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[{ label: "Total operator", value: summary?.totalOperators ?? 0, tone: "text-cyan-600" }, { label: "Qty OK", value: summary?.qtyOk ?? 0, tone: "text-emerald-600" }, { label: "Qty NG", value: summary?.qtyNg ?? 0, tone: "text-red-600" }, { label: "Persentase OK", value: `${summary?.okPercentage ?? 0}%`, tone: "text-violet-600" }].map((item) => <Card key={item.label} className="p-5"><p className="text-sm text-muted-foreground">{item.label}</p><p className={`mt-2 text-3xl font-bold ${item.tone}`}>{item.value}</p></Card>)}
      </div>

      <Card>
        <CardHeader><h2 className="text-lg font-semibold">Input Monitoring</h2></CardHeader>
        <CardContent><form onSubmit={submit} className="grid gap-4 md:grid-cols-5 md:items-end">
          <label className="space-y-2 text-sm font-medium">Tanggal<Input type="date" required value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label>
          <label className="space-y-2 text-sm font-medium">Shift<select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.shift} onChange={(event) => setForm({ ...form, shift: event.target.value })}><option value="PAGI">Pagi</option><option value="SIANG">Siang</option><option value="MALAM">Malam</option></select></label>
          <label className="space-y-2 text-sm font-medium">Jumlah Operator<Input type="number" min="0" required value={form.operatorCount} onChange={(event) => setForm({ ...form, operatorCount: event.target.value })} /></label>
          <label className="space-y-2 text-sm font-medium">Gudang<Input required value={form.warehouse} onChange={(event) => setForm({ ...form, warehouse: event.target.value })} /></label>
          <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Menyimpan..." : "Simpan Monitoring"}</Button>
        </form></CardContent>
      </Card>

      <Card><CardHeader><h2 className="flex items-center gap-2 text-lg font-semibold"><BarChart3 className="h-5 w-5" />Grafik Jumlah Operator</h2></CardHeader><CardContent>
        {monitoringQuery.isLoading ? <p className="py-12 text-center text-muted-foreground">Memuat grafik...</p> : monitoringQuery.isError ? <p className="py-12 text-center text-destructive">Data monitoring gagal dimuat. Silakan refresh setelah login.</p> : chartData.length === 0 ? <p className="py-12 text-center text-muted-foreground">Belum ada data monitoring.</p> : <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="label" tick={{ fontSize: 11 }} /><YAxis allowDecimals={false} domain={[0, Math.max(maxOperators, 1)]} tick={{ fontSize: 11 }} /><Tooltip formatter={(value) => [`${value} operator`, "Jumlah"]} labelFormatter={(label) => String(label)} /><Bar dataKey="operatorCount" fill="#0891b2" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>}
      </CardContent></Card>

      <Card><CardHeader><h2 className="flex items-center gap-2 text-lg font-semibold"><Warehouse className="h-5 w-5" />Data Monitoring Terbaru</h2></CardHeader><CardContent><div className="divide-y">{(monitoringQuery.data?.entries ?? []).slice().reverse().slice(0, 8).map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span>{new Date(entry.date).toLocaleDateString("id-ID")}</span><span>{entry.shift}</span><span>{entry.warehouse}</span><strong>{entry.operatorCount} operator</strong></div>)}</div></CardContent></Card>
    </div>
  );
}
