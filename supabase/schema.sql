-- ============================================================
-- Hivon Blogs Platform - Supabase Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- Extends Supabase auth.users with profile & role
-- ============================================================
create table if not exists public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null unique,
  role text not null default 'viewer' check (role in ('author', 'viewer', 'admin')),
  created_at timestamptz default now()
);

-- ============================================================
-- POSTS TABLE
-- ============================================================
create table if not exists public.posts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  body text not null,
  image_url text,
  author_id uuid references public.users(id) on delete cascade not null,
  summary text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- COMMENTS TABLE
-- ============================================================
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  comment_text text not null,
  created_at timestamptz default now()
);

-- ============================================================
-- AUTO-UPDATE updated_at ON POSTS
-- ============================================================
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_posts_updated_at on public.posts;
create trigger update_posts_updated_at
  before update on public.posts
  for each row execute function update_updated_at_column();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;

-- ---- USERS policies ----
-- Anyone can view user profiles (needed for author names on posts)
create policy "Users are viewable by everyone"
  on public.users for select using (true);

-- Users can only insert their own profile
create policy "Users can insert own profile"
  on public.users for insert with check (auth.uid() = id);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

-- ---- POSTS policies ----
-- Everyone (including anon) can read posts
create policy "Posts are viewable by everyone"
  on public.posts for select using (true);

-- Authors and admins can insert posts
create policy "Authors can create posts"
  on public.posts for insert
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.users
      where id = auth.uid()
      and role in ('author', 'admin')
    )
  );

-- Authors can update their own posts; admins can update any post
create policy "Authors update own posts, admins update all"
  on public.posts for update
  using (
    auth.uid() = author_id
    or exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Only admins can delete posts (legacy) or Authors can delete their own posts
create policy "Admins can delete any post, authors delete own"
  on public.posts for delete
  using (
    auth.uid() = author_id
    or exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- ---- COMMENTS policies ----
-- Everyone can read comments
create policy "Comments are viewable by everyone"
  on public.comments for select using (true);

-- Authenticated users can insert comments
create policy "Authenticated users can comment"
  on public.comments for insert
  with check (auth.uid() = user_id and auth.uid() is not null);

-- Users can delete their own comments; admins can delete any
create policy "Users delete own comments, admins delete all"
  on public.comments for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );


-- ============================================================
-- LIKES TABLE
-- ============================================================
create table if not exists public.likes (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(post_id, user_id) -- Prevent duplicate likes
);

alter table public.likes enable row level security;

-- Everyone can read likes (needed for counts)
create policy "Likes are viewable by everyone"
  on public.likes for select using (true);

-- Authenticated users can insert their own likes
create policy "Authenticated users can like posts"
  on public.likes for insert
  with check (auth.uid() = user_id and auth.uid() is not null);

-- Users can unlike (delete their own likes)
create policy "Users can unlike their own likes"
  on public.likes for delete
  using (auth.uid() = user_id);

-- ============================================================
-- SAMPLE ADMIN USER ... (rest of the file)
-- ============================================================
