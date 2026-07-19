-- Fasa 1: rekod Pulse kelas dan pilihan sasaran mingguan guru.
begin;

alter table public.profiles
  add column if not exists timezone text not null default 'Asia/Kuala_Lumpur',
  add column if not exists weekly_reflection_goal smallint not null default 3;

alter table public.profiles
  drop constraint if exists profiles_weekly_reflection_goal_check,
  add constraint profiles_weekly_reflection_goal_check check (weekly_reflection_goal in (3, 5, 7));

create table if not exists public.class_pulses (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  reflection_id uuid references public.reflections(id) on delete set null,
  understanding text not null check (understanding in ('strong', 'mixed', 'needs_support')),
  engagement text not null check (engagement in ('high', 'mixed', 'low')),
  energy_level text not null check (energy_level in ('high', 'normal', 'low')),
  note text check (note is null or char_length(note) <= 500),
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists class_pulses_teacher_observed_idx on public.class_pulses (teacher_id, observed_at desc);
create index if not exists class_pulses_class_observed_idx on public.class_pulses (class_id, observed_at desc);

create trigger class_pulses_set_updated_at
before update on public.class_pulses
for each row execute function public.set_updated_at();

alter table public.class_pulses enable row level security;

create policy "Guru mengurus Pulse sendiri" on public.class_pulses
  for all to authenticated
  using ((select auth.uid()) = teacher_id)
  with check (
    (select auth.uid()) = teacher_id
    and exists (select 1 from public.classes where id = class_id and teacher_id = (select auth.uid()))
  );

commit;
