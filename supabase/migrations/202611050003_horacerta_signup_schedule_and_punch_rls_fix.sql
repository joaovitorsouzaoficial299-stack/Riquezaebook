create or replace function public.hc_register_company(company_name text, company_legal_name text default null, company_cnpj text default null)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  new_company_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'É necessário estar autenticado para cadastrar uma empresa.';
  end if;
  if company_name is null or length(trim(company_name)) < 2 then
    raise exception 'Informe o nome da empresa.';
  end if;
  if exists (
    select 1 from public.hc_memberships
    where user_id = current_user_id and role = 'owner' and active = true
  ) then
    raise exception 'Esta conta já possui uma empresa proprietária.';
  end if;
  insert into public.hc_companies (name, legal_name, cnpj)
  values (trim(company_name), nullif(trim(company_legal_name), ''), nullif(trim(company_cnpj), ''))
  returning id into new_company_id;
  insert into public.hc_memberships (company_id, user_id, role, active)
  values (new_company_id, current_user_id, 'owner', true);
  insert into public.hc_schedules (company_id, name, weekly_hours, rules)
  values (new_company_id, 'Comercial padrão', 44, '{"monday_friday":{"start":"08:00","end":"18:00","break_minutes":60}}'::jsonb);
  return new_company_id;
end;
$$;
revoke all on function public.hc_register_company(text, text, text) from public, anon;
grant execute on function public.hc_register_company(text, text, text) to authenticated;

drop policy if exists hc_punches_insert_authorized on public.hc_punches;
create policy hc_punches_insert_authorized on public.hc_punches for insert to authenticated
with check (
  private.hc_is_company_admin(company_id)
  or exists (
    select 1 from public.hc_employees e
    where e.id = hc_punches.employee_id
      and e.company_id = hc_punches.company_id
      and e.user_id = (select auth.uid())
  )
);