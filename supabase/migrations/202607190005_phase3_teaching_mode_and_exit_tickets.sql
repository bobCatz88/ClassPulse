-- Fasa 3: pelaksanaan Lesson Rescue dan Exit Ticket yang disahkan guru.
begin;

create table public.lesson_rescue_runs (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  lesson_rescue_id uuid not null references public.lesson_rescues(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  status text not null default 'running' check (status in ('running', 'completed', 'abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  current_step smallint not null default 0 check (current_step >= 0),
  completed_steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (completed_at is null or status in ('completed', 'abandoned'))
);

create table public.exit_tickets (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  lesson_rescue_id uuid references public.lesson_rescues(id) on delete set null,
  question_format text not null check (question_format in ('objective', 'short', 'mixed')),
  questions jsonb not null default '[]'::jsonb,
  answer_key jsonb not null default '[]'::jsonb,
  year_level text,
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(questions) = 'array'),
  check (jsonb_typeof(answer_key) = 'array')
);

create index lesson_rescue_runs_teacher_started_idx on public.lesson_rescue_runs (teacher_id, started_at desc);
create index lesson_rescue_runs_rescue_idx on public.lesson_rescue_runs (lesson_rescue_id, status);
create index exit_tickets_teacher_created_idx on public.exit_tickets (teacher_id, created_at desc);
create index exit_tickets_class_idx on public.exit_tickets (class_id, created_at desc);

create trigger lesson_rescue_runs_set_updated_at before update on public.lesson_rescue_runs
for each row execute function public.set_updated_at();
create trigger exit_tickets_set_updated_at before update on public.exit_tickets
for each row execute function public.set_updated_at();

alter table public.lesson_rescue_runs enable row level security;
alter table public.exit_tickets enable row level security;

create policy "Guru mengurus pelaksanaan Lesson Rescue sendiri" on public.lesson_rescue_runs
for all to authenticated using ((select auth.uid()) = teacher_id)
with check (
  (select auth.uid()) = teacher_id
  and exists (select 1 from public.lesson_rescues lr where lr.id = lesson_rescue_id and lr.teacher_id = (select auth.uid()))
  and exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = (select auth.uid()))
);

create policy "Guru mengurus Exit Ticket sendiri" on public.exit_tickets
for all to authenticated using ((select auth.uid()) = teacher_id)
with check (
  (select auth.uid()) = teacher_id
  and exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = (select auth.uid()))
  and (lesson_rescue_id is null or exists (select 1 from public.lesson_rescues lr where lr.id = lesson_rescue_id and lr.teacher_id = (select auth.uid())))
);

commit;
