"use client";

import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus } from "lucide-react";

async function fetchAnnouncements() {
  return [{ id: "1", title: "Company Holiday Schedule", content: "Please review the holiday schedule for Q4.", createdBy: { name: "Admin" }, createdAt: "2024-12-01" }];
}

export default function AnnouncementsPage() {
  const query = useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements, staleTime: 5 * 60 * 1000 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold tracking-tight">Announcements</h1><p className="text-muted-foreground">Stay updated with company news.</p></div><Button><Plus className="mr-2 h-4 w-4" /> New Announcement</Button></div>
      {query.isLoading ? <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div> : query.data && query.data.length > 0 ? (
        <div className="space-y-4">{query.data.map((announcement) => (
          <Card key={announcement.id} className="p-6"><div className="flex items-start justify-between"><div><h3 className="text-lg font-semibold">{announcement.title}</h3><p className="text-sm text-muted-foreground mt-1">by {announcement.createdBy.name} • {announcement.createdAt}</p></div><Badge variant="secondary">Announcement</Badge></div><p className="mt-3 text-muted-foreground">{announcement.content}</p></Card>
        ))}</div>
      ) : (
        <Card className="p-8 text-center"><Megaphone className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">No announcements yet.</p></Card>
      )}
    </div>
  );
}
