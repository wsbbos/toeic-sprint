begin;

create table if not exists public.study_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 80),
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{6,10}$'),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.study_groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default '匿名戰友' check (char_length(display_name) between 1 and 80),
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create unique index if not exists study_groups_invite_code_upper_uidx
  on public.study_groups (upper(invite_code));
create index if not exists study_groups_owner_idx on public.study_groups(owner_id);
create index if not exists group_members_user_idx on public.group_members(user_id);
create index if not exists group_members_group_role_idx on public.group_members(group_id, role);

alter table public.study_groups enable row level security;
alter table public.group_members enable row level security;

create or replace function public.is_study_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = auth.uid()
  );
$$;

revoke all on function public.is_study_group_member(uuid) from public;
grant execute on function public.is_study_group_member(uuid) to authenticated;

drop policy if exists "study_groups_read_members" on public.study_groups;
create policy "study_groups_read_members"
on public.study_groups for select to authenticated
using (public.is_study_group_member(id));

drop policy if exists "study_groups_update_owner" on public.study_groups;
create policy "study_groups_update_owner"
on public.study_groups for update to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

drop policy if exists "study_groups_delete_owner" on public.study_groups;
create policy "study_groups_delete_owner"
on public.study_groups for delete to authenticated
using ((select auth.uid()) = owner_id);

drop policy if exists "group_members_read_group" on public.group_members;
create policy "group_members_read_group"
on public.group_members for select to authenticated
using (public.is_study_group_member(group_id));

drop policy if exists "group_members_delete_self_or_owner" on public.group_members;
create policy "group_members_delete_self_or_owner"
on public.group_members for delete to authenticated
using (
  (select auth.uid()) = user_id
  or exists (
    select 1 from public.study_groups sg
    where sg.id = group_id and sg.owner_id = (select auth.uid())
  )
);

create or replace function public.create_study_group(p_name text, p_invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_invite_code text := upper(regexp_replace(trim(coalesce(p_invite_code, '')), '[[:space:]]+', '', 'g'));
  v_group_id uuid;
  v_display_name text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'invalid_group_name' using errcode = '22023';
  end if;
  if v_invite_code !~ '^[A-Z0-9]{6,10}$' then
    raise exception 'invalid_invite_code' using errcode = '22023';
  end if;

  select coalesce(
    nullif(p.username, ''),
    nullif(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1), ''),
    '匿名戰友'
  ) into v_display_name
  from (select 1) seed
  left join public.profiles p on p.id = auth.uid();

  begin
    insert into public.study_groups (name, invite_code, owner_id)
    values (v_name, v_invite_code, auth.uid())
    returning id into v_group_id;
  exception
    when unique_violation then
      return jsonb_build_object('status', 'invite_code_conflict');
  end;

  insert into public.group_members (group_id, user_id, display_name, role)
  values (v_group_id, auth.uid(), coalesce(v_display_name, '匿名戰友'), 'owner');

  return jsonb_build_object(
    'status', 'created',
    'group_id', v_group_id::text,
    'invite_code', v_invite_code
  );
end;
$$;

create or replace function public.join_study_group_by_invite_code(p_invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite_code text := upper(regexp_replace(trim(coalesce(p_invite_code, '')), '[[:space:]]+', '', 'g'));
  v_group_id uuid;
  v_display_name text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if v_invite_code !~ '^[A-Z0-9]{6,10}$' then
    return jsonb_build_object('status', 'not_found');
  end if;

  select sg.id into v_group_id
  from public.study_groups sg
  where upper(sg.invite_code) = v_invite_code
  limit 1;
  if v_group_id is null then
    return jsonb_build_object('status', 'not_found');
  end if;
  if exists (
    select 1 from public.group_members gm
    where gm.group_id = v_group_id and gm.user_id = auth.uid()
  ) then
    return jsonb_build_object('status', 'already_member', 'group_id', v_group_id::text);
  end if;

  select coalesce(
    nullif(p.username, ''),
    nullif(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1), ''),
    '匿名戰友'
  ) into v_display_name
  from (select 1) seed
  left join public.profiles p on p.id = auth.uid();

  begin
    insert into public.group_members (group_id, user_id, display_name, role)
    values (v_group_id, auth.uid(), coalesce(v_display_name, '匿名戰友'), 'member');
  exception
    when unique_violation then
      return jsonb_build_object('status', 'already_member', 'group_id', v_group_id::text);
  end;

  return jsonb_build_object('status', 'joined', 'group_id', v_group_id::text);
end;
$$;

revoke all on public.study_groups, public.group_members from anon;
revoke all on public.study_groups, public.group_members from authenticated;
grant select on public.study_groups, public.group_members to authenticated;

revoke all on function public.create_study_group(text, text) from public;
revoke all on function public.join_study_group_by_invite_code(text) from public;
grant execute on function public.create_study_group(text, text) to authenticated;
grant execute on function public.join_study_group_by_invite_code(text) to authenticated;

commit;