-- ============================================================
-- Up! — Schema completo (listo para pegar en el SQL Editor)
-- Tablas: profiles, events · RLS · Buckets de Storage
-- ============================================================

-- ---------- Tablas ----------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  avatar_url text,
  bio text,
  whatsapp text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  description text,
  photo_url text,
  audio_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists events_user_created_idx
  on public.events (user_id, created_at desc);

-- ---------- updated_at automático en profiles ----------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---------- Perfil automático al registrarse ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- RLS: profiles ----------

alter table public.profiles enable row level security;

drop policy if exists "Perfiles: lectura pública" on public.profiles;
create policy "Perfiles: lectura pública"
  on public.profiles for select using (true);

drop policy if exists "Perfiles: crear el propio" on public.profiles;
create policy "Perfiles: crear el propio"
  on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Perfiles: editar el propio" on public.profiles;
create policy "Perfiles: editar el propio"
  on public.profiles for update using (auth.uid() = id);

drop policy if exists "Perfiles: borrar el propio" on public.profiles;
create policy "Perfiles: borrar el propio"
  on public.profiles for delete using (auth.uid() = id);

-- ---------- RLS: events ----------

alter table public.events enable row level security;

drop policy if exists "Eventos: lectura pública" on public.events;
create policy "Eventos: lectura pública"
  on public.events for select using (true);

drop policy if exists "Eventos: crear los propios" on public.events;
create policy "Eventos: crear los propios"
  on public.events for insert with check (auth.uid() = user_id);

drop policy if exists "Eventos: editar los propios" on public.events;
create policy "Eventos: editar los propios"
  on public.events for update using (auth.uid() = user_id);

drop policy if exists "Eventos: borrar los propios" on public.events;
create policy "Eventos: borrar los propios"
  on public.events for delete using (auth.uid() = user_id);

-- ---------- Buckets de Storage (públicos) ----------

insert into storage.buckets (id, name, public)
values
  ('avatars', 'avatars', true),
  ('event-photos', 'event-photos', true),
  ('sets', 'sets', true)
on conflict (id) do nothing;

-- Lectura pública de los tres buckets
drop policy if exists "Storage: lectura pública" on storage.objects;
create policy "Storage: lectura pública"
  on storage.objects for select
  using (bucket_id in ('avatars', 'event-photos', 'sets'));

-- Escritura: solo usuarios autenticados, dentro de su propia carpeta <uid>/
drop policy if exists "Storage: subir archivos propios" on storage.objects;
create policy "Storage: subir archivos propios"
  on storage.objects for insert
  with check (
    bucket_id in ('avatars', 'event-photos', 'sets')
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Storage: actualizar archivos propios" on storage.objects;
create policy "Storage: actualizar archivos propios"
  on storage.objects for update
  using (
    bucket_id in ('avatars', 'event-photos', 'sets')
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Storage: borrar archivos propios" on storage.objects;
create policy "Storage: borrar archivos propios"
  on storage.objects for delete
  using (
    bucket_id in ('avatars', 'event-photos', 'sets')
    and auth.role() = 'authenticated'
    and split_part(name, '/', 1) = auth.uid()::text
  );
