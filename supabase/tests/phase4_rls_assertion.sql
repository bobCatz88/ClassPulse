begin;
do $$ declare owner_id uuid; class_id uuid; reflection_id uuid; rescue_id uuid; schedule_id uuid; visible integer; begin
select id into owner_id from public.profiles order by created_at limit 1; if owner_id is null then raise exception 'Tiada profil'; end if;
perform set_config('request.jwt.claim.sub', owner_id::text, true); set local role authenticated;
insert into public.classes (teacher_id,class_name,subject,year_level) values (owner_id,'__QA F4__','QA','QA') returning id into class_id;
insert into public.reflections (teacher_id,class_id,transcript,analysis,status) values (owner_id,class_id,'Ujian F4.','{}'::jsonb,'confirmed') returning id into reflection_id;
insert into public.lesson_rescues (teacher_id,reflection_id,title,duration_minutes,objective) values (owner_id,reflection_id,'QA',5,'QA') returning id into rescue_id;
insert into public.intervention_schedules (teacher_id,class_id,lesson_rescue_id,scheduled_for) values (owner_id,class_id,rescue_id,now()) returning id into schedule_id;
perform set_config('request.jwt.claim.sub','99999999-9999-9999-9999-999999999999',true); select count(*) into visible from public.intervention_schedules where id=schedule_id; if visible<>0 then raise exception 'Pelanggaran RLS F4'; end if;
end $$;
select 'phase4_rls_assertions_passed' as result; rollback;
