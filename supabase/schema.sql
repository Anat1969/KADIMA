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

alter table tasks enable row level security;
alter table task_steps enable row level security;
alter table activity_log enable row level security;
alter table departments enable row level security;

-- זמני: פתוח לכל. להחליף במדיניות לפי משתמש כשמוסיפים Auth.
drop policy if exists "Allow all on tasks" on tasks;
create policy "Allow all on tasks" on tasks for all using (true) with check (true);
drop policy if exists "Allow all on task_steps" on task_steps;
create policy "Allow all on task_steps" on task_steps for all using (true) with check (true);
drop policy if exists "Allow all on activity_log" on activity_log;
create policy "Allow all on activity_log" on activity_log for all using (true) with check (true);
drop policy if exists "Allow all on departments" on departments;
create policy "Allow all on departments" on departments for all using (true) with check (true);
