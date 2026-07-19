begin;

alter table public.profiles
  add column if not exists preferred_locale text not null default 'ms-MY';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'profiles_preferred_locale_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_preferred_locale_check
      check (preferred_locale in ('ms-MY', 'en'));
  end if;
end;
$$;

alter table public.reflections
  add column if not exists idempotency_key text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'reflections_teacher_idempotency_key_key'
      and conrelid = 'public.reflections'::regclass
  ) then
    alter table public.reflections
      add constraint reflections_teacher_idempotency_key_key
      unique (teacher_id, idempotency_key);
  end if;
end;
$$;

create or replace function public.save_reflection_bundle(
  p_class_id uuid,
  p_transcript text,
  p_subject text,
  p_topic text,
  p_class_summary text,
  p_analysis jsonb,
  p_diagnostic_answers jsonb,
  p_lesson_rescue jsonb,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
  v_reflection_id uuid;
  v_lesson_rescue_id uuid;
  v_created boolean := false;
begin
  if v_teacher_id is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.classes
    where id = p_class_id and teacher_id = v_teacher_id
  ) then
    raise exception 'CLASS_NOT_OWNED' using errcode = '42501';
  end if;

  insert into public.reflections (
    class_id,
    teacher_id,
    transcript,
    subject,
    topic,
    class_summary,
    analysis,
    status,
    idempotency_key
  ) values (
    p_class_id,
    v_teacher_id,
    p_transcript,
    p_subject,
    nullif(p_topic, ''),
    p_class_summary,
    p_analysis,
    'confirmed',
    p_idempotency_key
  )
  on conflict (teacher_id, idempotency_key) do nothing
  returning id into v_reflection_id;

  if v_reflection_id is null then
    select id into v_reflection_id
    from public.reflections
    where teacher_id = v_teacher_id
      and idempotency_key = p_idempotency_key;

    select id into v_lesson_rescue_id
    from public.lesson_rescues
    where reflection_id = v_reflection_id;

    return jsonb_build_object(
      'reflection_id', v_reflection_id,
      'lesson_rescue_id', v_lesson_rescue_id,
      'created', false
    );
  end if;

  v_created := true;

  insert into public.diagnostic_answers (
    reflection_id,
    teacher_id,
    question_id,
    question,
    options,
    answer
  )
  select
    v_reflection_id,
    v_teacher_id,
    item.question_id,
    item.question,
    item.options,
    coalesce(nullif(item.answer, ''), 'Tidak pasti')
  from jsonb_to_recordset(coalesce(p_diagnostic_answers, '[]'::jsonb)) as item(
    question_id text,
    question text,
    options jsonb,
    answer text
  );

  insert into public.lesson_rescues (
    reflection_id,
    teacher_id,
    title,
    duration_minutes,
    target_students,
    objective,
    materials,
    steps,
    alternative_explanation,
    exit_questions,
    confirmed
  ) values (
    v_reflection_id,
    v_teacher_id,
    coalesce(nullif(p_lesson_rescue ->> 'title', ''), 'Lesson Rescue'),
    (p_lesson_rescue ->> 'durationMinutes')::smallint,
    'Berdasarkan refleksi guru',
    p_lesson_rescue ->> 'objective',
    coalesce(p_lesson_rescue -> 'materials', '[]'::jsonb),
    coalesce(p_lesson_rescue -> 'steps', '[]'::jsonb),
    p_lesson_rescue ->> 'alternativeExplanation',
    coalesce(p_lesson_rescue -> 'exitQuestions', '[]'::jsonb),
    true
  ) returning id into v_lesson_rescue_id;

  return jsonb_build_object(
    'reflection_id', v_reflection_id,
    'lesson_rescue_id', v_lesson_rescue_id,
    'created', v_created
  );
end;
$$;

revoke all on function public.save_reflection_bundle(uuid, text, text, text, text, jsonb, jsonb, jsonb, text) from public;
grant execute on function public.save_reflection_bundle(uuid, text, text, text, text, jsonb, jsonb, jsonb, text) to authenticated;

commit;
