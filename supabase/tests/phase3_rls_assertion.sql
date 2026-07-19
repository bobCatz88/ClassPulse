-- Fasa 3: pelaksanaan Lesson Rescue dan Exit Ticket mesti terasing mengikut guru.
begin;

do $$
declare
  owner_id uuid;
  class_id uuid;
  reflection_id uuid;
  rescue_id uuid;
  run_id uuid;
  ticket_id uuid;
  visible_runs integer;
  visible_tickets integer;
begin
  select id into owner_id from public.profiles order by created_at limit 1;
  if owner_id is null then raise exception 'Tiada profil untuk ujian RLS'; end if;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  set local role authenticated;
  insert into public.classes (teacher_id, class_name, subject, year_level) values (owner_id, '__QA F3__', 'QA', 'QA') returning id into class_id;
  insert into public.reflections (teacher_id, class_id, transcript, analysis, status) values (owner_id, class_id, 'Ujian Fasa 3.', '{}'::jsonb, 'confirmed') returning id into reflection_id;
  insert into public.lesson_rescues (teacher_id, reflection_id, title, duration_minutes, objective) values (owner_id, reflection_id, 'QA Rescue', 5, 'Uji RLS') returning id into rescue_id;
  insert into public.lesson_rescue_runs (teacher_id, lesson_rescue_id, class_id) values (owner_id, rescue_id, class_id) returning id into run_id;
  insert into public.exit_tickets (teacher_id, class_id, lesson_rescue_id, question_format, questions, answer_key) values (owner_id, class_id, rescue_id, 'mixed', '[]'::jsonb, '[]'::jsonb) returning id into ticket_id;
  perform set_config('request.jwt.claim.sub', '99999999-9999-9999-9999-999999999999', true);
  select count(*) into visible_runs from public.lesson_rescue_runs where id = run_id;
  select count(*) into visible_tickets from public.exit_tickets where id = ticket_id;
  if visible_runs <> 0 or visible_tickets <> 0 then raise exception 'Pelanggaran RLS F3: run=% ticket=%', visible_runs, visible_tickets; end if;
end
$$;

select 'phase3_rls_assertions_passed' as result;
rollback;
