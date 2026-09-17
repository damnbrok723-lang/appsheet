"use client";

import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskCard } from "@/components/tasks/task-card";
import type { Task } from "@/components/tasks/task-card";
import { CalendarView } from "@/components/calendar/calendar-view";
import { TrendingUp, Users, FolderKanban, Clock } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

async function fetchDashboardStats() {
  const [tasksResponse, reviewResponse, membersResponse, eventsResponse] = await Promise.all([
    fetch("/api/tasks?limit=1"),
    fetch("/api/tasks?status=WAITING_REVIEW&limit=1"),
    fetch("/api/users?limit=1"),
    fetch("/api/calendar?limit=1"),
  ]);
  if (!tasksResponse.ok || !reviewResponse.ok || !membersResponse.ok || !eventsResponse.ok) throw new Error("Unable to load workspace summary");
  const [tasksResult, reviewResult, membersResult, eventsResult] = await Promise.all([tasksResponse.json(), reviewResponse.json(), membersResponse.json(), eventsResponse.json()]);
  return {
    totalTasks: tasksResult.data.total,
    activeMembers: membersResult.data.total,
    pendingReviews: reviewResult.data.total,
    upcomingEvents: eventsResult.data.total,
  };
}

async function fetchRecentTasks() {
  const response = await fetch("/api/tasks?limit=5");
  if (!response.ok) throw new Error("Unable to load tasks");
  return (await response.json()).data.tasks as Task[];
}

async function fetchEvents() {
  const response = await fetch("/api/calendar?limit=10");
  if (!response.ok) throw new Error("Unable to load events");
  return (await response.json()).data.events;
}

async function fetchMonitoring() {
  const response = await fetch("/api/monitoring");
  if (!response.ok) throw new Error("Unable to load monitoring");
  return (await response.json()).data as { entries: { id: string; date: string; operatorCount: number; shift: string; warehouse: string }[] };
}

export default function DashboardPage() {
  const statsQuery = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchDashboardStats, staleTime: 5 * 60 * 1000 });
  const tasksQuery = useQuery({ queryKey: ["recent-tasks"], queryFn: fetchRecentTasks, staleTime: 5 * 60 * 1000 });
  const eventsQuery = useQuery({ queryKey: ["calendar-events"], queryFn: fetchEvents, staleTime: 5 * 60 * 1000 });
  const monitoringQuery = useQuery({ queryKey: ["monitoring"], queryFn: fetchMonitoring, staleTime: 60 * 1000 });
  const monitoringChart = (monitoringQuery.data?.entries ?? []).map((entry) => ({ date: new Date(entry.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit" }), operatorCount: entry.operatorCount, shift: entry.shift, warehouse: entry.warehouse }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s what&apos;s happening.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Shared Tasks" value={statsQuery.data?.totalTasks ?? 0} change="Across your workspace" icon={FolderKanban} isLoading={statsQuery.isLoading} />
        <StatsCard title="Workspace Members" value={statsQuery.data?.activeMembers ?? 0} change="People with access" icon={Users} isLoading={statsQuery.isLoading} />
        <StatsCard title="Needs Review" value={statsQuery.data?.pendingReviews ?? 0} change="Waiting for action" changeType="negative" icon={Clock} isLoading={statsQuery.isLoading} />
        <StatsCard title="Shared Events" value={statsQuery.data?.upcomingEvents ?? 0} change="On your calendar" icon={TrendingUp} isLoading={statsQuery.isLoading} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader><h2 className="text-lg font-semibold">Recent Tasks</h2></CardHeader>
          <CardContent>
            {tasksQuery.isLoading ? (
              <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
            ) : tasksQuery.data && tasksQuery.data.length > 0 ? (
              <div className="space-y-4">{tasksQuery.data.map((task) => <TaskCard key={task.id} task={task} />)}</div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No tasks found</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-lg font-semibold">Upcoming Events</h2></CardHeader>
          <CardContent>
            {eventsQuery.isLoading ? <Skeleton className="h-64" /> : <CalendarView events={eventsQuery.data ?? []} />}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">Monitoring Operator</h2><a className="text-sm text-primary hover:underline" href="/monitoring">Lihat detail</a></div></CardHeader>
        <CardContent>
          {monitoringQuery.isLoading ? <Skeleton className="h-64" /> : monitoringQuery.isError ? <p className="py-8 text-center text-sm text-destructive">Monitoring gagal dimuat.</p> : monitoringChart.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Belum ada data monitoring.</p> : <div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><BarChart data={monitoringChart}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="operatorCount" name="Operator" fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>}
        </CardContent>
      </Card>
    </div>
  );
}
