-- Fasa 1–2: Pulse dan susulan murid mesti terasing mengikut guru.
-- Jalankan dengan: supabase db query --linked --file supabase/tests/phase1_phase2_rls_assertion.sql
-- Semua data ujian dibuang melalui ROLLBACK.
begin;

do $$
declare
  owner_id uuid;
  test_class_id uuid;
  test_student_id uuid;
  test_pulse_id uuid;
  test_follow_up_id uuid;
  visible_pulses integer;
  visible_follow_ups integer;
begin
  select id into owner_id from public.profiles order by created_at limit 1;
  if owner_id is null then raise exception 'Tiada profil untuk menjalankan ujian RLS'; end if;

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  set local role authenticated;

  insert into public.classes (teacher_id, class_name, subject, year_level)
  values (owner_id, '__ClassPulse QA F1 F2 rollback__', 'QA', 'QA') returning id into test_class_id;
  insert into public.students (class_id, display_name, student_code)
  values (test_class_id, '__QA student__', '__QA__') returning id into test_student_id;
  insert into public.class_pulses (teacher_id, class_id, understanding, engagement, energy_level)
  values (owner_id, test_class_id, 'mixed', 'mixed', 'normal') returning id into test_pulse_id;
  insert into public.student_follow_ups (teacher_id, class_id, student_id, observation)
  values (owner_id, test_class_id, test_student_id, 'Bukti ujian RLS.') returning id into test_follow_up_id;

  perform set_config('request.jwt.claim.sub', '99999999-9999-9999-9999-999999999999', true);
  select count(*) into visible_pulses from public.class_pulses where id = test_pulse_id;
  select count(*) into visible_follow_ups from public.student_follow_ups where id = test_follow_up_id;

  if visible_pulses <> 0 or visible_follow_ups <> 0 then
    raise exception 'Pelanggaran RLS Fasa 1–2: Pulse=% susulan=%', visible_pulses, visible_follow_ups;
  end if;
end
$$;

select 'phase1_phase2_rls_assertions_passed' as result;
rollback;
