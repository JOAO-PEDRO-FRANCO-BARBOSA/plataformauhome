CREATE OR REPLACE FUNCTION public.activate_property_highlight(p_property_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.properties
  SET featured_until = now() + interval '7 days'
  WHERE id = p_property_id;
END;
$$;

REVOKE ALL ON FUNCTION public.activate_property_highlight(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.activate_property_highlight(uuid) TO service_role;
