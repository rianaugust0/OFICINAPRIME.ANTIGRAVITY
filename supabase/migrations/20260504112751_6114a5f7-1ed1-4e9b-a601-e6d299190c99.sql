REVOKE EXECUTE ON FUNCTION public.enqueue_automation(uuid, public.automation_kind, jsonb, int) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.retry_automation(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.dequeue_automations(int, int) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.complete_automation(uuid, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fail_automation(uuid, bigint, text) FROM PUBLIC, anon, authenticated;