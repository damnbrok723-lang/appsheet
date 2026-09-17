"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Plus, Mail, Shield } from "lucide-react";

async function fetchUsers() {
  return [
    { id: "1", name: "John Doe", email: "john@example.com", role: "ADMIN", status: "ACTIVE" },
    { id: "2", name: "Jane Smith", email: "jane@example.com", role: "MANAGER", status: "ACTIVE" },
    { id: "3", name: "Bob Wilson", email: "bob@example.com", role: "EMPLOYEE", status: "ON_LEAVE" },
  ];
}

export default function UsersPage() {
  const query = useQuery({ queryKey: ["admin-users"], queryFn: fetchUsers, staleTime: 5 * 60 * 1000 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage all user accounts.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add User
        </Button>
      </div>
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
