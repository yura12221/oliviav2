
-- Enable needed extension
create extension if not exists pgcrypto;

-- PROFILES: kapcsolódik az auth.users-hez
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text check (role in ('service','editor','admin')) default 'editor',
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- Csak a saját profil írása/olvasása szükséges általában.
create policy "read own or all profiles (authenticated)"
  on public.profiles for select
  to authenticated
  using (true);

create policy "insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- KENNELS: rács + felső/alsó
create table if not exists public.kennels (
  id serial primary key,
  code text unique not null,
  row int not null,
  col int not null,
  is_upper boolean not null default false
);
alter table public.kennels enable row level security;

create policy "kennels read (auth)"
  on public.kennels for select
  to authenticated
  using (true);

create policy "kennels write (auth)"
  on public.kennels for all
  to authenticated
  using (true)
  with check (true);

-- DOGS: egyszerű hozzárendelés kennelhez
create table if not exists public.dogs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  chip text,
  board_color text default '#e2e8f0',
  kennel_id int references public.kennels(id) on delete set null,
  filters text[] default '{}',
  created_at timestamptz default now()
);
alter table public.dogs enable row level security;

create policy "dogs read (auth)"
  on public.dogs for select
  to authenticated
  using (true);

create policy "dogs write (auth)"
  on public.dogs for all
  to authenticated
  using (true)
  with check (true);

-- MINTA KENNELEK (4x4), A1..D4, felső/alsó felváltva
insert into public.kennels (code, row, col, is_upper) values
  ('A1',1,1,true), ('A2',1,2,false), ('A3',1,3,true), ('A4',1,4,false),
  ('B1',2,1,false),('B2',2,2,true), ('B3',2,3,false),('B4',2,4,true),
  ('C1',3,1,true), ('C2',3,2,false),('C3',3,3,true), ('C4',3,4,false),
  ('D1',4,1,false),('D2',4,2,true), ('D3',4,3,false),('D4',4,4,true)
on conflict (code) do nothing;
