-- Migration: Add user_id columns to existing tables
-- Run this in Supabase SQL Editor if you already have data from v1 (no user_id)

-- Add user_id to daily_entries
alter table daily_entries add column if not exists user_id uuid;
-- Backfill existing rows with a placeholder UUID (you may want to preserve or reassign later)
-- update daily_entries set user_id = '00000000-0000-0000-0000-000000000000' where user_id is null;
alter table daily_entries alter column user_id set not null;
drop index if exists daily_entries_date_key;
create unique index if not exists daily_entries_user_date_idx on daily_entries(user_id, date);

-- Add user_id to user_profile
alter table user_profile add column if not exists user_id uuid unique;
-- update user_profile set user_id = '00000000-0000-0000-0000-000000000000' where user_id is null;
alter table user_profile alter column user_id set not null;

-- Add user_id to projects
alter table projects add column if not exists user_id uuid;
-- update projects set user_id = '00000000-0000-0000-0000-000000000000' where user_id is null;
alter table projects alter column user_id set not null;

-- Update RLS policies
drop policy if exists "Allow all on daily_entries" on daily_entries;
drop policy if exists "Allow all on user_profile" on user_profile;
drop policy if exists "Allow all on projects" on projects;

create policy "Users manage own entries" on daily_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own profile" on user_profile for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users manage own projects" on projects for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Update foreign keys
alter table daily_entries add constraint if not exists daily_entries_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table user_profile add constraint if not exists user_profile_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
alter table projects add constraint if not exists projects_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;
