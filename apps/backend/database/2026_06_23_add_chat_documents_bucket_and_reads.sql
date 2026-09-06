-- Apply this in Supabase SQL editor, then refresh the app.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-documents',
  'chat-documents',
  false,
  5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'chat_documents_select'
  ) then
    create policy chat_documents_select
    on storage.objects
    for select
    to authenticated
    using (bucket_id = 'chat-documents');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'chat_documents_insert'
  ) then
    create policy chat_documents_insert
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'chat-documents');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'chat_documents_update'
  ) then
    create policy chat_documents_update
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'chat-documents')
    with check (bucket_id = 'chat-documents');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'chat_documents_delete'
  ) then
    create policy chat_documents_delete
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'chat-documents');
  end if;
end
$$;

create table if not exists public.conversation_reads (
  conversation_id uuid not null references public.clinic_conversations(id) on delete cascade,
  user_id uuid not null references public.users_metadata(id) on delete cascade,
  last_read_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  primary key (conversation_id, user_id)
);

create index if not exists conversation_reads_user_updated_idx
  on public.conversation_reads (user_id, updated_at desc);

create or replace function public.rpc_mark_conversation_read(
  p_requester_id uuid,
  p_conversation_id uuid,
  p_read_at timestamp with time zone default now()
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_membership_exists boolean;
begin
  if auth.uid() is null or auth.uid() <> p_requester_id then
    raise exception 'Unauthorized requester' using errcode = '42501';
  end if;

  select exists(
    select 1
    from public.clinic_conversation_members cm
    where cm.conversation_id = p_conversation_id
      and cm.user_id = p_requester_id
  )
  into v_membership_exists;

  if not v_membership_exists then
    raise exception 'Conversation not found or access denied';
  end if;

  insert into public.conversation_reads (
    conversation_id,
    user_id,
    last_read_at
  )
  values (
    p_conversation_id,
    p_requester_id,
    coalesce(p_read_at, now())
  )
  on conflict (conversation_id, user_id) do update
  set
    last_read_at = greatest(public.conversation_reads.last_read_at, excluded.last_read_at),
    updated_at = now();

  return true;
end;
$function$;
