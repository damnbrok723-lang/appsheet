"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Building2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const deptSchema = z.object({ name: z.string().min(2), description: z.string().optional() });
type DeptFormData = z.infer<typeof deptSchema>;

async function fetchDepartments() {
  return [
    { id: "1", name: "Engineering", description: "Software development" },
    { id: "2", name: "Marketing", description: "Marketing and sales" },
    { id: "3", name: "HR", description: "Human resources" },
  ];
}

export default function DepartmentsPage() {
  const query = useQuery({ queryKey: ["departments"], queryFn: fetchDepartments, staleTime: 5 * 60 * 1000 });
  const [open, setOpen] = useState(false);

  const form = useForm<DeptFormData>({ resolver: zodResolver(deptSchema), defaultValues: { name: "", description: "" } });

  const onSubmit = (data: DeptFormData) => {
    toast.success("Department created!");
    setOpen(false);
    form.reset();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">Manage organizational departments.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Department</DialogTitle>
              <DialogDescription>Create a new department.</DialogDescription>
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
                        <Input placeholder="Department name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Description" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Create</Button>
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
          {query.data.map((dept) => (
            <Card key={dept.id} className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Building2 className="h-8 w-8 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold">{dept.name}</h3>
                  <p className="text-sm text-muted-foreground">{dept.description}</p>
                </div>
              </div>
              <Badge variant="secondary">{dept.id}</Badge>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No departments found.</p>
        </Card>
      )}
    </div>
  );
}
