create or replace function public.rpc_get_patients(
  p_requester_id uuid,
  p_search text default null,
  p_start_date timestamp with time zone default null,
  p_end_date timestamp with time zone default null,
  p_page integer default 1,
  p_items_per_page integer default 50
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
  v_offset integer;
  v_total integer;
  v_rows jsonb;
begin
  if auth.uid() is null or auth.uid() <> p_requester_id then
    raise exception 'Unauthorized requester' using errcode = '42501';
  end if;

  select clinic_id
  into v_clinic_id
  from public.users_metadata
  where id = auth.uid()
    and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic' using errcode = '42501';
  end if;

  v_offset := greatest((greatest(p_page, 1) - 1) * greatest(p_items_per_page, 1), 0);

  select count(*)
  into v_total
  from public.patients p
  where p.clinic_id = v_clinic_id
    and (p_start_date is null or p.created_at >= p_start_date)
    and (p_end_date is null or p.created_at <= p_end_date)
    and (
      nullif(btrim(p_search), '') is null
      or concat_ws(' ', p.first_name, p.last_name, p.code, p.phone) ilike '%' || btrim(p_search) || '%'
    );

  select coalesce(jsonb_agg(to_jsonb(patient_row)), '[]'::jsonb)
  into v_rows
  from (
    select
      p.id,
      p.code,
      p.first_name,
      p.last_name,
      greatest(extract(year from age(current_date, p.date_of_birth))::integer, 0) as age,
      p.sex,
      p.phone,
      p.address_city,
      p.created_at
    from public.patients p
    where p.clinic_id = v_clinic_id
      and (p_start_date is null or p.created_at >= p_start_date)
      and (p_end_date is null or p.created_at <= p_end_date)
      and (
        nullif(btrim(p_search), '') is null
        or concat_ws(' ', p.first_name, p.last_name, p.code, p.phone) ilike '%' || btrim(p_search) || '%'
      )
    order by p.created_at desc
    limit greatest(p_items_per_page, 1)
    offset v_offset
  ) patient_row;

  return jsonb_build_object(
    'patients', v_rows,
    'total', v_total,
    'page', greatest(p_page, 1),
    'itemsPerPage', greatest(p_items_per_page, 1)
  );
end;
$function$;

create or replace function public.rpc_get_payments(p_requester_id uuid)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_clinic_id uuid;
  v_rows jsonb;
begin
  if auth.uid() is null or auth.uid() <> p_requester_id then
    raise exception 'Unauthorized requester' using errcode = '42501';
  end if;

  select clinic_id
  into v_clinic_id
  from public.users_metadata
  where id = auth.uid()
    and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(to_jsonb(payment_row)), '[]'::jsonb)
  into v_rows
  from (
    select
      pay.id,
      pay.amount,
      pay.created_at,
      pay.visit_id,
      pay.patient_id,
      pay.reference,
      pay.method,
      pay.status,
      patient.first_name as patient_first_name,
      patient.last_name as patient_last_name,
      patient.code as patient_code
    from public.payments pay
    join public.patients patient
      on patient.id = pay.patient_id
     and patient.clinic_id = v_clinic_id
    order by pay.created_at desc
  ) payment_row;

  return jsonb_build_object('payments', v_rows);
end;
$function$;

revoke all on function public.rpc_get_patients(uuid, text, timestamp with time zone, timestamp with time zone, integer, integer) from public;
revoke all on function public.rpc_get_payments(uuid) from public;

grant execute on function public.rpc_get_patients(uuid, text, timestamp with time zone, timestamp with time zone, integer, integer) to authenticated;
grant execute on function public.rpc_get_payments(uuid) to authenticated;
