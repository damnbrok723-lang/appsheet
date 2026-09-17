"use client";

import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, FolderKanban, Clock, BarChart3, FileText } from "lucide-react";

async function fetchAdminStats() {
  return { totalUsers: 48, totalDepartments: 6, totalTeams: 12, totalTasks: 156, totalAttendance: 98 };
}

async function fetchUsers() {
  return [
    { id: "1", name: "John Doe", email: "john@example.com", role: "ADMIN", status: "ACTIVE" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "MANAGER", status: "ACTIVE" },
    { id: "3", name: "Bob Wilson", email: "bob@example.com", role: "EMPLOYEE", status: "ON_LEAVE" },
  ];
}

async function fetchDepartments() {
  return [
    { id: "1", name: "Engineering", description: "Software development" },
    { id: "2", name: "Marketing", description: "Marketing and sales" },
  ];
}

async function fetchTeams() {
  return [{ id: "1", name: "Frontend", departmentId: "1" }, { id: "2", name: "Backend", departmentId: "1" }];
}

export default function AdminDashboardPage() {
  const statsQuery = useQuery({ queryKey: ["admin-stats"], queryFn: fetchAdminStats, staleTime: 5 * 60 * 1000 });
  const usersQuery = useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers, staleTime: 5 * 60 * 1000 });
  const departmentsQuery = useQuery({ queryKey: ["admin-departments"], queryFn: fetchDepartments, staleTime: 5 * 60 * 1000 });
  const teamsQuery = useQuery({ queryKey: ["admin-teams"], queryFn: fetchTeams, staleTime: 5 * 60 * 1000 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your organization.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard title="Total Users" value={statsQuery.data?.totalUsers ?? 0} icon={Users} isLoading={statsQuery.isLoading} />
        <StatsCard title="Departments" value={statsQuery.data?.totalDepartments ?? 0} icon={FolderKanban} isLoading={statsQuery.isLoading} />
        <StatsCard title="Teams" value={statsQuery.data?.totalTeams ?? 0} icon={Clock} isLoading={statsQuery.isLoading} />
        <StatsCard title="Tasks" value={statsQuery.data?.totalTasks ?? 0} icon={BarChart3} isLoading={statsQuery.isLoading} />
        <StatsCard title="Attendance" value={`${statsQuery.data?.totalAttendance ?? 0}%`} icon={FileText} isLoading={statsQuery.isLoading} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader><h2 className="text-lg font-semibold">Users</h2></CardHeader>
          <CardContent>
            {usersQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {usersQuery.data?.map((user) => (
                  <div key={user.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant={user.status === "ACTIVE" ? "success" : "warning"}>{user.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-lg font-semibold">Departments</h2></CardHeader>
          <CardContent>
            {departmentsQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {departmentsQuery.data?.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium">{dept.name}</p>
                      <p className="text-sm text-muted-foreground">{dept.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h2 className="text-lg font-semibold">Teams</h2></CardHeader>
          <CardContent>
            {teamsQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {teamsQuery.data?.map((team) => (
                  <div key={team.id} className="flex items-center justify-between rounded-lg border p-3">
                    <p className="font-medium">{team.name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
