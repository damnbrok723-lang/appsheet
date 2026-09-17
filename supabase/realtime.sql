-- Run this in Supabase SQL Editor.
-- It is safe to run repeatedly.
do $$
declare
  tbl text;
begin
  foreach tbl in array array[
    'roles',
    'users',
    'departments',
    'teams',
    'tasks',
    'task_comments',
    'task_attachments',
    'events',
    'event_participants',
    'documents',
    'document_permissions',
    'announcements',
    'announcement_targets',
    'notifications',
    'activity_logs',
    'attendance',
    'monitoring_entries',
    'production_reports'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables as p
      where p.pubname = 'supabase_realtime'
        and p.schemaname = 'public'
        and p.tablename = tbl
    ) then
      execute format(
        'alter publication supabase_realtime add table public.%I',
        tbl
      );
    end if;
  end loop;
end
$$;
