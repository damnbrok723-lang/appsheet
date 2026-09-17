"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck } from "lucide-react";

type AuditLog = { id: string; action: string; entityType?: string | null; entityId?: string | null; metadata?: string | null; createdAt: string; user: { name: string; email: string } };

async function fetchLogs() {
  const response = await fetch("/api/audit-logs");
  if (!response.ok) throw new Error("Gagal memuat audit log");
  return (await response.json()).data as AuditLog[];
}

export default function AuditLogsPage() {
  const query = useQuery({ queryKey: ["audit-logs"], queryFn: fetchLogs });
  return <div className="space-y-6"><div><h1 className="text-3xl font-bold tracking-tight">Audit Log</h1><p className="text-muted-foreground">Riwayat aktivitas sistem.</p></div><Card className="overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-b bg-muted/50"><tr><th className="p-4">Waktu</th><th className="p-4">Pengguna</th><th className="p-4">Aksi</th><th className="p-4">Entitas</th><th className="p-4">Detail</th></tr></thead><tbody>{query.isLoading ? <tr><td colSpan={5} className="p-4"><Skeleton className="h-8 w-full" /></td></tr> : (query.data ?? []).map((log) => <tr key={log.id} className="border-b last:border-0"><td className="p-4 whitespace-nowrap">{new Date(log.createdAt).toLocaleString("id-ID")}</td><td className="p-4"><div>{log.user.name}</div><div className="text-xs text-muted-foreground">{log.user.email}</div></td><td className="p-4 font-medium">{log.action}</td><td className="p-4">{log.entityType ?? "-"} {log.entityId ? `(${log.entityId.slice(0, 8)})` : ""}</td><td className="max-w-md truncate p-4 text-muted-foreground">{log.metadata ?? "-"}</td></tr>)}</tbody></table></div>{!query.isLoading && query.data?.length === 0 && <div className="p-8 text-center"><ShieldCheck className="mx-auto mb-3 h-10 w-10 text-muted-foreground" /><p className="text-muted-foreground">Belum ada aktivitas.</p></div>}</Card></div>;
}