-- ============================================================
-- WeCollab Admin Profile Persistence — Migration
-- ============================================================

-- Create profiles table if it does not exist
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  company text,
  role text,
  bio text,
  location text,
  updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Policies for profiles
drop policy if exists "Allow select for authenticated users" on public.profiles;
create policy "Allow select for authenticated users" on public.profiles
  for select to authenticated using (true);

drop policy if exists "Allow insert for users matching their own id" on public.profiles;
create policy "Allow insert for users matching their own id" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

drop policy if exists "Allow update for users matching their own id" on public.profiles;
create policy "Allow update for users matching their own id" on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- Ensure storage.buckets and storage.objects exists and register the avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies for avatars bucket
drop policy if exists "Public Access to Avatars" on storage.objects;
create policy "Public Access to Avatars" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "Authenticated Users Upload Avatars" on storage.objects;
create policy "Authenticated Users Upload Avatars" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'avatars' and 
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users Update Own Avatars" on storage.objects;
create policy "Users Update Own Avatars" on storage.objects
  for update to authenticated using (
    bucket_id = 'avatars' and 
    (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users Delete Own Avatars" on storage.objects;
create policy "Users Delete Own Avatars" on storage.objects
  for delete to authenticated using (
    bucket_id = 'avatars' and 
    (storage.foldername(name))[1] = auth.uid()::text
  );
