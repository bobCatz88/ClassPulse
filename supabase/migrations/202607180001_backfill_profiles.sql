begin;

insert into public.profiles (id, display_name)
select
  users.id,
  coalesce(
    nullif(users.raw_user_meta_data ->> 'display_name', ''),
    split_part(coalesce(users.email, 'Guru'), '@', 1)
  )
from auth.users as users
on conflict (id) do nothing;

create policy "Guru mencipta profil sendiri" on public.profiles
for insert to authenticated
with check ((select auth.uid()) = id);

commit;

