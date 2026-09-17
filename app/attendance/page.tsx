"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

async function fetchAttendance() {
  return { today: { checkIn: null, checkOut: null, date: new Date().toISOString() }, history: [{ date: "2024-12-01", checkIn: "09:00", checkOut: "17:30" }] };
}

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["attendance"], queryFn: fetchAttendance, staleTime: 5 * 60 * 1000 });

  const checkInMutation = useMutation({ mutationFn: async () => { toast.success("Checked in!"); }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }) });
  const checkOutMutation = useMutation({ mutationFn: async () => { toast.success("Checked out!"); }, onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attendance"] }) });

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
            <Button onClick={() => checkInMutation.mutate()}>Check In</Button>
          )}
          {query.data?.today.checkIn && !query.data.today.checkOut && (
            <Button variant="destructive" className="mt-2" onClick={() => checkOutMutation.mutate()}>Check Out</Button>
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
