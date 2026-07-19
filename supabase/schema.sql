-- קדימה — סכמת מסד נתונים
-- הריצי קובץ זה ב-Supabase > SQL Editor > New Query

create extension if not exists "uuid-ossp";

create table if not exists departments (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
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

create table if not exists task_steps (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  title text not null,
  done boolean default false,
  note text default '',
  order_index int default 0,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists activity_log (
  id uuid primary key default uuid_generate_v4(),
  task_id uuid not null references tasks(id) on delete cascade,
  action text not null,
  details text default '',
  created_at timestamptz default now()
);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists tasks_updated_at on tasks;
create trigger tasks_updated_at
  before update on tasks
  for each row execute function update_updated_at();

-- למסד נתונים שכבר הורץ בו הסכמה הישנה: הוספת העמודה בדיעבד.
alter table tasks add column if not exists user_id uuid
  references auth.users(id) on delete cascade default auth.uid();

-- Realtime: שידור שינויים בטבלאות לכל המכשירים המחוברים.
-- ניתן להרצה חוזרת: מדלג על טבלה שכבר משודרת.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table tasks;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'task_steps'
  ) then
    alter publication supabase_realtime add table task_steps;
  end if;
end $$;

alter table tasks enable row level security;
alter table task_steps enable row level security;
alter table activity_log enable row level security;
alter table departments enable row level security;

-- מדיניות לפי משתמש: כל אחת רואה ועורכת רק את הרשומות שלה.
-- הסרת המדיניות הפתוחה הישנה אם קיימת.
drop policy if exists "Allow all on tasks" on tasks;
drop policy if exists "Allow all on task_steps" on task_steps;
drop policy if exists "Allow all on activity_log" on activity_log;
drop policy if exists "Allow all on departments" on departments;

drop policy if exists "Own tasks" on tasks;
create policy "Own tasks" on tasks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- טבלאות הבת נגזרות דרך המשימה שאליה הן שייכות.
drop policy if exists "Own task steps" on task_steps;
create policy "Own task steps" on task_steps for all
  using (exists (select 1 from tasks t where t.id = task_steps.task_id and t.user_id = auth.uid()))
  with check (exists (select 1 from tasks t where t.id = task_steps.task_id and t.user_id = auth.uid()));

drop policy if exists "Own activity log" on activity_log;
create policy "Own activity log" on activity_log for all
  using (exists (select 1 from tasks t where t.id = activity_log.task_id and t.user_id = auth.uid()))
  with check (exists (select 1 from tasks t where t.id = activity_log.task_id and t.user_id = auth.uid()));

-- מינהלים הם רשימה משותפת לקריאה בלבד למשתמשים מחוברים.
drop policy if exists "Read departments" on departments;
create policy "Read departments" on departments for select
  using (auth.role() = 'authenticated');

-- אינדקסים לשאילתות שהמדיניות מייצרת.
create index if not exists tasks_user_id_idx on tasks(user_id);
create index if not exists task_steps_task_id_idx on task_steps(task_id);
create index if not exists activity_log_task_id_idx on activity_log(task_id);
