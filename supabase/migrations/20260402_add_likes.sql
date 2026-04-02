-- ============================================================
-- SQL MIGRATION: ADD POST LIKES / UPVOTES
-- Run this in your Supabase SQL Editor to enable the new feature.
-- ============================================================

-- 1. Create the likes table
create table if not exists public.likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(post_id, user_id) -- Prevent duplicate likes
);

-- 2. Enable Row Level Security
alter table public.likes enable row level security;

-- 3. Define RLS Policies

-- Anyone (including guests) can see like counts
create policy "Likes are viewable by everyone"
  on public.likes for select using (true);

-- Authenticated users can add their own likes
create policy "Authenticated users can like posts"
  on public.likes for insert
  with check (auth.uid() = user_id and auth.uid() is not null);

-- Authenticated users can remove their own likes (unlike)
create policy "Users can unlike their own likes"
  on public.likes for delete
  using (auth.uid() = user_id);

-- ============================================================
-- MIGRATION COMPLETE
-- ============================================================
