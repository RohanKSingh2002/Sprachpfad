-- Applied to Sprachpfad as migration 20261024222701.
-- No changes to existing learning content or auth provider settings.
begin;

create table public.learner_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null default '{}'::jsonb,
  revision bigint not null default 0 check (revision >= 0),
  last_write_id uuid,
  updated_at timestamptz not null default now(),
  constraint learner_progress_object check (jsonb_typeof(state) = 'object'),
  constraint learner_progress_size check (octet_length(state::text) <= 1048576)
);

alter table public.learner_progress enable row level security;
revoke all on table public.learner_progress from public, anon, authenticated;
grant select on table public.learner_progress to authenticated;

create policy "Learners read only their own progress"
  on public.learner_progress for select to authenticated
  using ((select auth.uid()) = user_id);

-- All writes go through this transaction. The caller cannot choose another learner,
-- bypass the revision check, or run arbitrary SQL through this function.
create function public.save_learning_progress(
  owner_id uuid, expected_revision bigint, progress jsonb, write_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  learner uuid := auth.uid();
  current_save public.learner_progress%rowtype;
begin
  if learner is null or owner_id is null or learner <> owner_id then
    raise exception 'Sign in to the matching account' using errcode = '42501';
  end if;
  if write_id is null or expected_revision is null or expected_revision < 0
     or progress is null or jsonb_typeof(progress) <> 'object'
     or octet_length(progress::text) > 1048576 then
    raise exception 'Invalid progress save' using errcode = '22023';
  end if;
  if not (progress ?& array['lessons','known','review','days','tests','courseChecks','coursePace','coursePlans'])
     or jsonb_typeof(progress->'known') <> 'array'
     or jsonb_typeof(progress->'lessons') <> 'object'
     or jsonb_typeof(progress->'review') <> 'object'
     or jsonb_typeof(progress->'days') <> 'object'
     or jsonb_typeof(progress->'tests') <> 'object'
     or jsonb_typeof(progress->'courseChecks') <> 'object'
     or jsonb_typeof(progress->'coursePace') <> 'object'
     or jsonb_typeof(progress->'coursePlans') <> 'object' then
    raise exception 'Invalid progress structure' using errcode = '22023';
  end if;

  insert into public.learner_progress(user_id) values (learner)
    on conflict (user_id) do nothing;
  select * into current_save from public.learner_progress
    where user_id = learner for update;

  -- A response may have been lost after a successful commit. Repeating that write is safe.
  if current_save.last_write_id = write_id then
    return jsonb_build_object('ok', true, 'revision', current_save.revision,
      'state', current_save.state, 'last_write_id', current_save.last_write_id);
  end if;
  if current_save.revision <> expected_revision then
    return jsonb_build_object('ok', false, 'revision', current_save.revision,
      'state', current_save.state, 'last_write_id', current_save.last_write_id);
  end if;

  update public.learner_progress
    set state = progress, revision = revision + 1, last_write_id = write_id, updated_at = now()
    where user_id = learner returning * into current_save;
  return jsonb_build_object('ok', true, 'revision', current_save.revision,
    'state', current_save.state, 'last_write_id', current_save.last_write_id);
end;
$$;

revoke all on function public.save_learning_progress(uuid, bigint, jsonb, uuid) from public, anon, authenticated;
grant execute on function public.save_learning_progress(uuid, bigint, jsonb, uuid) to authenticated;

comment on table public.learner_progress is 'Private learning progress; read with RLS, write through the revision-checked function.';
notify pgrst, 'reload schema';
commit;
