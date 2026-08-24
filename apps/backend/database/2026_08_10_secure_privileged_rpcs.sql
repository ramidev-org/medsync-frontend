-- Apply requester identity checks to databases where the original migrations
-- have already run. Fresh databases receive the same checks in source files.
do $migration$
declare
  v_function record;
  v_definition text;
  v_function_count integer := 0;
begin
  for v_function in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and 'p_requester_id' = any(p.proargnames)
      and p.proname = any(array[
        'rpc_get_appointments',
        'rpc_get_tasks',
        'rpc_create_task',
        'rpc_update_task',
        'rpc_get_lab_orders',
        'rpc_get_lab_order',
        'rpc_create_lab_order',
        'rpc_save_lab_results',
        'rpc_get_prescriptions',
        'rpc_upsert_prescription',
        'rpc_create_appointment',
        'rpc_update_appointment',
        'rpc_cancel_appointment',
        'rpc_open_consultation',
        'rpc_close_consultation',
        'rpc_mark_conversation_read',
        'rpc_update_my_profile',
        'rpc_get_conversations',
        'rpc_get_clinic_staff'
      ]::text[])
  loop
    v_function_count := v_function_count + 1;
    v_definition := pg_get_functiondef(v_function.oid);

    if strpos(v_definition, 'auth.uid() <> p_requester_id') = 0 then
      v_definition := regexp_replace(
        v_definition,
        E'\\mbegin\\M',
        E'begin\n  if auth.uid() is null or auth.uid() <> p_requester_id then\n    raise exception ''Unauthorized requester'' using errcode = ''42501'';\n  end if;',
        'i'
      );
      execute v_definition;
    end if;
  end loop;

  if v_function_count <> 19 then
    raise exception 'Expected 19 requester RPCs, found %', v_function_count;
  end if;
end;
$migration$;

-- The follow-up RPC has no requester argument, so authorize directly from the
-- authenticated identity and constrain both the case and assigned doctor.
do $migration$
declare
  v_function_oid oid;
  v_definition text;
begin
  select p.oid
  into v_function_oid
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'rpc_create_followup_consultation'
    and pg_get_function_identity_arguments(p.oid) = 'p_treatment_case_id uuid, p_doctor_id uuid, p_reason_for_visit text, p_session_title text';

  if v_function_oid is null then
    raise exception 'rpc_create_followup_consultation is missing';
  end if;

  v_definition := pg_get_functiondef(v_function_oid);

  if strpos(v_definition, 'Follow-up access denied') = 0
     and strpos(v_definition, 'Treatment case not found or access denied') = 0 then
    v_definition := regexp_replace(
      v_definition,
      E'\\mbegin\\M',
      E'begin\n  if auth.uid() is null or not exists (\n    select 1\n    from public.users_metadata requester\n    join public.treatment_cases treatment_case\n      on treatment_case.id = p_treatment_case_id\n     and treatment_case.clinic_id = requester.clinic_id\n    where requester.id = auth.uid()\n      and requester.active = true\n  ) then\n    raise exception ''Follow-up access denied'' using errcode = ''42501'';\n  end if;\n\n  if p_doctor_id is not null and not exists (\n    select 1\n    from public.users_metadata requester\n    join public.users_metadata doctor\n      on doctor.id = p_doctor_id\n     and doctor.clinic_id = requester.clinic_id\n     and doctor.user_type = ''doctor''::public.user_type_enum\n     and doctor.active = true\n    where requester.id = auth.uid()\n      and requester.active = true\n  ) then\n    raise exception ''Doctor not found or access denied'' using errcode = ''42501'';\n  end if;',
      'i'
    );
    execute v_definition;
  end if;
end;
$migration$;
