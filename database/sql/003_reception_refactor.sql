-- Reception refactor (assistant -> reception)
-- Run this in Supabase SQL editor (or migrations) BEFORE switching off demo mode.

-- 1) Keep existing assistant_profiles table, but expose a stable name for the app.
--    This avoids a breaking rename and still allows you to migrate gradually.
create or replace view public.reception_profiles as
select * from public.assistant_profiles;

-- 2) Update roles to the new name
update public.user_roles
set role = 'reception'
where role = 'assistant';

-- Optional: you can also add a CHECK constraint or an enum later.

