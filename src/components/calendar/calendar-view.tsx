"use client";

import { useState } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location?: string;
}

interface CalendarViewProps {
  events?: CalendarEvent[];
  isLoading?: boolean;
}

export function CalendarView({ events = [], isLoading }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const getEventsForDay = (day: Date) => events.filter((e) => isSameDay(new Date(e.startAt), day));

  if (isLoading) {
    return (
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: 42 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold">{format(currentDate, "MMMM yyyy")}</h2>
        <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-px rounded-lg border">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="flex h-10 items-center justify-center rounded-tl-lg rounded-tr-lg border-b bg-muted text-xs font-medium text-muted-foreground">{day}</div>
        ))}
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const today = isToday(day);
          return (
            <div key={day.toISOString()} className={cn("min-h-20 border p-1 text-xs", !isCurrentMonth && "bg-muted/30", today && "bg-accent/50")}>
              <span className={cn("flex h-6 w-6 items-center justify-center rounded-full", today && "bg-primary text-primary-foreground", !isCurrentMonth && "text-muted-foreground")}>{format(day, "d")}</span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 2).map((event) => (
                  <div key={event.id} className="truncate rounded bg-primary/10 px-1 py-0.5 text-[10px] font-medium text-primary">{event.title}</div>
                ))}
                {dayEvents.length > 2 && <p className="text-[10px] text-muted-foreground">+{dayEvents.length - 2} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
