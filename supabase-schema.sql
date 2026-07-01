-- Daily Tracker - Supabase Schema
-- Run this in your Supabase SQL editor

-- Daily entries (journal, tasks, mental/physical status)
create table if not exists daily_entries (
  id uuid primary key default gen_random_uuid(),
  date text not null unique,
  tasks jsonb not null default '[]',
  mental_status jsonb not null default '{"morning":4,"afternoon":4,"night":4}',
  physical_status text not null default 'good',
  physical_note text not null default '',
  journal text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- User profile
create table if not exists user_profile (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  avatar text not null default '',
  goals jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Projects with kanban cards and milestones
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text not null default '',
  color text not null default '#3b82f6',
  milestones jsonb not null default '[]',
  cards jsonb not null default '[]',
  archived boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Insert a default profile row
insert into user_profile (name) values ('') on conflict do nothing;

-- Enable RLS (disable for simplicity if single-user)
alter table daily_entries enable row level security;
alter table user_profile enable row level security;
alter table projects enable row level security;

-- Allow all operations for anon (single-user app)
create policy "Allow all on daily_entries" on daily_entries for all using (true) with check (true);
create policy "Allow all on user_profile" on user_profile for all using (true) with check (true);
create policy "Allow all on projects" on projects for all using (true) with check (true);
