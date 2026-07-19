-- Ujian ini mensimulasikan guru berdaftar, kemudian rollback semua perubahan.
begin;

select set_config('request.jwt.claim.sub', id::text, true)
from public.profiles
order by created_at
limit 1;
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

with
  test_key as (
    select gen_random_uuid()::text as value
  ),
  test_class as (
    insert into public.classes (teacher_id, class_name, year_level, subject)
    values (auth.uid(), '__ClassPulse QA rollback__', 'QA', 'Ujian')
    returning id
  ),
  first_save as (
    select public.save_reflection_bundle(
      test_class.id,
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
      jsonb_build_object(
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
      ),
      test_key.value
    ) as result,
    test_class.id as class_id,
    test_key.value as key
    from test_class, test_key
  ),
  second_save as (
    select public.save_reflection_bundle(
      first_save.class_id,
      'Murid memerlukan contoh tambahan untuk konsep ujian.',
      'Ujian',
      'Transaksi',
      'Ringkasan ujian transaksi.',
      jsonb_build_object('summary', 'Ringkasan ujian transaksi.'),
      '[]'::jsonb,
      jsonb_build_object(
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
      ),
      first_save.key
    ) as result,
    first_save.class_id
    from first_save
  )
select
  first_save.result ->> 'created' as first_created,
  second_save.result ->> 'created' as second_created,
  (select count(*) from public.reflections where class_id = first_save.class_id) as reflection_count,
  (select count(*) from public.diagnostic_answers where reflection_id = (first_save.result ->> 'reflection_id')::uuid) as answer_count,
  (select count(*) from public.lesson_rescues where reflection_id = (first_save.result ->> 'reflection_id')::uuid) as rescue_count
from first_save, second_save;

rollback;
