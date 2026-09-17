"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

interface ApiTeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  roleRef?: { name: string };
  department?: { name: string } | null;
  status: string;
}

interface TeamMember extends Omit<ApiTeamMember, "department" | "roleRef"> {
  department: string;
  roleRef?: { name: string };
}

async function fetchTeamMembers(): Promise<TeamMember[]> {
  const response = await fetch("/api/users?limit=50");
  if (!response.ok) throw new Error("Unable to load workspace members");
  const result = await response.json();
  return result.data.users.map((member: ApiTeamMember): TeamMember => ({
    ...member,
    role: member.roleRef?.name ?? member.role,
    department: member.department?.name ?? "Workspace member",
  }));
}

export default function TeamPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const canManageMembers = role === "ADMIN";
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ["team-members"], queryFn: fetchTeamMembers, staleTime: 5 * 60 * 1000 });
  const saveMutation = useMutation({
    mutationFn: async ({ id, formData }: { id?: string; formData: FormData }) => {
      const values = Object.fromEntries(formData);
      const response = await fetch(id ? `/api/users/${id}` : "/api/users", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(id ? values : { ...values, password: values.password || "temporary-password" }),
      });
      if (!response.ok) throw new Error("Unable to save member");
    },
    onSuccess: () => { setShowCreate(false); setEditingMember(null); queryClient.invalidateQueries({ queryKey: ["team-members"] }); toast.success("Member saved"); },
    onError: () => toast.error("Only an administrator can manage members"),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const response = await fetch(`/api/users/${id}`, { method: "DELETE" }); if (!response.ok) throw new Error("Unable to delete member"); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["team-members"] }); toast.success("Member removed"); },
    onError: () => toast.error("Only an administrator can remove members"),
  });

  useEffect(() => {
    fetch("/api/auth/session")
      .then((response) => response.ok ? response.json() : null)
      .then((session) => setRole(session?.user?.role ?? null))
      .catch(() => setRole(null));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4"><div><h1 className="text-3xl font-bold tracking-tight">Team</h1><p className="text-muted-foreground">People who can access your shared workspace.</p></div>{canManageMembers && <button type="button" onClick={() => setShowCreate((visible) => !visible)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> Add member</button>}</div>
      {canManageMembers && showCreate && <form action={(formData) => saveMutation.mutate({ formData })} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4"><input name="name" placeholder="Full name" required className="rounded-md border bg-background px-3 py-2 text-sm" /><input name="email" type="email" placeholder="Email" required className="rounded-md border bg-background px-3 py-2 text-sm" /><input name="password" type="password" placeholder="Temporary password" minLength={6} required className="rounded-md border bg-background px-3 py-2 text-sm" /><select name="role" defaultValue="EMPLOYEE" className="rounded-md border bg-background px-3 py-2 text-sm"><option value="EMPLOYEE">Member</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option></select><button type="submit" disabled={saveMutation.isPending} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground md:col-span-4">{saveMutation.isPending ? "Saving..." : "Create member"}</button></form>}
      {query.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48" />)}</div>
      ) : query.data && query.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{query.data.map((member) => (
          <Card key={member.id} className="relative p-4">
            {editingMember === member.id && canManageMembers ? <form action={(formData) => saveMutation.mutate({ id: member.id, formData })} className="space-y-3"><input name="name" defaultValue={member.name} required className="w-full rounded-md border bg-background px-3 py-2 text-sm" /><input name="email" type="email" defaultValue={member.email} required className="w-full rounded-md border bg-background px-3 py-2 text-sm" /><select name="role" defaultValue={member.role} className="w-full rounded-md border bg-background px-3 py-2 text-sm"><option value="EMPLOYEE">Member</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option></select><div className="flex gap-2"><button type="submit" className="rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground">Save</button><button type="button" onClick={() => setEditingMember(null)} className="rounded-md border px-3 py-2 text-sm">Cancel</button></div></form> : <>
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-16 w-16 mb-3"><AvatarFallback className="text-lg">{member.name.split(" ").map((namePart: string) => namePart[0]).join("")}</AvatarFallback></Avatar>
              <h3 className="font-semibold">{member.name}</h3>
              <p className="text-sm text-muted-foreground">{member.role}</p>
              <p className="text-xs text-muted-foreground">{member.department}</p>
              <Badge variant={member.status === "ACTIVE" ? "success" : "warning"} className="mt-2">{member.status}</Badge>
            </div>
            {canManageMembers && <div className="absolute right-2 top-2 flex gap-1"><button type="button" aria-label={`Edit ${member.name}`} onClick={() => setEditingMember(member.id)} className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"><Pencil className="h-4 w-4" /></button><button type="button" aria-label={`Remove ${member.name}`} onClick={() => deleteMutation.mutate(member.id)} className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>}
            </>}
          </Card>
        ))}</div>
      ) : (
        <Card className="p-8 text-center"><Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" /><p className="text-muted-foreground">No team members found.</p></Card>
      )}
    </div>
  );
}
