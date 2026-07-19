begin;
create table public.teaching_insights (
  id uuid primary key default gen_random_uuid(), teacher_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  insight_type text not null, title text not null, description text not null,
  evidence_refs jsonb not null default '[]'::jsonb, confidence text not null default 'medium' check (confidence in ('high','medium','low')),
  status text not null default 'proposed' check (status in ('proposed','accepted','dismissed')),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (jsonb_typeof(evidence_refs) = 'array')
);
create index teaching_insights_teacher_class_idx on public.teaching_insights(teacher_id,class_id,created_at desc);
create trigger teaching_insights_set_updated_at before update on public.teaching_insights for each row execute function public.set_updated_at();
alter table public.teaching_insights enable row level security;
create policy "Guru mengurus insight sendiri" on public.teaching_insights for all to authenticated using ((select auth.uid())=teacher_id) with check ((select auth.uid())=teacher_id and exists(select 1 from public.classes c where c.id=class_id and c.teacher_id=(select auth.uid())));
commit;
