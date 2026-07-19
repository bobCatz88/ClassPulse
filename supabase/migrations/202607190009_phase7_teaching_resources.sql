begin;
create table public.teaching_resources (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  lesson_rescue_id uuid not null references public.lesson_rescues(id) on delete cascade,
  resource_type text not null check (resource_type in ('analogy','group_activity','worksheet','differentiated_questions','teacher_script','slide_outline')),
  content jsonb not null default '{}'::jsonb,
  source_note text not null default 'generated_fallback',
  confirmed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(content) = 'object')
);
create index teaching_resources_teacher_class_idx on public.teaching_resources(teacher_id,class_id,created_at desc);
create index teaching_resources_rescue_idx on public.teaching_resources(lesson_rescue_id,created_at desc);
create trigger teaching_resources_set_updated_at before update on public.teaching_resources for each row execute function public.set_updated_at();
alter table public.teaching_resources enable row level security;
create policy "Guru mengurus bahan sendiri" on public.teaching_resources for all to authenticated using ((select auth.uid())=teacher_id) with check ((select auth.uid())=teacher_id and exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=(select auth.uid())) and exists(select 1 from public.lesson_rescues lr join public.reflections r on r.id=lr.reflection_id where lr.id=lesson_rescue_id and r.class_id=class_id and r.teacher_id=(select auth.uid())));
commit;
