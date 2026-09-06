-- Critical fix (claude-review.md §2e): license/subscription status was only
-- checked in the browser (appData_context.tsx) and enforced by a route
-- guard, which anyone can bypass with devtools or by calling the RPCs
-- directly. This enforces the same check at the data layer so a revoked or
-- expired clinic cannot write new records no matter which client, RPC, or
-- future code path is used.
--
-- Read access is intentionally left open so a locked-out clinic can still
-- view/export its existing data.

create or replace function public.assert_active_subscription(p_clinic_id uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_license_id uuid;
  v_revoked boolean;
  v_expires_at timestamptz;
begin
  if p_clinic_id is null then
    return;
  end if;

  select license_id into v_license_id
  from public.clinics
  where id = p_clinic_id;

  -- No license on file: treat as a trial/unmanaged clinic, don't block writes.
  if v_license_id is null then
    return;
  end if;

  select revoked, expires_at into v_revoked, v_expires_at
  from public.licenses
  where id = v_license_id;

  if v_revoked then
    raise exception 'Subscription revoked' using errcode = '42501';
  end if;

  if v_expires_at is not null and v_expires_at <= now() then
    raise exception 'Subscription expired' using errcode = '42501';
  end if;
end;
$function$;

create or replace function public.trg_assert_active_subscription()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  perform public.assert_active_subscription(new.clinic_id);
  return new;
end;
$function$;

create or replace function public.trg_assert_active_subscription_via_prescription()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
begin
  select clinic_id into v_clinic_id
  from public.prescriptions
  where id = new.prescription_id;

  perform public.assert_active_subscription(v_clinic_id);
  return new;
end;
$function$;

create or replace function public.trg_assert_active_subscription_via_patient()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
begin
  select clinic_id into v_clinic_id
  from public.patients
  where id = new.patient_id;

  perform public.assert_active_subscription(v_clinic_id);
  return new;
end;
$function$;

do $$
begin
  if to_regclass('public.clinic_tasks') is not null then
    drop trigger if exists assert_subscription on public.clinic_tasks;
    create trigger assert_subscription
      before insert or update on public.clinic_tasks
      for each row execute function public.trg_assert_active_subscription();
  end if;

  if to_regclass('public.appointments') is not null then
    drop trigger if exists assert_subscription on public.appointments;
    create trigger assert_subscription
      before insert or update on public.appointments
      for each row execute function public.trg_assert_active_subscription();
  end if;

  if to_regclass('public.prescriptions') is not null then
    drop trigger if exists assert_subscription on public.prescriptions;
    create trigger assert_subscription
      before insert or update on public.prescriptions
      for each row execute function public.trg_assert_active_subscription();
  end if;

  if to_regclass('public.prescription_medication_rows') is not null then
    drop trigger if exists assert_subscription on public.prescription_medication_rows;
    create trigger assert_subscription
      before insert or update on public.prescription_medication_rows
      for each row execute function public.trg_assert_active_subscription_via_prescription();
  end if;

  if to_regclass('public.lab_orders') is not null then
    drop trigger if exists assert_subscription on public.lab_orders;
    create trigger assert_subscription
      before insert or update on public.lab_orders
      for each row execute function public.trg_assert_active_subscription();
  end if;

  if to_regclass('public.financial_transactions') is not null then
    drop trigger if exists assert_subscription on public.financial_transactions;
    create trigger assert_subscription
      before insert or update on public.financial_transactions
      for each row execute function public.trg_assert_active_subscription();
  end if;

  if to_regclass('public.payments') is not null then
    drop trigger if exists assert_subscription on public.payments;
    create trigger assert_subscription
      before insert or update on public.payments
      for each row execute function public.trg_assert_active_subscription_via_patient();
  end if;
end $$;

-- NOTE: most write RPCs (rpc_create_appointment, rpc_upsert_prescription,
-- rpc_create_task, ...) insert/update the tables above, so this trigger
-- covers them automatically. Any table not listed here that gets added
-- later needs the same trigger wired up.
