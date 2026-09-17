"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const teamSchema = z.object({ name: z.string().min(2), departmentId: z.string().min(1) });
type TeamFormData = z.infer<typeof teamSchema>;

async function fetchTeams() {
  const response = await fetch("/api/teams");
  if (!response.ok) throw new Error("Gagal memuat tim");
  return (await response.json()).data as { id: string; name: string; departmentId: string }[];
}

export default function TeamsPage() {
  const query = useQuery({ queryKey: ["teams"], queryFn: fetchTeams, staleTime: 5 * 60 * 1000 });
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const form = useForm<TeamFormData>({ resolver: zodResolver(teamSchema), defaultValues: { name: "", departmentId: "" } });

  const createMutation = useMutation({
    mutationFn: async (data: TeamFormData) => { const response = await fetch("/api/teams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }); const result = await response.json(); if (!response.ok) throw new Error(result.message || "Gagal membuat tim"); },
    onSuccess: () => { toast.success("Tim dibuat"); setOpen(false); form.reset(); queryClient.invalidateQueries({ queryKey: ["teams"] }); },
    onError: (error) => toast.error(error.message),
  });

  const onSubmit = (data: TeamFormData) => createMutation.mutate(data);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">Manage project teams.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Team
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Team</DialogTitle>
              <DialogDescription>Create a new team.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Team name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                      </Select>
                      <SelectContent>
                        <SelectItem value="1">Engineering</SelectItem>
                        <SelectItem value="2">Marketing</SelectItem>
                      </SelectContent>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Menyimpan..." : "Create"}</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      {query.isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : query.data && query.data.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {query.data.map((team) => (
            <Card key={team.id} className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">{team.name}</h3>
                  <p className="text-sm text-muted-foreground">Dept: {team.departmentId}</p>
                </div>
              </div>
              <Badge variant="secondary">{team.id}</Badge>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No teams found.</p>
        </Card>
      )}
    </div>
  );
}
