-- Safely join a study group by invite code without exposing study_groups rows to non-members.
create or replace function public.join_study_group_by_invite_code(p_invite_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invite_code text := upper(regexp_replace(trim(coalesce(p_invite_code, '')), '[[:space:]]+', '', 'g'));
  v_group_id public.study_groups.id%type;
  v_display_name text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select sg.id
    into v_group_id
  from public.study_groups sg
  where upper(regexp_replace(trim(coalesce(sg.invite_code, '')), '[[:space:]]+', '', 'g')) = v_invite_code
  limit 1;

  if v_group_id is null then
    return jsonb_build_object('status', 'not_found');
  end if;

  if exists (
    select 1
    from public.group_members gm
    where gm.group_id = v_group_id
      and gm.user_id = auth.uid()
  ) then
    return jsonb_build_object(
      'status', 'already_member',
      'group_id', v_group_id::text
    );
  end if;

  select nullif(p.username, '')
    into v_display_name
  from public.profiles p
  where p.id = auth.uid()
  limit 1;

  begin
    insert into public.group_members (group_id, user_id, display_name, role)
    values (
      v_group_id,
      auth.uid(),
      coalesce(v_display_name, nullif(split_part(coalesce(auth.jwt() ->> 'email', ''), '@', 1), ''), '匿名戰友'),
      'member'
    );
  exception
    when unique_violation then
      return jsonb_build_object(
        'status', 'already_member',
        'group_id', v_group_id::text
      );
  end;

  return jsonb_build_object(
    'status', 'joined',
    'group_id', v_group_id::text
  );
end;
$$;

revoke all on function public.join_study_group_by_invite_code(text) from public;
grant execute on function public.join_study_group_by_invite_code(text) to authenticated;