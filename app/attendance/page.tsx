"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

type AttendanceRecord = { id: string; date: string; checkIn?: string | null; checkOut?: string | null };

async function fetchAttendance() {
  const response = await fetch("/api/attendance?limit=31");
  if (!response.ok) throw new Error("Gagal memuat kehadiran");
  const records = (await response.json()).data.attendanceRecords as AttendanceRecord[];
  const todayKey = new Date().toISOString().slice(0, 10);
  const today = records.find((record: { date: string }) => record.date.slice(0, 10) === todayKey);
  return { today: { checkIn: today?.checkIn ?? null, checkOut: today?.checkOut ?? null, date: todayKey }, history: records };
}

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["attendance"], queryFn: fetchAttendance, staleTime: 5 * 60 * 1000 });

  const attendanceMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/attendance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal mencatat kehadiran");
      return result;
    },
    onSuccess: (result) => { toast.success(result.message); queryClient.invalidateQueries({ queryKey: ["attendance"] }); },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">Attendance</h1><p className="text-muted-foreground">Track your work hours.</p></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="p-6 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Today&apos;s Status</h3>
          {query.data?.today.checkIn ? (
            <div><Badge variant="success" className="mb-2">Checked In</Badge><p className="text-muted-foreground">{query.data.today.checkIn}</p></div>
          ) : (
            <Button onClick={() => attendanceMutation.mutate()} disabled={attendanceMutation.isPending}>{attendanceMutation.isPending ? "Menyimpan..." : "Check In"}</Button>
          )}
          {query.data?.today.checkIn && !query.data.today.checkOut && (
            <Button variant="destructive" className="mt-2" onClick={() => attendanceMutation.mutate()} disabled={attendanceMutation.isPending}>Check Out</Button>
          )}
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-3">This Week</h3>
          <div className="space-y-2">
            {query.data?.history.map((entry, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border p-2"><span className="text-sm">{entry.date}</span><div className="flex gap-2"><Badge variant="outline">{entry.checkIn}</Badge><Badge variant="outline">{entry.checkOut}</Badge></div></div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
