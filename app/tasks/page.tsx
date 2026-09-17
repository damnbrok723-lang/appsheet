"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TaskCard } from "@/components/tasks/task-card";
import type { Task } from "@/components/tasks/task-card";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Filter, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

async function fetchTasks() {
  const response = await fetch("/api/tasks?limit=50");
  if (!response.ok) throw new Error("Unable to load tasks");
  const result = await response.json();
  return result.data.tasks as Task[];
}

export default function TasksPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const tasksQuery = useQuery({ queryKey: ["tasks"], queryFn: fetchTasks, staleTime: 5 * 60 * 1000 });
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const values = Object.fromEntries(formData);
      const body = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));
      const response = await fetch("/api/tasks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error("Unable to create task");
    },
    onSuccess: () => { setShowCreate(false); queryClient.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Task created"); },
    onError: () => toast.error("Task could not be created"),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const response = await fetch(`/api/tasks/${id}`, { method: "DELETE" }); if (!response.ok) throw new Error("Unable to delete task"); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Task deleted"); },
    onError: () => toast.error("You can only delete tasks you own"),
  });
  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const values = Object.fromEntries(formData);
      const body = Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ""));
      const response = await fetch(`/api/tasks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!response.ok) throw new Error("Unable to update task");
    },
    onSuccess: () => { setEditingTask(null); queryClient.invalidateQueries({ queryKey: ["tasks"] }); toast.success("Task updated"); },
    onError: () => toast.error("You can only edit tasks you own or are assigned to"),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">Manage and track your tasks.</p>
        </div>
        <button type="button" onClick={() => setShowCreate((visible) => !visible)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> New Task</button>
      </div>

      {showCreate && <form action={(formData) => createMutation.mutate(formData)} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4">
        <input name="title" placeholder="Task title" required className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" />
        <select name="priority" defaultValue="MEDIUM" className="rounded-md border bg-background px-3 py-2 text-sm"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select>
        <input name="dueDate" type="date" className="rounded-md border bg-background px-3 py-2 text-sm" />
        <textarea name="description" placeholder="What needs to be done?" className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-3" />
        <button type="submit" disabled={createMutation.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">{createMutation.isPending ? "Saving..." : "Save task"}</button>
      </form>}

      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground"><Filter className="h-4 w-4" /> Filters</span>
        <Badge variant="secondary">All</Badge>
        <Badge variant="outline">Active</Badge>
        <Badge variant="outline">Completed</Badge>
      </div>

      {tasksQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : tasksQuery.data && tasksQuery.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{tasksQuery.data.map((task) => <div key={task.id} className="relative">
          {editingTask === task.id ? <form action={(formData) => updateMutation.mutate({ id: task.id, formData })} className="space-y-3 rounded-lg border bg-card p-4">
            <input name="title" defaultValue={task.title} required className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <textarea name="description" defaultValue={task.description} className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-2"><select name="priority" defaultValue={task.priority} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select><input name="dueDate" type="date" defaultValue={task.dueDate?.slice(0, 10) ?? ""} className="rounded-md border bg-background px-3 py-2 text-sm" /></div>
            <div className="flex gap-2"><button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Save</button><button type="button" onClick={() => setEditingTask(null)} className="rounded-md border px-3 py-2 text-sm">Cancel</button></div>
          </form> : <><TaskCard task={task} /><div className="absolute right-3 top-12 flex gap-1"><button type="button" aria-label={`Edit ${task.title}`} onClick={() => setEditingTask(task.id)} className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><Pencil className="h-4 w-4" /></button><button type="button" aria-label={`Delete ${task.title}`} onClick={() => deleteMutation.mutate(task.id)} className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div></>}
        </div>)}</div>
      ) : (
        <Card className="p-8 text-center"><p className="text-muted-foreground">No tasks found. Create one to get started.</p></Card>
      )}
    </div>
  );
}
