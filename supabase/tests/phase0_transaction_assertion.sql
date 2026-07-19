-- Ujian integrasi tanpa kesan kekal: semua data ujian di-rollback.
begin;

select set_config('request.jwt.claim.sub', id::text, true)
from public.profiles
order by created_at
limit 1;
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

do $$
declare
  v_class_id uuid;
  v_reflection_id uuid;
  v_key text := gen_random_uuid()::text;
  v_first jsonb;
  v_second jsonb;
  v_reflection_count integer;
  v_answer_count integer;
  v_rescue_count integer;
  v_plan jsonb := jsonb_build_object(
    'title', 'Lesson Rescue QA',
    'durationMinutes', 5,
    'objective', 'Mengesahkan transaksi.',
    'materials', jsonb_build_array('Kertas'),
    'steps', jsonb_build_array(jsonb_build_object(
      'title', 'Semak',
      'instruction', 'Semak satu jawapan.',
      'durationMinutes', 5
    )),
    'alternativeExplanation', 'Gunakan contoh tambahan.',
    'exitQuestions', jsonb_build_array('Soalan satu?', 'Soalan dua?')
  );
begin
  insert into public.classes (teacher_id, class_name, year_level, subject)
  values (auth.uid(), '__ClassPulse QA rollback__', 'QA', 'Ujian')
  returning id into v_class_id;

  v_first := public.save_reflection_bundle(
    v_class_id,
    'Murid memerlukan contoh tambahan untuk konsep ujian.',
    'Ujian',
    'Transaksi',
    'Ringkasan ujian transaksi.',
    jsonb_build_object('summary', 'Ringkasan ujian transaksi.'),
    jsonb_build_array(jsonb_build_object(
      'question_id', 'evidence',
      'question', 'Apakah bukti?',
      'options', jsonb_build_array('Latihan', 'Respons lisan'),
      'answer', 'Latihan'
    )),
    v_plan,
    v_key
  );
  v_second := public.save_reflection_bundle(
    v_class_id,
    'Murid memerlukan contoh tambahan untuk konsep ujian.',
    'Ujian',
    'Transaksi',
    'Ringkasan ujian transaksi.',
    jsonb_build_object('summary', 'Ringkasan ujian transaksi.'),
    '[]'::jsonb,
    v_plan,
    v_key
  );

  if v_first ->> 'created' <> 'true' or v_second ->> 'created' <> 'false' then
    raise exception 'Idempotency assertion failed: %, %', v_first, v_second;
  end if;

  v_reflection_id := (v_first ->> 'reflection_id')::uuid;
  select count(*) into v_reflection_count from public.reflections where class_id = v_class_id;
  select count(*) into v_answer_count from public.diagnostic_answers where reflection_id = v_reflection_id;
  select count(*) into v_rescue_count from public.lesson_rescues where reflection_id = v_reflection_id;

  if v_reflection_count <> 1 or v_answer_count <> 1 or v_rescue_count <> 1 then
    raise exception 'Atomic write assertion failed: reflections=%, answers=%, rescues=%', v_reflection_count, v_answer_count, v_rescue_count;
  end if;
end;
$$;

select 'phase0_transaction_assertions_passed' as result;
rollback;
