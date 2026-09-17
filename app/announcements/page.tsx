"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Megaphone, Plus } from "lucide-react";

type AnnouncementItem = { id: string; title: string; content: string; createdBy: { name: string }; createdAt: string };

async function fetchAnnouncements() {
  const response = await fetch("/api/announcements?limit=100");
  if (!response.ok) throw new Error("Gagal memuat pengumuman");
  return (await response.json()).data.announcements as AnnouncementItem[];
}

export default function AnnouncementsPage() {
  const query = useQuery({ queryKey: ["announcements"], queryFn: fetchAnnouncements, staleTime: 5 * 60 * 1000 });
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const createMutation = useMutation({
    mutationFn: async () => { const response = await fetch("/api/announcements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, content, publishedAt: new Date().toISOString() }) }); const result = await response.json(); if (!response.ok) throw new Error(result.message || "Gagal membuat pengumuman"); },
    onSuccess: () => { setTitle(""); setContent(""); setShowCreate(false); queryClient.invalidateQueries({ queryKey: ["announcements"] }); },
    onError: (error) => alert(error.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold tracking-tight">Announcements</h1><p className="text-muted-foreground">Stay updated with company news.</p></div><Button onClick={() => setShowCreate((value) => !value)}><Plus className="mr-2 h-4 w-4" /> New Announcement</Button></div>
      {showCreate && <form onSubmit={(event) => { event.preventDefault(); createMutation.mutate(); }} className="space-y-3 rounded-lg border bg-card p-4"><Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Judul pengumuman" required /><Textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Isi pengumuman" required /><Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Menyimpan..." : "Publikasikan"}</Button></form>}
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
