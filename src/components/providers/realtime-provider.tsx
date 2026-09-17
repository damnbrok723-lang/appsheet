"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabaseBrowser } from "@/lib/supabase-browser";

const realtimeTables = [
  "tasks",
  "task_comments",
  "task_attachments",
  "documents",
  "announcements",
  "notifications",
  "monitoring_entries",
  "production_reports",
  "attendance",
  "events",
  "users",
  "departments",
  "teams",
  "activity_logs",
] as const;

export function RealtimeProvider() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const client = supabaseBrowser;
    if (!client) return;

    const channel = client.channel(`officehub-database-changes-${Math.random().toString(36).slice(2)}`);
    for (const table of realtimeTables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          queryClient.invalidateQueries();
        },
      );
    }

    channel.subscribe();
    return () => {
      void client.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
}
