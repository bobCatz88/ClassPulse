begin;
do $$ declare owner_id uuid; class_id uuid; insight_id uuid; visible integer; begin
select id into owner_id from public.profiles order by created_at limit 1; if owner_id is null then raise exception 'Tiada profil'; end if;
perform set_config('request.jwt.claim.sub', owner_id::text, true); set local role authenticated;
insert into public.classes (teacher_id,class_name,subject,year_level) values (owner_id,'__QA F5__','QA','QA') returning id into class_id;
insert into public.teaching_insights (teacher_id,class_id,insight_type,title,description,evidence_refs,confidence,status) values (owner_id,class_id,'qa','corak qa','Tiga bukti QA','["a","b","c"]'::jsonb,'medium','proposed') returning id into insight_id;
perform set_config('request.jwt.claim.sub','99999999-9999-9999-9999-999999999999',true); select count(*) into visible from public.teaching_insights where id=insight_id; if visible<>0 then raise exception 'Pelanggaran RLS F5'; end if;
end $$;
select 'phase5_rls_assertions_passed' as result; rollback;
