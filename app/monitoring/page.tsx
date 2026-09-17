"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type MonitoringEntry = { id: string; date: string; shift: string; operatorCount: number; warehouse: string; teamLeader: string | null };
type MonitoringData = { entries: MonitoringEntry[]; summary: { totalOperators: number; qtyOk: number; qtyNg: number; okPercentage: number } };
const shiftOptions = [["SHIFT_1", "Shift 1"], ["SHIFT_2", "Shift 2"], ["SHIFT_3", "Shift 3"], ["LONGSHIFT_1", "Longshift 1"], ["LONGSHIFT_2", "Longshift 2"]];
const warehouses = ["1", "5", "13"];

async function fetchMonitoring() {
  const response = await fetch("/api/monitoring");
  if (!response.ok) throw new Error("Gagal memuat monitoring");
  return (await response.json()).data as MonitoringData;
}

export default function MonitoringPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["monitoring"], queryFn: fetchMonitoring });
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shift, setShift] = useState("SHIFT_1");
  const [operatorCount, setOperatorCount] = useState("");
  const [warehouse, setWarehouse] = useState("1");
  const [teamLeader, setTeamLeader] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const saveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/monitoring", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, shift, operatorCount: Number(operatorCount), warehouse, teamLeader }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal menyimpan monitoring");
    },
    onSuccess: () => { toast.success("Data monitoring tersimpan"); setOperatorCount(""); setTeamLeader(""); queryClient.invalidateQueries({ queryKey: ["monitoring"] }); },
    onError: (error) => toast.error(error.message),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const missing = [!date && "Tanggal", !shift && "Shift", !operatorCount && "Jumlah Operator", !warehouse && "Gudang", !teamLeader.trim() && "Kepala Regu"].filter(Boolean);
    if (missing.length) { toast.warning(`Lengkapi dulu: ${missing.join(", ")}`); return; }
    saveMutation.mutate();
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const rows = (await file.text()).split(/\r?\n/).filter(Boolean).slice(1).map((line) => line.split(",").map((value) => value.trim().replace(/^"|"$/g, "")));
    let success = 0;
    for (const [rowDate, rowShift, rowOperators, rowWarehouse, rowLeader] of rows) {
      if (!rowDate || !rowShift || !rowOperators || !warehouses.includes(rowWarehouse) || !rowLeader) continue;
      const response = await fetch("/api/monitoring", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date: rowDate, shift: rowShift.toUpperCase(), operatorCount: Number(rowOperators), warehouse: rowWarehouse, teamLeader: rowLeader }) });
      if (response.ok) success += 1;
    }
    toast.success(`${success} baris monitoring berhasil diimpor`);
    queryClient.invalidateQueries({ queryKey: ["monitoring"] });
    if (importRef.current) importRef.current.value = "";
  }

  const entries = (query.data?.entries ?? []).filter((entry) => {
    const entryDate = entry.date.slice(0, 10);
    return (!filterFrom || entryDate >= filterFrom) && (!filterTo || entryDate <= filterTo);
  });
  const summary = query.data?.summary;
  const chartData = entries.map((entry) => {
    const date = new Date(entry.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
    const shortShift = entry.shift.replace("LONGSHIFT_", "LS").replace("SHIFT_", "S");
    const shortWarehouse = entry.warehouse.replace(/^Gudang\s+/i, "G").replace(/^Gd\.\s*/i, "G");
    return { label: `${date} · ${shortWarehouse} · ${shortShift}`, operatorCount: entry.operatorCount, date, shift: entry.shift, warehouse: entry.warehouse, teamLeader: entry.teamLeader };
  });

  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold tracking-tight">Monitoring Operasional</h1><p className="text-muted-foreground">Input dan pantau operator, shift, gudang, dan kepala regu.</p></div>
    <div className="grid gap-4 md:grid-cols-4">{[["Operator", summary?.totalOperators ?? 0], ["Qty OK", summary?.qtyOk ?? 0], ["Qty NG", summary?.qtyNg ?? 0], ["Persentase OK", `${summary?.okPercentage ?? 0}%`]].map(([label, value]) => <Card key={String(label)} className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></Card>)}</div>
    <Card className="p-5"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-semibold">Man Power Repair ST</h2><p className="text-xs text-muted-foreground">Sumber: input monitoring berdasarkan tanggal, gudang, dan shift.</p></div><div className="flex flex-wrap gap-2"><label className="text-xs font-medium">Dari<Input type="date" value={filterFrom} onChange={(event) => setFilterFrom(event.target.value)} /></label><label className="text-xs font-medium">Sampai<Input type="date" value={filterTo} onChange={(event) => setFilterTo(event.target.value)} /></label><Button type="button" variant="ghost" size="sm" onClick={() => { setFilterFrom(""); setFilterTo(""); }}>Reset</Button></div></div><div className="h-[26rem] w-full">{chartData.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 20, right: 16, left: 0, bottom: 12 }} barCategoryGap="18%"><CartesianGrid vertical={false} strokeDasharray="3 3" /><XAxis dataKey="label" interval={0} tick={{ fontSize: 10 }} tickMargin={8} /><YAxis allowDecimals={false} width={34} /><Tooltip labelFormatter={(_, payload) => payload?.[0]?.payload?.label ?? ""} formatter={(value, _name, item) => [`${value} orang`, `Gudang ${item.payload.warehouse} · ${item.payload.shift}`]} /><Bar dataKey="operatorCount" name="Jumlah Operator" fill="#2563eb" radius={[4, 4, 0, 0]}><LabelList dataKey="operatorCount" position="top" fill="#1e293b" fontSize={11} /></Bar></BarChart></ResponsiveContainer> : <p className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data pada rentang tanggal ini.</p>}</div></Card>
    <Card className="p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold">Input Monitoring</h2><p className="text-xs text-muted-foreground">Format CSV: Tanggal, Shift, Jumlah Operator, Gudang, Kepala Regu</p></div><div className="flex gap-2"><a href="/monitoring-template.csv" download className="rounded-md border px-3 py-2 text-sm">Download Template</a><label className="cursor-pointer rounded-md border px-3 py-2 text-sm">Import CSV<input ref={importRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={importCsv} /></label></div></div><form onSubmit={submit} className="grid gap-4 md:grid-cols-5"><label className="space-y-2 text-sm">Tanggal<Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label className="space-y-2 text-sm">Shift<select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={shift} onChange={(event) => setShift(event.target.value)}>{shiftOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="space-y-2 text-sm">Jumlah Operator<Input type="number" min="0" value={operatorCount} onChange={(event) => setOperatorCount(event.target.value)} required /></label><label className="space-y-2 text-sm">Gudang<select className="flex h-10 w-full rounded-md border bg-background px-3 text-sm" value={warehouse} onChange={(event) => setWarehouse(event.target.value)}>{warehouses.map((value) => <option key={value} value={value}>{value}</option>)}</select></label><label className="space-y-2 text-sm">Kepala Regu<Input value={teamLeader} onChange={(event) => setTeamLeader(event.target.value)} required /></label><Button type="submit" disabled={saveMutation.isPending} className="md:col-span-5">{saveMutation.isPending ? "Menyimpan..." : "Simpan monitoring"}</Button></form></Card>
  </div>;
}
