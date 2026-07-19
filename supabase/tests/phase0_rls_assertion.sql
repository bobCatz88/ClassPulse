-- Fasa 0: buktikan pengguna lain tidak boleh melihat atau mengubah kelas pemilik.
-- Jalankan dengan: supabase db query --linked --file supabase/tests/phase0_rls_assertion.sql
-- Semua data ujian dibuang melalui ROLLBACK.
begin;

do $$
declare
  owner_id uuid;
  test_class_id uuid;
  visible_count integer;
  updated_count integer;
begin
  select id into owner_id from public.profiles order by created_at limit 1;

  if owner_id is null then
    raise exception 'Tiada profil untuk menjalankan ujian RLS';
  end if;

  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  set local role authenticated;

  insert into public.classes (teacher_id, class_name, subject, year_level)
  values (owner_id, '__ClassPulse QA RLS rollback__', 'QA', 'QA')
  returning id into test_class_id;

  -- Bertukar kepada identiti pengguna lain tanpa menulis sebarang data kekal.
  perform set_config('request.jwt.claim.sub', '99999999-9999-9999-9999-999999999999', true);

  select count(*) into visible_count
  from public.classes
  where id = test_class_id;

  if visible_count <> 0 then
    raise exception 'Pelanggaran RLS: pengguna lain boleh melihat kelas pemilik';
  end if;

  update public.classes
  set subject = 'Tidak sepatutnya dikemas kini'
  where id = test_class_id;
  get diagnostics updated_count = row_count;

  if updated_count <> 0 then
    raise exception 'Pelanggaran RLS: pengguna lain boleh mengemas kini kelas pemilik';
  end if;
end
$$;

select 'phase0_rls_assertions_passed' as result;
rollback;
