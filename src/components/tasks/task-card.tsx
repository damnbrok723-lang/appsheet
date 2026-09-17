"use client";

import { CheckCircle2, Clock, Flag, User } from "lucide-react";
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";
type TaskStatus = "ASSIGNED" | "ACCEPTED" | "IN_PROGRESS" | "WAITING_REVIEW" | "REVISION" | "BLOCKED" | "APPROVED" | "COMPLETED";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | null;
  createdBy: { name: string };
  assignedTo: { name: string } | null;
  createdAt: string;
}

interface TaskCardProps {
  task: Task;
  isLoading?: boolean;
}

const priorityColors: Record<Priority, BadgeProps["variant"]> = {
  LOW: "secondary",
  MEDIUM: "default",
  HIGH: "destructive",
  URGENT: "destructive",
};

const statusLabels: Record<TaskStatus, string> = {
  ASSIGNED: "Assigned",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In Progress",
  WAITING_REVIEW: "Waiting Review",
  REVISION: "Revision",
  BLOCKED: "Blocked",
  APPROVED: "Approved",
  COMPLETED: "Completed",
};

export function TaskCard({ task, isLoading }: TaskCardProps) {
  if (isLoading) {
    return (
      <Card className="p-4">
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-3 w-full mb-1" />
        <Skeleton className="h-3 w-1/2" />
      </Card>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant={priorityColors[task.priority]}>{task.priority}</Badge>
          <Badge variant="outline">{statusLabels[task.status]}</Badge>
        </div>
      </div>
      <h4 className="font-semibold mb-1">{task.title}</h4>
      {task.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{task.description}</p>}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          {task.assignedTo && (
            <span className="flex items-center gap-1"><User className="h-3 w-3" />{task.assignedTo.name}</span>
          )}
        </div>
        {task.dueDate && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
          </span>
        )}
      </div>
    </Card>
  );
}
