-- ============================================================
-- AI Koučing — Initial Schema
-- ============================================================

-- Profil uživatele (rozšíření auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  age integer not null check (age > 0 and age < 130),
  gender text not null check (gender in ('male', 'female', 'other')),
  life_areas jsonb not null default '[]',
  happiest_moment text not null default '',
  what_friends_say text not null default '',
  what_parents_say text not null default '',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Koučovací sessions
create table public.coaching_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  topic_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Zprávy
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.coaching_sessions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Index pro rychlé načítání zpráv v session
create index messages_session_id_idx on public.messages(session_id, created_at);
create index coaching_sessions_user_id_idx on public.coaching_sessions(user_id, created_at desc);

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger coaching_sessions_updated_at
  before update on public.coaching_sessions
  for each row execute function public.handle_updated_at();

-- Auto-create prázdný profil při registraci
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, age, gender)
  values (new.id, '', 0, 'other');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.coaching_sessions enable row level security;
alter table public.messages enable row level security;

-- Profiles: vidíš jen svůj profil
create policy "profiles: own row" on public.profiles
  for all using (auth.uid() = id);

-- Sessions: vidíš jen své sessions
create policy "sessions: own rows" on public.coaching_sessions
  for all using (auth.uid() = user_id);

-- Messages: vidíš jen zprávy ze svých sessions
create policy "messages: own rows" on public.messages
  for all using (auth.uid() = user_id);
