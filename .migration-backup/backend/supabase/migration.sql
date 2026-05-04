-- Machine Gun database schema
-- Run this in your Supabase SQL Editor
-- Supabase Auth handles users automatically — these are app tables only

-- Projects table
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  prompt text not null,
  framework text not null default 'react-vite',
  status text not null default 'initializing',
  preview_url text,
  live_url text,
  sandbox_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Chat messages table
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_projects_user_id on projects(user_id);
create index if not exists idx_projects_created_at on projects(created_at desc);
create index if not exists idx_chat_messages_project_id on chat_messages(project_id);
create index if not exists idx_chat_messages_created_at on chat_messages(created_at);

-- Enable RLS (service role key bypasses it)
alter table projects enable row level security;
alter table chat_messages enable row level security;
