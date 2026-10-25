-- Applied as 20261024222830: the dashboard's automatic-RLS trigger needs no client execution rights.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
