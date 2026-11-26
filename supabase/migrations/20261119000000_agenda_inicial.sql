-- Roles
create type public.app_role as enum ('admin', 'banda');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  instrument text,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select, insert, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "Own profile readable" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Own profile editable" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy "Own profile insert" on public.profiles for insert to authenticated
  with check (id = auth.uid());

create policy "Read own roles or admin reads all" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "Admin grants roles" on public.user_roles for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin removes roles" on public.user_roles for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- New user: create profile; the very first account becomes the admin (the singer)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));

  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Events
create type public.event_status as enum ('pre_reserva', 'aguardando_pagamento', 'confirmado', 'cancelado');

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  event_date date not null,
  start_time time,
  soundcheck_time time,
  congregation text not null default '',
  address text not null default '',
  city text not null default '',
  status public.event_status not null default 'pre_reserva',
  band_notes text not null default '',
  confirmed_at timestamptz,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.events to authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;

create policy "Admin reads all events, band reads confirmed" on public.events for select to authenticated
  using (public.has_role(auth.uid(), 'admin') or (status = 'confirmado' and public.has_role(auth.uid(), 'banda')));
create policy "Admin creates events" on public.events for insert to authenticated
  with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin updates events" on public.events for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "Admin deletes events" on public.events for delete to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();
create index events_date_idx on public.events (event_date);

-- Private booking data: contractor contact and money, admin only
create table public.event_private (
  event_id uuid primary key references public.events(id) on delete cascade,
  contractor_name text not null default '',
  contractor_phone text not null default '',
  fee numeric(10,2),
  deposit numeric(10,2),
  deposit_paid boolean not null default false,
  admin_notes text not null default '',
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.event_private to authenticated;
grant all on public.event_private to service_role;
alter table public.event_private enable row level security;
create policy "Admin manages private booking data" on public.event_private for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger event_private_touch before update on public.event_private
  for each row execute function public.touch_updated_at();

-- Public link page settings (single row)
create table public.public_profile (
  id smallint primary key default 1 check (id = 1),
  artist_name text not null default 'Jessica Norma',
  tagline text not null default 'Cantora evangélica',
  whatsapp text not null default '',
  booking_message text not null default 'Olá, Jessica! Gostaria de verificar disponibilidade de agenda para a nossa igreja.',
  instagram text not null default '',
  youtube text not null default '',
  spotify text not null default '',
  updated_at timestamptz not null default now()
);
grant select on public.public_profile to anon;
grant select, update on public.public_profile to authenticated;
grant all on public.public_profile to service_role;
alter table public.public_profile enable row level security;
create policy "Anyone reads public profile" on public.public_profile for select to anon, authenticated using (true);
create policy "Admin edits public profile" on public.public_profile for update to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger public_profile_touch before update on public.public_profile
  for each row execute function public.touch_updated_at();

insert into public.public_profile (id) values (1);