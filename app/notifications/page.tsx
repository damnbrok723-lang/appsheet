"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck } from "lucide-react";

type NotificationItem = { id: string; title: string; message: string; readAt: string | null; createdAt: string };

async function fetchNotifications() {
  const response = await fetch("/api/notifications?limit=100");
  if (!response.ok) throw new Error("Gagal memuat notifikasi");
  return (await response.json()).data.notifications as NotificationItem[];
}

export default function NotificationsPage() {
  const query = useQuery({ queryKey: ["notifications"], queryFn: fetchNotifications, staleTime: 5 * 60 * 1000 });
  const queryClient = useQueryClient();
  const markAllRead = useMutation({ mutationFn: async () => { const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "read-all" }) }); if (!response.ok) throw new Error("Gagal menandai notifikasi"); }, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["notifications"] }); } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold tracking-tight">Notifications</h1><p className="text-muted-foreground">View all your notifications.</p></div><Button variant="outline" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}><CheckCheck className="mr-2 h-4 w-4" /> Mark all read</Button></div>
      {query.isLoading ? <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div> : query.data && query.data.length > 0 ? (
        <div className="space-y-2">{query.data.map((notification) => (
          <Card key={notification.id} className={`p-4 ${!notification.readAt ? "bg-accent/30" : ""}`}><div className="flex items-start gap-3"><div className="flex-1"><p className="font-medium">{notification.title}</p><p className="text-sm text-muted-foreground">{notification.message}</p><p className="text-xs text-muted-foreground mt-1">{notification.createdAt}</p></div>{!notification.readAt && <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-2" />}</div></Card>
        ))}</div>
      ) : (
        <Card className="p-8 text-center"><Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">No notifications.</p></Card>
      )}
    </div>
  );
}
