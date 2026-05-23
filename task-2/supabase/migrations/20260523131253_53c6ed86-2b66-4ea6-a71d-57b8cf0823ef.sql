
GRANT EXECUTE ON FUNCTION public.is_host_member(uuid, uuid, host_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_host_role(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_attendee_of_my_event(uuid) TO anon, authenticated;
