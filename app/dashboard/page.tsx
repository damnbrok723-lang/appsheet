"use client";

import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TaskCard } from "@/components/tasks/task-card";
import type { Task } from "@/components/tasks/task-card";
import { CalendarView } from "@/components/calendar/calendar-view";
import { TrendingUp, Users, FolderKanban, Clock } from "lucide-react";

async function fetchDashboardStats() {
  const [tasksResponse, membersResponse, eventsResponse] = await Promise.all([
    fetch("/api/tasks?limit=100"),
    fetch("/api/users?limit=100"),
    fetch("/api/calendar?limit=100"),
  ]);
  if (!tasksResponse.ok || !membersResponse.ok || !eventsResponse.ok) throw new Error("Unable to load workspace summary");
  const [tasksResult, membersResult, eventsResult] = await Promise.all([tasksResponse.json(), membersResponse.json(), eventsResponse.json()]);
  const tasks = tasksResult.data.tasks as Task[];
  return {
    totalTasks: tasks.length,
    activeMembers: membersResult.data.total,
    pendingReviews: tasks.filter((task) => task.status === "WAITING_REVIEW").length,
    upcomingEvents: eventsResult.data.total,
  };
}

async function fetchRecentTasks() {
  const response = await fetch("/api/tasks?limit=5");
  if (!response.ok) throw new Error("Unable to load tasks");
  return (await response.json()).data.tasks as Task[];
}

async function fetchEvents() {
  const response = await fetch("/api/calendar?limit=100");
  if (!response.ok) throw new Error("Unable to load events");
  return (await response.json()).data.events;
}

export default function DashboardPage() {
  const statsQuery = useQuery({ queryKey: ["dashboard-stats"], queryFn: fetchDashboardStats, staleTime: 5 * 60 * 1000 });
  const tasksQuery = useQuery({ queryKey: ["recent-tasks"], queryFn: fetchRecentTasks, staleTime: 5 * 60 * 1000 });
  const eventsQuery = useQuery({ queryKey: ["calendar-events"], queryFn: fetchEvents, staleTime: 5 * 60 * 1000 });

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
    </div>
  );
}
