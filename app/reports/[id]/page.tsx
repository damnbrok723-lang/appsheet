"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, FileBarChart } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Report = { reportDate: string; customer: string; dimensions: string; pipeTypes: string[]; batchNumber: string; ncrNumber?: string | null; operatorTypes: string[]; operatorName: string; shift: string; qtyOk: number; qtyNg: number; ngNotes?: string | null; processNotes?: string | null; status: string; photoData?: string | null };

function formatShift(shift?: string) {
  if (!shift) return "-";
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

export default function ReportDetailPage({ params }: { params?: Promise<{ id: string }> | { id: string } }) {
  const routeParams = useParams<{ id: string }>();
  const id = routeParams?.id || (params as any)?.id;
  const query = useQuery({
    queryKey: ["production-report", id],
    queryFn: async () => {
      const response = await fetch(`/api/production-reports/${id}`);
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal memuat detail laporan");
      return result.data as Report;
    },
    enabled: Boolean(id),
  });
  const report = query.data;
  if (query.isLoading) return <p className="text-sm text-muted-foreground">Memuat detail laporan...</p>;
  if (query.isError || !report) return <p className="text-sm text-destructive">Detail laporan tidak dapat dimuat.</p>;
  return <div className="space-y-6"><Button asChild variant="outline"><Link href="/reports"><ArrowLeft className="mr-2 h-4 w-4" />Kembali ke laporan</Link></Button><Card><CardHeader><h1 className="flex items-center gap-2 text-2xl font-bold"><FileBarChart className="h-6 w-6" />Detail Laporan</h1></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-2"><p><strong>Customer</strong><br />{report.customer}</p><p><strong>Tanggal</strong><br />{new Date(report.reportDate).toLocaleDateString("id-ID")}</p><p><strong>Dimensi</strong><br />{report.dimensions}</p><p><strong>Batch</strong><br />{report.batchNumber}</p><p><strong>Jenis Pipa</strong><br />{report.pipeTypes?.join(", ") || "-"}</p><p><strong>No NCR</strong><br />{report.ncrNumber || "-"}</p><p><strong>Operator</strong><br />{report.operatorName} ({report.operatorTypes?.join(", ") || "-"})</p><p><strong>Shift</strong><br />{formatShift(report.shift)}</p><p><strong>Qty OK / NG</strong><br />{report.qtyOk} / {report.qtyNg}</p><p><strong>Status</strong><br />{report.status}</p><p className="md:col-span-2"><strong>Keterangan NG</strong><br />{report.ngNotes || "-"}</p><p className="md:col-span-2"><strong>Keterangan Proses</strong><br />{report.processNotes || "-"}</p></div>{report.photoData && <div className="mt-6"><h2 className="mb-3 text-lg font-semibold">Foto Laporan</h2><img src={report.photoData} alt={`Foto laporan ${report.customer}`} className="max-h-[70vh] max-w-full rounded-md border object-contain" /></div>}</CardContent></Card></div>;
}
