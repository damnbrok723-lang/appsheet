"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  readAt: string | null;
  createdAt: string;
}

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["notifications", "dropdown"],
    enabled: isOpen,
    staleTime: 60_000,
    retry: 0,
    queryFn: async () => {
      const response = await fetch("/api/notifications?limit=5");
      if (!response.ok) throw new Error("Unable to load notifications");
      return (await response.json()).data.notifications as Notification[];
    },
  });
  const notifications = query.data ?? [];
  const markAllRead = useMutation({
    mutationFn: async () => { const response = await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "read-all" }) }); if (!response.ok) throw new Error("Unable to mark notifications as read"); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
  const markRead = useMutation({
    mutationFn: async (id: string) => { const response = await fetch(`/api/notifications/${id}`, { method: "PATCH" }); if (!response.ok) throw new Error("Unable to mark notification as read"); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">{unreadCount}</span>}
      </Button>
      {isOpen && (
        <Card className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-2rem))] shadow-lg">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
            <Button variant="ghost" size="sm" onClick={() => markAllRead.mutate()} disabled={notifications.length === 0}>
              <CheckCheck className="h-4 w-4" />
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {query.isLoading ? <p className="p-4 text-sm text-muted-foreground">Loading notifications...</p> : notifications.length === 0 ? <p className="p-4 text-sm text-muted-foreground">No notifications yet.</p> : notifications.map((notification) => (
              <button type="button" key={notification.id} onClick={() => !notification.readAt && markRead.mutate(notification.id)} className={cn("flex w-full items-start gap-3 p-4 text-left hover:bg-accent/50", !notification.readAt && "bg-accent/30")}>
                <div className="flex-1">
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">{notification.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatDistanceToNow(new Date(notification.createdAt))} ago</p>
                </div>
                {!notification.readAt && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
              </button>
            ))}
          </div>
          <div className="border-t p-2 text-center">
            <Button variant="ghost" size="sm" className="w-full" asChild><Link href="/notifications" onClick={() => setIsOpen(false)}>View All Notifications</Link></Button>
          </div>
        </Card>
      )}
    </div>
  );
}
