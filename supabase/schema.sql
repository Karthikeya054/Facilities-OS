-- Atrium Facilities OS — Supabase Schema
-- Run this in your Supabase SQL editor to create the tables

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Universities / campuses
create table if not exists universities (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name text not null,
  city text not null,
  students int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Users / team members
create table if not exists team_members (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text unique not null,
  role text not null check (role in ('Admin', 'Approver', 'Procurement Lead', 'Finance Reviewer', 'Requester')),
  campus_access text default 'All campuses',
  initials text,
  status text default 'offline',
  twofa boolean default false,
  avatar_url text,
  joined_at timestamptz default now(),
  last_active timestamptz default now()
);

-- Vendors
create table if not exists vendors (
  id uuid primary key default uuid_generate_v4(),
  vendor_code text unique not null,
  name text not null,
  category text not null,
  contact_name text,
  phone text,
  email text,
  city text,
  rating numeric(3,1) default 0,
  total_jobs int default 0,
  is_preferred boolean default false,
  created_at timestamptz default now()
);

-- Requirements (procurement requests)
create table if not exists requirements (
  id uuid primary key default uuid_generate_v4(),
  req_code text unique not null, -- e.g. REQ-1000
  title text not null,
  university_id uuid references universities(id),
  requester_id uuid references team_members(id),
  approver_id uuid references team_members(id),
  priority text check (priority in ('low', 'medium', 'high', 'urgent')),
  status text default 'received',
  stage_idx int default 0,
  budget numeric(12,2) default 0,
  quoted numeric(12,2),
  actual numeric(12,2),
  required_by date,
  description text,
  source text default 'UniConnect',
  vendor_id uuid references vendors(id),
  submitted_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Line items for requirements
create table if not exists line_items (
  id uuid primary key default uuid_generate_v4(),
  requirement_id uuid references requirements(id) on delete cascade,
  item_type text not null,
  qty int not null default 1,
  unit_price numeric(10,2) not null default 0,
  material text,
  sizes jsonb, -- { S: 40, M: 75, ... }
  dimensions text,
  branding text,
  sort_order int default 0
);

-- Activity log
create table if not exists activity_log (
  id uuid primary key default uuid_generate_v4(),
  requirement_id uuid references requirements(id) on delete cascade,
  actor text not null,
  action text not null,
  detail text,
  created_at timestamptz default now()
);

-- Approval chain
create table if not exists approval_steps (
  id uuid primary key default uuid_generate_v4(),
  requirement_id uuid references requirements(id) on delete cascade,
  step_order int not null,
  approver_id uuid references team_members(id),
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  approved_at timestamptz,
  notes text
);

-- Pending invites
create table if not exists invites (
  id uuid primary key default uuid_generate_v4(),
  email text not null,
  role text not null,
  campus_access text,
  invited_by uuid references team_members(id),
  message text,
  sent_at timestamptz default now(),
  accepted_at timestamptz
);

-- Settings (key-value store per workspace)
create table if not exists settings (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Row Level Security
alter table universities enable row level security;
alter table team_members enable row level security;
alter table vendors enable row level security;
alter table requirements enable row level security;
alter table line_items enable row level security;
alter table activity_log enable row level security;
alter table approval_steps enable row level security;
alter table invites enable row level security;
alter table settings enable row level security;

-- Policies: allow authenticated read for all tables (simplified for MVP)
create policy "Allow authenticated read" on universities for select using (true);
create policy "Allow authenticated read" on team_members for select using (true);
create policy "Allow authenticated read" on vendors for select using (true);
create policy "Allow authenticated read" on requirements for select using (true);
create policy "Allow authenticated read" on line_items for select using (true);
create policy "Allow authenticated read" on activity_log for select using (true);
create policy "Allow authenticated read" on approval_steps for select using (true);
create policy "Allow authenticated read" on invites for select using (true);
create policy "Allow authenticated read" on settings for select using (true);

-- Allow service role full access (handled by default)
