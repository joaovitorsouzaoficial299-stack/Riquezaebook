-- HoraCerta core schema
-- Additive migration: does not alter or delete the legacy Doces da Gi tables.
create table if not exists public.hc_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  cnpj text,
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hc_companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','hr','manager','employee','terminal')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(company_id,user_id)
);

create table if not exists public.hc_schedules (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hc_companies(id) on delete cascade,
  name text not null,
  weekly_hours numeric(6,2),
  rules jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hc_employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hc_companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  registration_code text not null,
  full_name text not null,
  email text,
  phone text,
  job_title text,
  department text,
  hire_date date,
  status text not null default 'active' check (status in ('active','inactive','on_leave')),
  schedule_id uuid references public.hc_schedules(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id,registration_code)
);

-- Store only the provider reference, never raw face images/templates in this table.
create table if not exists public.hc_face_profiles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hc_companies(id) on delete cascade,
  employee_id uuid not null references public.hc_employees(id) on delete cascade,
  provider text not null,
  provider_subject_ref text not null,
  enrolled_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active','revoked')),
  created_at timestamptz not null default now(),
  unique(company_id,employee_id)
);

-- Punches are append-only for normal application roles: no UPDATE/DELETE grant or policy.
create table if not exists public.hc_punches (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.hc_companies(id) on delete cascade,
  employee_id uuid not null references public.hc_employees(id) on delete restrict,
  punch_type text not null check (punch_type in ('entry','break_start','break_end','exit')),
  occurred_at timestamptz not null,
  received_at timestamptz not null default now(),
  source text not null default 'terminal' check (source in ('terminal','employee_portal','admin_adjustment','import')),
  device_id text,
  provider_event_ref text,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists hc_memberships_user_company_idx on public.hc_memberships(user_id,company_id) where active;
create index if not exists hc_employees_company_status_idx on public.hc_employees(company_id,status);
create index if not exists hc_employees_user_idx on public.hc_employees(user_id);
create index if not exists hc_employees_schedule_idx on public.hc_employees(schedule_id);
create index if not exists hc_face_profiles_employee_idx on public.hc_face_profiles(employee_id);
create index if not exists hc_punches_company_time_idx on public.hc_punches(company_id,occurred_at desc);
create index if not exists hc_punches_employee_time_idx on public.hc_punches(employee_id,occurred_at desc);
create index if not exists hc_punches_created_by_idx on public.hc_punches(created_by);
create index if not exists hc_schedules_company_idx on public.hc_schedules(company_id);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.hc_is_company_member(target_company uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.hc_memberships m
    where m.company_id = target_company and m.user_id = (select auth.uid()) and m.active = true
  );
$$;

create or replace function private.hc_is_company_admin(target_company uuid)
returns boolean language sql stable security definer
set search_path = pg_catalog, public
as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.hc_memberships m
    where m.company_id = target_company and m.user_id = (select auth.uid())
      and m.active = true and m.role in ('owner','admin','hr','manager')
  );
$$;

revoke all on function private.hc_is_company_member(uuid) from public, anon;
revoke all on function private.hc_is_company_admin(uuid) from public, anon;
grant execute on function private.hc_is_company_member(uuid) to authenticated;
grant execute on function private.hc_is_company_admin(uuid) to authenticated;

alter table public.hc_companies enable row level security;
alter table public.hc_memberships enable row level security;
alter table public.hc_employees enable row level security;
alter table public.hc_schedules enable row level security;
alter table public.hc_face_profiles enable row level security;
alter table public.hc_punches enable row level security;

drop policy if exists hc_company_read_member on public.hc_companies;
create policy hc_company_read_member on public.hc_companies for select to authenticated
using (private.hc_is_company_member(id));
drop policy if exists hc_company_update_admin on public.hc_companies;
create policy hc_company_update_admin on public.hc_companies for update to authenticated
using (private.hc_is_company_admin(id)) with check (private.hc_is_company_admin(id));

drop policy if exists hc_membership_read_self on public.hc_memberships;
create policy hc_membership_read_self on public.hc_memberships for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists hc_employees_read_company_or_self on public.hc_employees;
create policy hc_employees_read_company_or_self on public.hc_employees for select to authenticated
using (private.hc_is_company_member(company_id) or user_id = (select auth.uid()));
drop policy if exists hc_employees_insert_admin on public.hc_employees;
create policy hc_employees_insert_admin on public.hc_employees for insert to authenticated
with check (private.hc_is_company_admin(company_id));
drop policy if exists hc_employees_update_admin on public.hc_employees;
create policy hc_employees_update_admin on public.hc_employees for update to authenticated
using (private.hc_is_company_admin(company_id)) with check (private.hc_is_company_admin(company_id));

drop policy if exists hc_schedules_read_company on public.hc_schedules;
create policy hc_schedules_read_company on public.hc_schedules for select to authenticated
using (private.hc_is_company_member(company_id));
drop policy if exists hc_schedules_insert_admin on public.hc_schedules;
create policy hc_schedules_insert_admin on public.hc_schedules for insert to authenticated
with check (private.hc_is_company_admin(company_id));
drop policy if exists hc_schedules_update_admin on public.hc_schedules;
create policy hc_schedules_update_admin on public.hc_schedules for update to authenticated
using (private.hc_is_company_admin(company_id)) with check (private.hc_is_company_admin(company_id));
drop policy if exists hc_schedules_delete_admin on public.hc_schedules;
create policy hc_schedules_delete_admin on public.hc_schedules for delete to authenticated
using (private.hc_is_company_admin(company_id));

drop policy if exists hc_face_profiles_read_limited on public.hc_face_profiles;
create policy hc_face_profiles_read_limited on public.hc_face_profiles for select to authenticated
using (private.hc_is_company_admin(company_id) or exists (
  select 1 from public.hc_employees e where e.id = employee_id and e.user_id = (select auth.uid())
));
drop policy if exists hc_face_profiles_insert_admin on public.hc_face_profiles;
create policy hc_face_profiles_insert_admin on public.hc_face_profiles for insert to authenticated
with check (private.hc_is_company_admin(company_id));
drop policy if exists hc_face_profiles_update_admin on public.hc_face_profiles;
create policy hc_face_profiles_update_admin on public.hc_face_profiles for update to authenticated
using (private.hc_is_company_admin(company_id)) with check (private.hc_is_company_admin(company_id));
drop policy if exists hc_face_profiles_delete_admin on public.hc_face_profiles;
create policy hc_face_profiles_delete_admin on public.hc_face_profiles for delete to authenticated
using (private.hc_is_company_admin(company_id));

drop policy if exists hc_punches_read_company_or_self on public.hc_punches;
create policy hc_punches_read_company_or_self on public.hc_punches for select to authenticated
using (private.hc_is_company_member(company_id) or exists (
  select 1 from public.hc_employees e where e.id = employee_id and e.user_id = (select auth.uid())
));
drop policy if exists hc_punches_insert_authorized on public.hc_punches;
create policy hc_punches_insert_authorized on public.hc_punches for insert to authenticated
with check (private.hc_is_company_admin(company_id) or exists (
  select 1 from public.hc_employees e
  where e.id = employee_id and e.company_id = company_id and e.user_id = (select auth.uid())
));

grant select, update on public.hc_companies to authenticated;
grant select on public.hc_memberships to authenticated;
grant select, insert, update on public.hc_employees to authenticated;
grant select, insert, update, delete on public.hc_schedules to authenticated;
grant select, insert, update, delete on public.hc_face_profiles to authenticated;
grant select, insert on public.hc_punches to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'hc_punches') then
    alter publication supabase_realtime add table public.hc_punches;
  end if;
end $$;
