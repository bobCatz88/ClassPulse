-- Fasa 2: pemerhatian susulan murid tanpa label negatif.
begin;

create table public.student_follow_ups (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  reflection_id uuid references public.reflections(id) on delete set null,
  observation text not null check (char_length(observation) between 1 and 1000),
  evidence text check (evidence is null or char_length(evidence) <= 1000),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'needs_attention' check (status in ('needs_attention', 'monitoring', 'improving', 'resolved')),
  due_date date,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (resolved_at is null or status = 'resolved')
);

create index student_follow_ups_teacher_status_idx on public.student_follow_ups (teacher_id, status, due_date);
create index student_follow_ups_class_idx on public.student_follow_ups (class_id, updated_at desc);

create trigger student_follow_ups_set_updated_at
before update on public.student_follow_ups
for each row execute function public.set_updated_at();

alter table public.student_follow_ups enable row level security;

create policy "Guru mengurus susulan murid sendiri" on public.student_follow_ups
  for all to authenticated
  using ((select auth.uid()) = teacher_id)
  with check (
    (select auth.uid()) = teacher_id
    and exists (
      select 1 from public.students s
      join public.classes c on c.id = s.class_id
      where s.id = student_id and s.class_id = class_id and c.teacher_id = (select auth.uid())
    )
  );

commit;
