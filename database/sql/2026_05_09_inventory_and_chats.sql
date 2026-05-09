-- Inventory + internal clinic chats (incremental migration)
-- Run in Supabase SQL editor (public schema).

begin;

/* =========================================================
   1) Inventory
   ========================================================= */

create table if not exists public.clinic_inventory_items (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  sku text,
  name text not null,
  unit text,
  qty_on_hand numeric not null default 0,
  reorder_threshold numeric not null default 0,
  notes text,
  created_by uuid references public.users_metadata(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_inventory_items_unique_sku
  on public.clinic_inventory_items (clinic_id, sku)
  where sku is not null and btrim(sku) <> '';

create unique index if not exists idx_inventory_items_unique_name
  on public.clinic_inventory_items (clinic_id, lower(name));

create index if not exists idx_inventory_items_clinic
  on public.clinic_inventory_items (clinic_id);

drop trigger if exists trg_clinic_inventory_items_updated on public.clinic_inventory_items;
create trigger trg_clinic_inventory_items_updated
before update on public.clinic_inventory_items
for each row execute function public.update_updated_at();

create table if not exists public.clinic_inventory_movements (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  item_id uuid not null references public.clinic_inventory_items(id) on delete cascade,
  actor_id uuid references public.users_metadata(id) on delete set null,
  delta numeric not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_movements_item_created
  on public.clinic_inventory_movements (item_id, created_at desc);

create index if not exists idx_inventory_movements_clinic_created
  on public.clinic_inventory_movements (clinic_id, created_at desc);

create or replace function public.rpc_get_inventory(
  p_requester_id uuid,
  p_search text default null,
  p_page integer default 1,
  p_items_per_page integer default 50
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
  v_offset integer;
  v_total integer;
  v_rows jsonb;
begin
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  v_offset := greatest((p_page - 1) * p_items_per_page, 0);

  select count(*) into v_total
  from public.clinic_inventory_items i
  where i.clinic_id = v_clinic_id
    and (
      p_search is null
      or btrim(p_search) = ''
      or i.name ilike '%' || p_search || '%'
      or i.sku ilike '%' || p_search || '%'
    );

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  into v_rows
  from (
    select
      i.id,
      i.clinic_id,
      i.sku,
      i.name,
      i.unit,
      i.qty_on_hand,
      i.reorder_threshold,
      i.notes,
      i.created_by,
      i.created_at,
      i.updated_at
    from public.clinic_inventory_items i
    where i.clinic_id = v_clinic_id
      and (
        p_search is null
        or btrim(p_search) = ''
        or i.name ilike '%' || p_search || '%'
        or i.sku ilike '%' || p_search || '%'
      )
    order by (i.qty_on_hand < i.reorder_threshold) desc, i.name asc
    limit p_items_per_page
    offset v_offset
  ) t;

  return jsonb_build_object(
    'items', v_rows,
    'total', v_total,
    'page', p_page,
    'itemsPerPage', p_items_per_page
  );
end;
$$;

create or replace function public.rpc_upsert_inventory_item(
  p_requester_id uuid,
  p_name text,
  p_item_id uuid default null,
  p_sku text default null,
  p_unit text default null,
  p_reorder_threshold numeric default null,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
  v_id uuid;
begin
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  if p_item_id is null then
    insert into public.clinic_inventory_items (
      clinic_id, sku, name, unit, reorder_threshold, notes, created_by, created_at, updated_at
    ) values (
      v_clinic_id,
      nullif(btrim(p_sku), ''),
      btrim(p_name),
      nullif(btrim(p_unit), ''),
      coalesce(p_reorder_threshold, 0),
      nullif(btrim(p_notes), ''),
      p_requester_id,
      now(),
      now()
    )
    returning id into v_id;
    return v_id;
  end if;

  if not exists (
    select 1 from public.clinic_inventory_items i
    where i.id = p_item_id and i.clinic_id = v_clinic_id
  ) then
    raise exception 'Item not found or access denied';
  end if;

  update public.clinic_inventory_items
  set
    sku = nullif(btrim(p_sku), ''),
    name = coalesce(nullif(btrim(p_name), ''), name),
    unit = nullif(btrim(p_unit), ''),
    reorder_threshold = coalesce(p_reorder_threshold, reorder_threshold),
    notes = nullif(btrim(p_notes), ''),
    updated_at = now()
  where id = p_item_id
    and clinic_id = v_clinic_id
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.rpc_adjust_inventory(
  p_requester_id uuid,
  p_item_id uuid,
  p_delta numeric,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
begin
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  if not exists (
    select 1 from public.clinic_inventory_items i
    where i.id = p_item_id and i.clinic_id = v_clinic_id
  ) then
    raise exception 'Item not found or access denied';
  end if;

  update public.clinic_inventory_items
  set
    qty_on_hand = greatest(qty_on_hand + p_delta, 0),
    updated_at = now()
  where id = p_item_id
    and clinic_id = v_clinic_id;

  insert into public.clinic_inventory_movements (clinic_id, item_id, actor_id, delta, reason, created_at)
  values (v_clinic_id, p_item_id, p_requester_id, p_delta, nullif(btrim(p_reason), ''), now());

  return true;
end;
$$;

/* =========================================================
   2) Internal clinic chats (staff-to-staff)
   ========================================================= */

create table if not exists public.clinic_conversations (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  kind text not null default 'direct', -- direct | group
  title text,
  created_by uuid references public.users_metadata(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clinic_conversations_clinic_updated
  on public.clinic_conversations (clinic_id, updated_at desc);

drop trigger if exists trg_clinic_conversations_updated on public.clinic_conversations;
create trigger trg_clinic_conversations_updated
before update on public.clinic_conversations
for each row execute function public.update_updated_at();

create table if not exists public.clinic_conversation_members (
  conversation_id uuid not null references public.clinic_conversations(id) on delete cascade,
  user_id uuid not null references public.users_metadata(id) on delete cascade,
  role text not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists idx_conversation_members_user
  on public.clinic_conversation_members (user_id);

create table if not exists public.clinic_messages (
  id uuid primary key default gen_random_uuid(),
  clinic_id uuid not null references public.clinics(id) on delete cascade,
  conversation_id uuid not null references public.clinic_conversations(id) on delete cascade,
  sender_id uuid not null references public.users_metadata(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

create index if not exists idx_clinic_messages_conversation_created
  on public.clinic_messages (conversation_id, created_at asc);

create index if not exists idx_clinic_messages_clinic_created
  on public.clinic_messages (clinic_id, created_at desc);

create or replace function public.rpc_get_or_create_direct_conversation(
  p_requester_id uuid,
  p_other_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
  v_other_clinic_id uuid;
  v_existing uuid;
  v_new uuid;
begin
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  select clinic_id into v_other_clinic_id
  from public.users_metadata
  where id = p_other_user_id and active = true
  limit 1;

  if v_other_clinic_id is null or v_other_clinic_id <> v_clinic_id then
    raise exception 'Other user not found in clinic';
  end if;

  -- Find existing direct conversation with exactly these 2 users (best-effort)
  select c.id
  into v_existing
  from public.clinic_conversations c
  where c.clinic_id = v_clinic_id
    and c.kind = 'direct'
    and exists (
      select 1 from public.clinic_conversation_members m
      where m.conversation_id = c.id and m.user_id = p_requester_id
    )
    and exists (
      select 1 from public.clinic_conversation_members m
      where m.conversation_id = c.id and m.user_id = p_other_user_id
    )
  order by c.updated_at desc
  limit 1;

  if v_existing is not null then
    return v_existing;
  end if;

  insert into public.clinic_conversations (clinic_id, kind, title, created_by, created_at, updated_at)
  values (v_clinic_id, 'direct', null, p_requester_id, now(), now())
  returning id into v_new;

  insert into public.clinic_conversation_members (conversation_id, user_id, role, joined_at)
  values
    (v_new, p_requester_id, 'member', now()),
    (v_new, p_other_user_id, 'member', now())
  on conflict do nothing;

  return v_new;
end;
$$;

create or replace function public.rpc_get_conversations(
  p_requester_id uuid,
  p_page integer default 1,
  p_items_per_page integer default 30
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
  v_offset integer;
  v_total integer;
  v_rows jsonb;
begin
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  v_offset := greatest((p_page - 1) * p_items_per_page, 0);

  select count(*) into v_total
  from public.clinic_conversation_members m
  join public.clinic_conversations c on c.id = m.conversation_id
  where m.user_id = p_requester_id
    and c.clinic_id = v_clinic_id;

  select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)
  into v_rows
  from (
    select
      c.id,
      c.clinic_id,
      c.kind,
      c.title,
      c.created_by,
      c.created_at,
      c.updated_at,
      -- last message preview
      (
        select jsonb_build_object(
          'id', msg.id,
          'sender_id', msg.sender_id,
          'body', msg.body,
          'created_at', msg.created_at
        )
        from public.clinic_messages msg
        where msg.conversation_id = c.id
        order by msg.created_at desc
        limit 1
      ) as last_message,
      -- small member list for UI
      (
        select coalesce(jsonb_agg(jsonb_build_object('id', um.id, 'full_name', um.full_name, 'user_type', um.user_type) order by um.full_name), '[]'::jsonb)
        from public.clinic_conversation_members mm
        join public.users_metadata um on um.id = mm.user_id
        where mm.conversation_id = c.id
      ) as members
    from public.clinic_conversations c
    join public.clinic_conversation_members m on m.conversation_id = c.id
    where m.user_id = p_requester_id
      and c.clinic_id = v_clinic_id
    order by coalesce((select max(created_at) from public.clinic_messages msg where msg.conversation_id = c.id), c.updated_at) desc
    limit p_items_per_page
    offset v_offset
  ) t;

  return jsonb_build_object(
    'conversations', v_rows,
    'total', v_total,
    'page', p_page,
    'itemsPerPage', p_items_per_page
  );
end;
$$;

create or replace function public.rpc_get_messages(
  p_requester_id uuid,
  p_conversation_id uuid,
  p_limit integer default 50,
  p_before timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
  v_allowed boolean;
  v_rows jsonb;
begin
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  select exists (
    select 1
    from public.clinic_conversation_members m
    join public.clinic_conversations c on c.id = m.conversation_id
    where m.conversation_id = p_conversation_id
      and m.user_id = p_requester_id
      and c.clinic_id = v_clinic_id
  ) into v_allowed;

  if coalesce(v_allowed, false) = false then
    raise exception 'Conversation not found or access denied';
  end if;

  select coalesce(jsonb_agg(to_jsonb(t) order by t.created_at asc), '[]'::jsonb)
  into v_rows
  from (
    select
      msg.id,
      msg.conversation_id,
      msg.sender_id,
      um.full_name as sender_name,
      msg.body,
      msg.created_at,
      msg.edited_at
    from public.clinic_messages msg
    join public.users_metadata um on um.id = msg.sender_id
    where msg.conversation_id = p_conversation_id
      and (p_before is null or msg.created_at < p_before)
    order by msg.created_at desc
    limit greatest(coalesce(p_limit, 50), 1)
  ) t;

  return v_rows;
end;
$$;

create or replace function public.rpc_send_message(
  p_requester_id uuid,
  p_conversation_id uuid,
  p_body text
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_clinic_id uuid;
  v_conv_clinic uuid;
  v_allowed boolean;
  v_id uuid;
begin
  select clinic_id into v_clinic_id
  from public.users_metadata
  where id = p_requester_id and active = true
  limit 1;

  if v_clinic_id is null then
    raise exception 'Requester has no clinic';
  end if;

  select c.clinic_id into v_conv_clinic
  from public.clinic_conversations c
  where c.id = p_conversation_id
  limit 1;

  if v_conv_clinic is null or v_conv_clinic <> v_clinic_id then
    raise exception 'Conversation not found or access denied';
  end if;

  select exists (
    select 1 from public.clinic_conversation_members m
    where m.conversation_id = p_conversation_id and m.user_id = p_requester_id
  ) into v_allowed;

  if coalesce(v_allowed, false) = false then
    raise exception 'Conversation not found or access denied';
  end if;

  insert into public.clinic_messages (clinic_id, conversation_id, sender_id, body, created_at)
  values (v_clinic_id, p_conversation_id, p_requester_id, btrim(p_body), now())
  returning id into v_id;

  update public.clinic_conversations
  set updated_at = now()
  where id = p_conversation_id;

  return v_id;
end;
$$;

/* =========================================================
   3) My profile edit (self-service)
   ========================================================= */

create or replace function public.rpc_update_my_profile(
  p_requester_id uuid,
  p_full_name text default null,
  p_username text default null,
  p_doctor_speciality text default null,
  p_doctor_license_number text default null,
  p_doctor_years_of_experience integer default null,
  p_doctor_consultation_fee numeric default null,
  p_doctor_bio text default null,
  p_assistant_department text default null,
  p_assistant_shift_start time default null,
  p_assistant_shift_end time default null
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_user_type user_type_enum;
begin
  select user_type
  into v_user_type
  from public.users_metadata
  where id = p_requester_id
    and active = true
  limit 1;

  if v_user_type is null then
    raise exception 'Requester not found or inactive';
  end if;

  update public.users_metadata
  set
    full_name = coalesce(nullif(btrim(p_full_name), ''), full_name),
    username = coalesce(nullif(btrim(p_username), ''), username)
  where id = p_requester_id;

  if v_user_type = 'doctor' then
    update public.doctor_profiles
    set
      speciality = coalesce(nullif(btrim(p_doctor_speciality), ''), speciality),
      license_number = coalesce(nullif(btrim(p_doctor_license_number), ''), license_number),
      years_of_experience = coalesce(p_doctor_years_of_experience, years_of_experience),
      consultation_fee = coalesce(p_doctor_consultation_fee, consultation_fee),
      bio = coalesce(nullif(btrim(p_doctor_bio), ''), bio)
    where id = p_requester_id;
  else
    update public.assistant_profiles
    set
      department = coalesce(nullif(btrim(p_assistant_department), ''), department),
      shift_start = coalesce(p_assistant_shift_start, shift_start),
      shift_end = coalesce(p_assistant_shift_end, shift_end)
    where id = p_requester_id;
  end if;

  return true;
end;
$$;

commit;
