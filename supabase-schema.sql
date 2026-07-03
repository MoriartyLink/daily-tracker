-- Daily Tracker - Supabase Schema
-- Run this in your Supabase SQL editor

-- Daily entries (journal, tasks, mental/physical status)
create table if not exists daily_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  date text not null,
  tasks jsonb not null default '[]',
  mental_status jsonb not null default '{"morning":4,"afternoon":4,"night":4}',
  physical_status text not null default 'good',
  physical_note text not null default '',
  mental_note text not null default '',
  best_thing text not null default '',
  proud_things text not null default '',
  lesson_learned text not null default '',
  lesson_change text not null default '',
  excited_about text not null default '',
  journal text not null default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

-- User profile (one per auth user)
create table if not exists user_profile (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade not null,
  name text not null default '',
  email text not null default '',
  avatar text not null default '',
  goals jsonb not null default '[]',
  facts jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Projects with kanban cards and milestones
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null default '',
  description text not null default '',
  color text not null default '#3b82f6',
  milestones jsonb not null default '[]',
  cards jsonb not null default '[]',
  archived boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table daily_entries enable row level security;
alter table user_profile enable row level security;
alter table projects enable row level security;

-- Users can only see/edit their own data
create policy "Users manage own entries" on daily_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own profile" on user_profile for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own projects" on projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
