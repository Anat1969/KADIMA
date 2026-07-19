-- קדימה — סכמת מסד נתונים
--
-- חשוב: קדימה יושבת בסכמה נפרדת בשם kadima, ולא ב-public.
-- פרויקט ה-Supabase הזה משותף עם אפליקציה אחרת שיושבת ב-public
-- (יש שם טבלת tasks משלה עם מבנה שונה לגמרי). ההפרדה מכוונת —
-- אין לשנות את הקובץ הזה כך שיכתוב ל-public.
--
-- הקובץ אידמפוטנטי: אפשר להריץ אותו שוב בבטחה.
-- הרצה: Supabase > SQL Editor > New Query.
--
-- לאחר ההרצה יש לחשוף את הסכמה ל-API:
-- Project Settings > API > Exposed schemas > הוספת kadima.

create schema if not exists kadima;

create table if not exists kadima.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  department text default '',
  contact text default '',
  type text not null default 'external' check (type in ('external','initiative')),
  status text not null default 'draft' check (status in ('waiting','in_progress','ready','delayed','draft','done')),
  start_date date,
  due_date date,
  raw_material text default '',
  deliverable text default '',
  notes text default '',
  next_step text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists kadima.task_steps (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references kadima.tasks(id) on delete cascade,
  title text not null,
  done boolean default false,
  note text default '',
  order_index int default 0,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists kadima.activity_log (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references kadima.tasks(id) on delete cascade,
  action text not null,
  details text default '',
  created_at timestamptz default now()
);

create table if not exists kadima.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz default now()
);

create or replace function kadima.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_updated_at on kadima.tasks;
create trigger tasks_updated_at
  before update on kadima.tasks
  for each row execute function kadima.update_updated_at();

create index if not exists tasks_user_id_idx on kadima.tasks(user_id);
create index if not exists task_steps_task_id_idx on kadima.task_steps(task_id);
create index if not exists activity_log_task_id_idx on kadima.activity_log(task_id);

-- מדיניות לפי משתמש: כל אחת רואה ועורכת רק את הרשומות שלה.
alter table kadima.tasks enable row level security;
alter table kadima.task_steps enable row level security;
alter table kadima.activity_log enable row level security;
alter table kadima.departments enable row level security;

drop policy if exists "Own tasks" on kadima.tasks;
create policy "Own tasks" on kadima.tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- טבלאות הבת נגזרות דרך המשימה שאליה הן שייכות.
drop policy if exists "Own task steps" on kadima.task_steps;
create policy "Own task steps" on kadima.task_steps for all
  using (exists (select 1 from kadima.tasks t where t.id = task_steps.task_id and t.user_id = auth.uid()))
  with check (exists (select 1 from kadima.tasks t where t.id = task_steps.task_id and t.user_id = auth.uid()));

drop policy if exists "Own activity log" on kadima.activity_log;
create policy "Own activity log" on kadima.activity_log for all
  using (exists (select 1 from kadima.tasks t where t.id = activity_log.task_id and t.user_id = auth.uid()))
  with check (exists (select 1 from kadima.tasks t where t.id = activity_log.task_id and t.user_id = auth.uid()));

drop policy if exists "Read departments" on kadima.departments;
create policy "Read departments" on kadima.departments for select
  using (auth.role() = 'authenticated');

-- הרשאות רגילות של Supabase לסכמה.
grant usage on schema kadima to anon, authenticated, service_role;
grant all on all tables in schema kadima to anon, authenticated, service_role;
grant all on all routines in schema kadima to anon, authenticated, service_role;
grant all on all sequences in schema kadima to anon, authenticated, service_role;
alter default privileges for role postgres in schema kadima
  grant all on tables to anon, authenticated, service_role;

-- Realtime: שידור שינויים לכל המכשירים המחוברים.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'kadima' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table kadima.tasks;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'kadima' and tablename = 'task_steps'
  ) then
    alter publication supabase_realtime add table kadima.task_steps;
  end if;
end $$;
