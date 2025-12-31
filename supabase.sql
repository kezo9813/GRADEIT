-- Core tables
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('text', 'image', 'video')),
  title text null,
  text_content text null,
  media_path text null,
  media_mime text null,
  video_duration_ms integer null,
  deleted boolean not null default false
);

create table if not exists public.ratings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  value integer not null check (value between 1 and 5),
  comment text null,
  unique (post_id, user_id)
);

-- ensure column exists on rerun
alter table public.ratings add column if not exists comment text;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  full_name text null,
  avatar_path text null
);

create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists handle_updated_at on public.ratings;
create trigger handle_updated_at
before update on public.ratings
for each row execute procedure public.handle_updated_at();

drop trigger if exists handle_updated_at on public.profiles;
create trigger handle_updated_at
before update on public.profiles
for each row execute procedure public.handle_updated_at();

create or replace view public.post_rating_stats as
select
  p.id as post_id,
  avg(r.value)::numeric(10,2) as avg_rating,
  count(r.id)::int as rating_count
from public.posts p
left join public.ratings r on r.post_id = p.id
where not p.deleted
group by p.id;

-- RLS
alter table public.posts enable row level security;
alter table public.ratings enable row level security;
alter table public.profiles enable row level security;

-- drop existing policies to allow rerun without errors
drop policy if exists "Public read posts" on public.posts;
drop policy if exists "Insert own posts" on public.posts;
drop policy if exists "Update own posts" on public.posts;
drop policy if exists "Delete own posts" on public.posts;

drop policy if exists "Public read ratings" on public.ratings;
drop policy if exists "Insert own ratings" on public.ratings;
drop policy if exists "Update own ratings" on public.ratings;
drop policy if exists "Delete own ratings" on public.ratings;

drop policy if exists "Public read profiles" on public.profiles;
drop policy if exists "Insert own profile" on public.profiles;
drop policy if exists "Update own profile" on public.profiles;
drop policy if exists "Delete own profile" on public.profiles;

create policy "Public read posts" on public.posts
for select using (true);

create policy "Insert own posts" on public.posts
for insert with check (auth.uid() = user_id);

create policy "Update own posts" on public.posts
for update using (auth.uid() = user_id);

create policy "Delete own posts" on public.posts
for delete using (auth.uid() = user_id);

create policy "Public read ratings" on public.ratings
for select using (true);

create policy "Insert own ratings" on public.ratings
for insert with check (auth.uid() = user_id);

create policy "Update own ratings" on public.ratings
for update using (auth.uid() = user_id);

create policy "Delete own ratings" on public.ratings
for delete using (auth.uid() = user_id);

create policy "Public read profiles" on public.profiles
for select using (true);

create policy "Insert own profile" on public.profiles
for insert with check (auth.uid() = id);

create policy "Update own profile" on public.profiles
for update using (auth.uid() = id);

create policy "Delete own profile" on public.profiles
for delete using (auth.uid() = id);

-- Storage bucket + policies
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- drop existing storage policies to allow rerun
drop policy if exists "Public read media" on storage.objects;
drop policy if exists "Users can upload to own folder" on storage.objects;
drop policy if exists "Users manage their objects" on storage.objects;
drop policy if exists "Users update metadata" on storage.objects;
drop policy if exists "Public read avatars" on storage.objects;
drop policy if exists "Users can upload avatar to own folder" on storage.objects;
drop policy if exists "Users manage their avatar objects" on storage.objects;
drop policy if exists "Users update avatar metadata" on storage.objects;

create policy "Public read media"
on storage.objects for select
using (bucket_id = 'media');

create policy "Users can upload to own folder"
on storage.objects for insert
with check (
  bucket_id = 'media'
  and auth.uid() = owner
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Users manage their objects"
on storage.objects for delete
using (
  bucket_id = 'media'
  and auth.uid() = owner
  and split_part(name, '/', 1) = auth.uid()::text
);

-- Avatar bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

create policy "Public read avatars"
on storage.objects for select
using (bucket_id = 'avatars');

create policy "Users can upload avatar to own folder"
on storage.objects for insert
with check (
  bucket_id = 'avatars'
  and auth.uid() = owner
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Users manage their avatar objects"
on storage.objects for delete
using (
  bucket_id = 'avatars'
  and auth.uid() = owner
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Users update avatar metadata"
on storage.objects for update
using (
  bucket_id = 'avatars'
  and auth.uid() = owner
  and split_part(name, '/', 1) = auth.uid()::text
);

create policy "Users update metadata"
on storage.objects for update
using (
  bucket_id = 'media'
  and auth.uid() = owner
  and split_part(name, '/', 1) = auth.uid()::text
);
