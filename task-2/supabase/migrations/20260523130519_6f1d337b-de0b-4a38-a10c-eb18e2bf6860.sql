
-- 1. PROFILES: restrict SELECT
DROP POLICY IF EXISTS "profiles readable by all" ON public.profiles;

CREATE OR REPLACE FUNCTION public.is_attendee_of_my_event(_profile uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.rsvps r
    JOIN public.events e ON e.id = r.event_id
    WHERE r.user_id = _profile
      AND public.is_host_member(e.host_id, auth.uid())
  );
$$;

CREATE POLICY "users read own profile or host reads attendee profile"
ON public.profiles FOR SELECT
USING (
  auth.uid() = id
  OR public.is_attendee_of_my_event(id)
);

-- 2. HOSTS: split contact_email via view; restrict base table
DROP POLICY IF EXISTS "hosts readable by all" ON public.hosts;

CREATE POLICY "host members read full host row"
ON public.hosts FOR SELECT
USING (public.is_host_member(id, auth.uid()));

CREATE OR REPLACE VIEW public.hosts_public
WITH (security_invoker = off) AS
  SELECT id, slug, name, bio, logo_url, created_at
  FROM public.hosts;

GRANT SELECT ON public.hosts_public TO anon, authenticated;

-- 3. HOST_INVITE_LINKS: restrict reads to host members; provide secure consume RPC
DROP POLICY IF EXISTS "tokens readable by all" ON public.host_invite_links;

CREATE POLICY "host members read their tokens"
ON public.host_invite_links FOR SELECT
USING (public.is_host_role(host_id, auth.uid()));

CREATE OR REPLACE FUNCTION public.accept_host_invite(_token text)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  link public.host_invite_links%ROWTYPE;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO link FROM public.host_invite_links WHERE token = _token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite';
  END IF;
  IF link.expires_at IS NOT NULL AND link.expires_at < now() THEN
    RAISE EXCEPTION 'Invite expired';
  END IF;

  INSERT INTO public.host_members (host_id, user_id, role, invited_via_token)
  VALUES (link.host_id, uid, link.role, _token)
  ON CONFLICT DO NOTHING;

  RETURN link.host_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_host_invite(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_host_invite(text) TO authenticated;

-- 4. EVENT FEEDBACK
DROP POLICY IF EXISTS "feedback readable by all" ON public.event_feedback;

CREATE POLICY "feedback readable by author or event host"
ON public.event_feedback FOR SELECT
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = event_feedback.event_id
      AND public.is_host_member(e.host_id, auth.uid())
  )
);

-- 5. STORAGE: scope uploads to user folder
DROP POLICY IF EXISTS "auth upload covers" ON storage.objects;
DROP POLICY IF EXISTS "auth update own files" ON storage.objects;
DROP POLICY IF EXISTS "auth delete own files" ON storage.objects;

CREATE POLICY "users upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('event-covers','host-logos','event-gallery')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "users update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id IN ('event-covers','host-logos','event-gallery')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "users delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('event-covers','host-logos','event-gallery')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Function hardening
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.gen_ticket_code()
RETURNS text LANGUAGE sql SET search_path = public
AS $$ SELECT upper(substring(replace(gen_random_uuid()::text,'-',''), 1, 8)); $$;

-- Lock down SECURITY DEFINER helpers (still callable inside RLS regardless of EXECUTE grants)
REVOKE EXECUTE ON FUNCTION public.is_host_member(uuid, uuid, host_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_host_role(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_attendee_of_my_event(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- promote_waitlist may be called from app
REVOKE EXECUTE ON FUNCTION public.promote_waitlist(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.promote_waitlist(uuid) TO authenticated;
