-- Webhook idempotency table
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, event_id)
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role only webhook events" ON public.webhook_events;
CREATE POLICY "Service role only webhook events"
  ON public.webhook_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Prevent privilege escalation through profiles.role by authenticated users
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF TG_OP = 'INSERT' THEN
      NEW.role := 'user';
    ELSIF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'role cannot be changed by authenticated users';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_role();
