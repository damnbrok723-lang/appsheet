"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, CheckCircle } from "lucide-react";
import Link from "next/link";

async function fetchTask(id: string) {
  return {
    id, title: "Q4 Report", description: "Prepare the quarterly financial report for Q4 2024.",
    priority: "HIGH", status: "IN_PROGRESS", dueDate: "2024-12-15",
    createdBy: { name: "John Doe" }, assignedTo: { name: "Jane Smith" },
    createdAt: "2024-12-01",
    comments: [
      { id: "1", userId: "2", comment: "Looking good so far!", createdAt: "2024-12-02" },
      { id: "2", userId: "1", comment: "Need to review the numbers.", createdAt: "2024-12-03" },
    ],
  };
}

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const taskQuery = useQuery({ queryKey: ["task", params.id], queryFn: () => fetchTask(params.id), staleTime: 5 * 60 * 1000 });

  if (taskQuery.isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-48" /><Skeleton className="h-64" /></div>;
  }

  const task = taskQuery.data;
  if (!task) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="p-8 text-center"><h2 className="text-xl font-bold mb-2">Task not found</h2><p className="text-muted-foreground mb-4">The task you&apos;re looking for doesn&apos;t exist.</p><Link href="/tasks"><Button>Back to Tasks</Button></Link></Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tasks"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{task.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="destructive">{task.priority}</Badge>
            <Badge variant="outline">{task.status}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Task Details</CardTitle></CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{task.description}</p>
              <div className="mt-4 space-y-2 text-sm">
                <p><span className="font-medium">Assigned to:</span> {task.assignedTo?.name}</p>
                <p><span className="font-medium">Created by:</span> {task.createdBy.name}</p>
                <p><span className="font-medium">Due date:</span> {task.dueDate}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Comments</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {task.comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center"><span className="text-xs font-bold">{comment.userId[0]}</span></div>
                    <div><p className="text-sm">{comment.comment}</p><p className="text-xs text-muted-foreground mt-1">{comment.createdAt}</p></div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <input type="text" placeholder="Add a comment..." className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <Button size="sm">Send</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Workflow Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" variant="outline"><CheckCircle className="mr-2 h-4 w-4" /> Approve</Button>
              <Button className="w-full" variant="outline"><CheckCircle className="mr-2 h-4 w-4" /> Complete</Button>
              <Button className="w-full" variant="outline"><CheckCircle className="mr-2 h-4 w-4" /> Send for Review</Button>
              <Button className="w-full" variant="destructive"><CheckCircle className="mr-2 h-4 w-4" /> Mark as Blocked</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
