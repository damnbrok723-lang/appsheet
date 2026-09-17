"use client";

import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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
  const saveMutation = useMutation({
    mutationFn: async () => { const response = await fetch("/api/monitoring", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ date, shift, operatorCount: Number(operatorCount), warehouse }) }); const result = await response.json(); if (!response.ok) throw new Error(result.message || "Gagal menyimpan monitoring"); },
    onSuccess: () => { toast.success("Data monitoring tersimpan"); setOperatorCount(""); setWarehouse(""); queryClient.invalidateQueries({ queryKey: ["monitoring"] }); },
    onError: (error) => toast.error(error.message),
  });
  function submit(event: FormEvent) { event.preventDefault(); saveMutation.mutate(); }
  const summary = query.data?.summary;
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold tracking-tight">Monitoring Operasional</h1><p className="text-muted-foreground">Input dan pantau operator, shift, gudang, dan hasil produksi.</p></div><div className="grid gap-4 md:grid-cols-4">{[["Operator", summary?.totalOperators ?? 0], ["Qty OK", summary?.qtyOk ?? 0], ["Qty NG", summary?.qtyNg ?? 0], ["Persentase OK", `${summary?.okPercentage ?? 0}%`]].map(([label, value]) => <Card key={String(label)} className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></Card>)}</div><Card className="p-5"><h2 className="mb-4 text-lg font-semibold">Input Monitoring</h2><form onSubmit={submit} className="grid gap-4 md:grid-cols-4"><label className="space-y-2 text-sm">Tanggal<Input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label><label className="space-y-2 text-sm">Shift<select value={shift} onChange={(event) => setShift(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3"><option value="PAGI">Pagi</option><option value="SIANG">Siang</option><option value="MALAM">Malam</option></select></label><label className="space-y-2 text-sm">Jumlah Operator<Input type="number" min="0" value={operatorCount} onChange={(event) => setOperatorCount(event.target.value)} required /></label><label className="space-y-2 text-sm">Gudang<Input value={warehouse} onChange={(event) => setWarehouse(event.target.value)} required /></label><Button type="submit" disabled={saveMutation.isPending} className="md:col-span-4">{saveMutation.isPending ? "Menyimpan..." : "Simpan monitoring"}</Button></form></Card><Card className="p-5"><h2 className="mb-4 text-lg font-semibold">Riwayat Monitoring</h2><div className="divide-y">{(query.data?.entries ?? []).map((entry) => <div key={entry.id} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{new Date(entry.date).toLocaleDateString("id-ID")}</span><span>{entry.shift}</span><span>{entry.operatorCount} operator</span><span>{entry.warehouse}</span></div>)}</div></Card></div>;
}