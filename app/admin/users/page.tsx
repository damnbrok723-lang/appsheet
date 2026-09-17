"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Shield } from "lucide-react";

async function fetchUsers() {
  const response = await fetch("/api/users?limit=100");
  if (!response.ok) throw new Error("Gagal memuat pengguna");
  return (await response.json()).data.users as { id: string; name: string; email: string; role: string; status: string }[];
}

export default function UsersPage() {
  const query = useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers, staleTime: 5 * 60 * 1000 });
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(formData)) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Gagal membuat pengguna");
    },
    onSuccess: () => { setShowCreate(false); queryClient.invalidateQueries({ queryKey: ["admin-users"] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage all user accounts.</p>
        </div>
        <Button onClick={() => setShowCreate((value) => !value)}>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>
      {showCreate && <form action={(formData) => createMutation.mutate(formData)} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-4"><Input name="name" placeholder="Nama lengkap" required /><Input name="email" type="email" placeholder="Email" required /><Input name="password" type="password" placeholder="Password minimal 6 karakter" minLength={6} required /><select name="role" defaultValue="EMPLOYEE" className="rounded-md border bg-background px-3 py-2 text-sm"><option value="EMPLOYEE">Employee</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option></select><Button type="submit" disabled={createMutation.isPending} className="md:col-span-4">{createMutation.isPending ? "Menyimpan..." : "Simpan pengguna"}</Button></form>}
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users..." className="max-w-sm" />
        </div>
      </Card>
      {query.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : query.data && query.data.length > 0 ? (
        <div className="space-y-2">
          {query.data.map((user) => (
            <Card key={user.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{user.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={user.role === "ADMIN" ? "destructive" : user.role === "MANAGER" ? "secondary" : "outline"}>
                  {user.role}
                </Badge>
                <Badge variant={user.status === "ACTIVE" ? "success" : "warning"}>
                  {user.status}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No users found.</p>
        </Card>
      )}
    </div>
  );
}
