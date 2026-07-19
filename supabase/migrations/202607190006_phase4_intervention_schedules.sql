-- Fasa 4: agenda intervensi dan peringatan dalam aplikasi.
begin;

create table public.intervention_schedules (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  lesson_rescue_id uuid not null references public.lesson_rescues(id) on delete cascade,
  scheduled_for timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'skipped')),
  reminder_at timestamptz,
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index intervention_schedules_teacher_time_idx on public.intervention_schedules (teacher_id, scheduled_for);
create index intervention_schedules_rescue_idx on public.intervention_schedules (lesson_rescue_id, status);
create trigger intervention_schedules_set_updated_at before update on public.intervention_schedules for each row execute function public.set_updated_at();
alter table public.intervention_schedules enable row level security;
create policy "Guru mengurus jadual intervensi sendiri" on public.intervention_schedules
for all to authenticated using ((select auth.uid()) = teacher_id)
with check (
  (select auth.uid()) = teacher_id
  and exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = (select auth.uid()))
  and exists (select 1 from public.lesson_rescues lr where lr.id = lesson_rescue_id and lr.teacher_id = (select auth.uid()))
);

commit;
