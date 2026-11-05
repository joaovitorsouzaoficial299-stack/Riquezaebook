drop policy if exists hc_punches_insert_authorized on public.hc_punches;
create policy hc_punches_insert_authorized on public.hc_punches for insert to authenticated
with check (
  exists (
    select 1
    from public.hc_employees e
    where e.id = hc_punches.employee_id
      and e.company_id = hc_punches.company_id
      and (
        private.hc_is_company_admin(hc_punches.company_id)
        or e.user_id = (select auth.uid())
      )
  )
);