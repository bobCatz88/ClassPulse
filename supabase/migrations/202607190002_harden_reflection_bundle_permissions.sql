-- Fasa 0: Supabase memberikan EXECUTE kepada beberapa peranan secara lalai.
-- Hanya pengguna yang telah disahkan atau servis backend boleh memanggil RPC ini.
begin;

revoke all on function public.save_reflection_bundle(uuid, text, text, text, text, jsonb, jsonb, jsonb, text) from public;
revoke all on function public.save_reflection_bundle(uuid, text, text, text, text, jsonb, jsonb, jsonb, text) from anon;

grant execute on function public.save_reflection_bundle(uuid, text, text, text, text, jsonb, jsonb, jsonb, text) to authenticated;
grant execute on function public.save_reflection_bundle(uuid, text, text, text, text, jsonb, jsonb, jsonb, text) to service_role;

commit;
