-- Run this once in Supabase SQL Editor.
-- Prisma writes to these tables, while Supabase Realtime broadcasts changes.
alter publication supabase_realtime add table
  public.tasks,
  public.task_comments,
  public.task_attachments,
  public.documents,
  public.announcements,
  public.notifications,
  public.monitoring_entries,
  public.production_reports,
  public.attendance,
  public.events,
  public.users,
  public.departments,
  public.teams,
  public.activity_logs;
