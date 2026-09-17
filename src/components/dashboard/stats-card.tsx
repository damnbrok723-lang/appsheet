"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { TrendingUp, Users, FolderKanban, Clock } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ElementType;
  isLoading?: boolean;
}

export function StatsCard({ title, value, change, changeType = "neutral", icon: Icon, isLoading }: StatsCardProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
          {change && (
            <p className={cn("text-xs mt-1", changeType === "positive" ? "text-green-600" : changeType === "negative" ? "text-red-600" : "text-muted-foreground")}>
              {change}
            </p>
          )}
        </div>
        <div className="rounded-lg bg-muted p-3">
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  );
}
