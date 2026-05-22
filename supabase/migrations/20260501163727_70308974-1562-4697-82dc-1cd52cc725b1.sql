
-- Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.is_workshop_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_workshop_role(uuid, uuid, public.workshop_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.is_workshop_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_workshop_role(uuid, uuid, public.workshop_role) TO authenticated;
