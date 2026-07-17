begin;

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Guru',
  school_name text,
  primary_subject text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_name text not null check (char_length(class_name) between 1 and 80),
  year_level text not null check (char_length(year_level) between 1 and 40),
  subject text not null check (char_length(subject) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 100),
  student_code text check (student_code is null or char_length(student_code) <= 40),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, student_code)
);

create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  transcript text not null check (char_length(transcript) between 1 and 20000),
  subject text,
  topic text,
  class_summary text,
  analysis jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'confirmed')),
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.diagnostic_answers (
  id uuid primary key default gen_random_uuid(),
  reflection_id uuid not null references public.reflections(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null,
  question text not null,
  options jsonb not null default '[]'::jsonb,
  answer text,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reflection_id, question_id)
);

create table public.lesson_rescues (
  id uuid primary key default gen_random_uuid(),
  reflection_id uuid not null unique references public.reflections(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  duration_minutes smallint not null check (duration_minutes in (5, 10, 15)),
  target_students text,
  objective text not null,
  materials jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  alternative_explanation text,
  analogy text,
  exit_questions jsonb not null default '[]'::jsonb,
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.intervention_outcomes (
  id uuid primary key default gen_random_uuid(),
  lesson_rescue_id uuid not null references public.lesson_rescues(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  outcome text not null check (outcome in ('successful', 'partly_successful', 'unsuccessful', 'not_implemented')),
  notes text check (notes is null or char_length(notes) <= 4000),
  remaining_student_count integer check (remaining_student_count is null or remaining_student_count >= 0),
  intervention_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index classes_teacher_id_idx on public.classes(teacher_id);
create index students_class_id_idx on public.students(class_id);
create index reflections_teacher_recorded_idx on public.reflections(teacher_id, recorded_at desc);
create index reflections_class_id_idx on public.reflections(class_id);
create index diagnostic_answers_reflection_id_idx on public.diagnostic_answers(reflection_id);
create index lesson_rescues_teacher_id_idx on public.lesson_rescues(teacher_id);
create index intervention_outcomes_rescue_id_idx on public.intervention_outcomes(lesson_rescue_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(coalesce(new.email, 'Guru'), '@', 1))
  );
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger classes_set_updated_at before update on public.classes
for each row execute function public.set_updated_at();
create trigger students_set_updated_at before update on public.students
for each row execute function public.set_updated_at();
create trigger reflections_set_updated_at before update on public.reflections
for each row execute function public.set_updated_at();
create trigger diagnostic_answers_set_updated_at before update on public.diagnostic_answers
for each row execute function public.set_updated_at();
create trigger lesson_rescues_set_updated_at before update on public.lesson_rescues
for each row execute function public.set_updated_at();
create trigger intervention_outcomes_set_updated_at before update on public.intervention_outcomes
for each row execute function public.set_updated_at();

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.students enable row level security;
alter table public.reflections enable row level security;
alter table public.diagnostic_answers enable row level security;
alter table public.lesson_rescues enable row level security;
alter table public.intervention_outcomes enable row level security;

create policy "Guru melihat profil sendiri" on public.profiles
for select to authenticated using ((select auth.uid()) = id);
create policy "Guru mengemas kini profil sendiri" on public.profiles
for update to authenticated using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Guru mengurus kelas sendiri" on public.classes
for all to authenticated using ((select auth.uid()) = teacher_id)
with check ((select auth.uid()) = teacher_id);

create policy "Guru melihat murid kelas sendiri" on public.students
for select to authenticated using (
  exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = (select auth.uid()))
);
create policy "Guru menambah murid kelas sendiri" on public.students
for insert to authenticated with check (
  exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = (select auth.uid()))
);
create policy "Guru mengemas kini murid kelas sendiri" on public.students
for update to authenticated using (
  exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = (select auth.uid()))
) with check (
  exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = (select auth.uid()))
);
create policy "Guru memadam murid kelas sendiri" on public.students
for delete to authenticated using (
  exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = (select auth.uid()))
);

create policy "Guru melihat refleksi sendiri" on public.reflections
for select to authenticated using ((select auth.uid()) = teacher_id);
create policy "Guru menambah refleksi kelas sendiri" on public.reflections
for insert to authenticated with check (
  (select auth.uid()) = teacher_id and
  exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = (select auth.uid()))
);
create policy "Guru mengemas kini refleksi sendiri" on public.reflections
for update to authenticated using ((select auth.uid()) = teacher_id)
with check (
  (select auth.uid()) = teacher_id and
  exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = (select auth.uid()))
);
create policy "Guru memadam refleksi sendiri" on public.reflections
for delete to authenticated using ((select auth.uid()) = teacher_id);

create policy "Guru mengurus jawapan diagnostik sendiri" on public.diagnostic_answers
for all to authenticated using ((select auth.uid()) = teacher_id)
with check (
  (select auth.uid()) = teacher_id and
  exists (select 1 from public.reflections r where r.id = reflection_id and r.teacher_id = (select auth.uid()))
);

create policy "Guru mengurus Lesson Rescue sendiri" on public.lesson_rescues
for all to authenticated using ((select auth.uid()) = teacher_id)
with check (
  (select auth.uid()) = teacher_id and
  exists (select 1 from public.reflections r where r.id = reflection_id and r.teacher_id = (select auth.uid()))
);

create policy "Guru mengurus hasil intervensi sendiri" on public.intervention_outcomes
for all to authenticated using ((select auth.uid()) = teacher_id)
with check (
  (select auth.uid()) = teacher_id and
  exists (select 1 from public.lesson_rescues lr where lr.id = lesson_rescue_id and lr.teacher_id = (select auth.uid()))
);

commit;
