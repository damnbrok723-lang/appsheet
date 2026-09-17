"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarView } from "@/components/calendar/calendar-view";
import { Card } from "@/components/ui/card";
import { CalendarPlus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CalendarPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const eventsQuery = useQuery({
    queryKey: ["calendar-events"],
    queryFn: async () => { const response = await fetch("/api/calendar?limit=100"); if (!response.ok) throw new Error("Unable to load events"); return (await response.json()).data.events; },
  });
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => { const response = await fetch("/api/calendar", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(formData)) }); if (!response.ok) throw new Error("Unable to create event"); },
    onSuccess: () => { setShowCreate(false); queryClient.invalidateQueries({ queryKey: ["calendar-events"] }); toast.success("Event created"); },
    onError: () => toast.error("Event could not be created"),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const response = await fetch(`/api/calendar/${id}`, { method: "DELETE" }); if (!response.ok) throw new Error("Unable to delete event"); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["calendar-events"] }); toast.success("Event deleted"); },
    onError: () => toast.error("You can only delete events you own"),
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => { const response = await fetch(`/api/calendar/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(formData)) }); if (!response.ok) throw new Error("Unable to update event"); },
    onSuccess: () => { setEditingEvent(null); queryClient.invalidateQueries({ queryKey: ["calendar-events"] }); toast.success("Event updated"); },
    onError: () => toast.error("You can only edit events you own"),
  });
  const events = eventsQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold tracking-tight">Calendar</h1><p className="text-muted-foreground">Shared schedule for your workspace.</p></div>
        <button type="button" onClick={() => setShowCreate((visible) => !visible)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><CalendarPlus className="h-4 w-4" /> New Event</button>
      </div>
      {showCreate && <form action={(formData) => createMutation.mutate(formData)} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4">
        <input name="title" placeholder="Event title" required className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" />
        <input name="startAt" type="datetime-local" required className="rounded-md border bg-background px-3 py-2 text-sm" />
        <input name="endAt" type="datetime-local" required className="rounded-md border bg-background px-3 py-2 text-sm" />
        <input name="location" placeholder="Location or link" className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-3" />
        <button type="submit" disabled={createMutation.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{createMutation.isPending ? "Saving..." : "Save event"}</button>
      </form>}
      <Card className="p-6">
        {eventsQuery.isLoading ? <p className="text-sm text-muted-foreground">Loading events...</p> : <CalendarView events={events} />}
      </Card>
      {events.length > 0 && <div className="space-y-2">{events.map((event: { id: string; title: string; startAt: string; endAt: string; location?: string }) => <div key={event.id} className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">{editingEvent === event.id ? <form action={(formData) => updateMutation.mutate({ id: event.id, formData })} className="grid w-full gap-2 md:grid-cols-4"><input name="title" defaultValue={event.title} required className="rounded-md border bg-background px-3 py-2 text-sm" /><input name="startAt" type="datetime-local" defaultValue={event.startAt.slice(0, 16)} required className="rounded-md border bg-background px-3 py-2 text-sm" /><input name="endAt" type="datetime-local" defaultValue={event.endAt.slice(0, 16)} required className="rounded-md border bg-background px-3 py-2 text-sm" /><div className="flex gap-2"><button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Save</button><button type="button" onClick={() => setEditingEvent(null)} className="rounded-md border px-3 py-2 text-sm">Cancel</button></div></form> : <><div><p className="font-medium">{event.title}</p><p className="text-sm text-muted-foreground">{new Date(event.startAt).toLocaleString()} {event.location ? `· ${event.location}` : ""}</p></div><div className="flex gap-1"><button type="button" aria-label={`Edit ${event.title}`} onClick={() => setEditingEvent(event.id)} className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><Pencil className="h-4 w-4" /></button><button type="button" aria-label={`Delete ${event.title}`} onClick={() => deleteMutation.mutate(event.id)} className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div></>}</div>)}</div>}
    </div>
  );
}
