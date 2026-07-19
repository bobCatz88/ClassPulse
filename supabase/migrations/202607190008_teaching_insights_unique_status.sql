create unique index if not exists teaching_insights_teacher_class_type_title_key
on public.teaching_insights(teacher_id, class_id, insight_type, title);
