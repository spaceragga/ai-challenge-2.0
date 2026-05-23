
-- ENUMS
CREATE TYPE host_role AS ENUM ('host','checker');
CREATE TYPE event_visibility AS ENUM ('public','unlisted');
CREATE TYPE event_status AS ENUM ('draft','published');
CREATE TYPE event_pricing AS ENUM ('free');
CREATE TYPE rsvp_status AS ENUM ('going','waitlist','cancelled');
CREATE TYPE gallery_status AS ENUM ('pending','approved','rejected');
CREATE TYPE report_target AS ENUM ('event','photo');
CREATE TYPE report_status AS ENUM ('open','hidden');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by all" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- HOSTS
CREATE TABLE public.hosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  bio TEXT,
  contact_email TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.hosts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hosts readable by all" ON public.hosts FOR SELECT USING (true);
CREATE POLICY "auth users create hosts" ON public.hosts FOR INSERT WITH CHECK (auth.uid() = created_by);

-- HOST_MEMBERS
CREATE TABLE public.host_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.hosts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role host_role NOT NULL,
  invited_via_token TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(host_id, user_id)
);
ALTER TABLE public.host_members ENABLE ROW LEVEL SECURITY;

-- Security definer helpers (avoid recursion)
CREATE OR REPLACE FUNCTION public.is_host_member(_host UUID, _user UUID, _role host_role DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.host_members
    WHERE host_id=_host AND user_id=_user
    AND (_role IS NULL OR role=_role OR role='host'));
$$;

CREATE OR REPLACE FUNCTION public.is_host_role(_host UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(SELECT 1 FROM public.host_members
    WHERE host_id=_host AND user_id=_user AND role='host');
$$;

CREATE POLICY "members view own memberships" ON public.host_members FOR SELECT
  USING (user_id = auth.uid() OR public.is_host_role(host_id, auth.uid()));
CREATE POLICY "self insert membership" ON public.host_members FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "host can delete members" ON public.host_members FOR DELETE
  USING (public.is_host_role(host_id, auth.uid()));

-- HOST_INVITE_LINKS
CREATE TABLE public.host_invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.hosts(id) ON DELETE CASCADE,
  role host_role NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.host_invite_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tokens readable by all" ON public.host_invite_links FOR SELECT USING (true);
CREATE POLICY "host create tokens" ON public.host_invite_links FOR INSERT
  WITH CHECK (public.is_host_role(host_id, auth.uid()));
CREATE POLICY "host delete tokens" ON public.host_invite_links FOR DELETE
  USING (public.is_host_role(host_id, auth.uid()));

-- EVENTS
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES public.hosts(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  venue_address TEXT,
  online_link TEXT,
  capacity INT NOT NULL CHECK (capacity > 0),
  visibility event_visibility NOT NULL DEFAULT 'public',
  status event_status NOT NULL DEFAULT 'draft',
  pricing event_pricing NOT NULL DEFAULT 'free',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published events readable by all" ON public.events FOR SELECT
  USING (status='published' OR public.is_host_member(host_id, auth.uid()));
CREATE POLICY "host create events" ON public.events FOR INSERT
  WITH CHECK (public.is_host_role(host_id, auth.uid()));
CREATE POLICY "host update events" ON public.events FOR UPDATE
  USING (public.is_host_role(host_id, auth.uid()));
CREATE POLICY "host delete events" ON public.events FOR DELETE
  USING (public.is_host_role(host_id, auth.uid()));

-- RSVPs
CREATE TABLE public.rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status rsvp_status NOT NULL,
  ticket_code TEXT UNIQUE,
  waitlist_position INT,
  promoted_at TIMESTAMPTZ,
  checked_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX rsvps_active_unique ON public.rsvps(event_id, user_id) WHERE status <> 'cancelled';
ALTER TABLE public.rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users see own rsvps or host sees all" ON public.rsvps FOR SELECT
  USING (user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND public.is_host_member(e.host_id, auth.uid())));
CREATE POLICY "users insert own rsvp" ON public.rsvps FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "users update own rsvp or host updates" ON public.rsvps FOR UPDATE
  USING (user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND public.is_host_member(e.host_id, auth.uid())));

-- CHECK_IN_LOG
CREATE TABLE public.check_in_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  rsvp_id UUID NOT NULL REFERENCES public.rsvps(id) ON DELETE CASCADE,
  ticket_code TEXT NOT NULL,
  scanned_by UUID REFERENCES auth.users(id),
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  undone BOOLEAN NOT NULL DEFAULT false
);
ALTER TABLE public.check_in_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "host members see check_in_log" ON public.check_in_log FOR SELECT
  USING (EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND public.is_host_member(e.host_id, auth.uid())));
CREATE POLICY "host members insert check_in_log" ON public.check_in_log FOR INSERT
  WITH CHECK (EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND public.is_host_member(e.host_id, auth.uid())));
CREATE POLICY "host members update check_in_log" ON public.check_in_log FOR UPDATE
  USING (EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND public.is_host_member(e.host_id, auth.uid())));

-- EVENT_FEEDBACK
CREATE TABLE public.event_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feedback readable by all" ON public.event_feedback FOR SELECT USING (true);
CREATE POLICY "auth user insert own feedback" ON public.event_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- GALLERY_UPLOADS
CREATE TABLE public.gallery_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  status gallery_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.gallery_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved or own or host gallery readable" ON public.gallery_uploads FOR SELECT
  USING (status='approved' OR user_id = auth.uid() OR EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND public.is_host_role(e.host_id, auth.uid())));
CREATE POLICY "users upload own" ON public.gallery_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "host updates gallery" ON public.gallery_uploads FOR UPDATE
  USING (EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id AND public.is_host_role(e.host_id, auth.uid())));

-- REPORTS
CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type report_target NOT NULL,
  target_id UUID NOT NULL,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status report_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth users create reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reporter or any host reads reports" ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id OR EXISTS(SELECT 1 FROM public.host_members WHERE user_id=auth.uid() AND role='host'));
CREATE POLICY "hosts update reports" ON public.reports FOR UPDATE
  USING (EXISTS(SELECT 1 FROM public.host_members WHERE user_id=auth.uid() AND role='host'));

-- AUTO PROFILE TRIGGER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE PLPGSQL AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;$$;
CREATE TRIGGER events_touch BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER rsvps_touch BEFORE UPDATE ON public.rsvps FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- TICKET CODE generator
CREATE OR REPLACE FUNCTION public.gen_ticket_code() RETURNS TEXT LANGUAGE SQL AS $$
  SELECT upper(substring(replace(gen_random_uuid()::text,'-',''), 1, 8));
$$;

-- WAITLIST PROMOTION (callable RPC)
CREATE OR REPLACE FUNCTION public.promote_waitlist(_event_id UUID)
RETURNS VOID LANGUAGE PLPGSQL SECURITY DEFINER SET search_path=public AS $$
DECLARE
  cap INT;
  going_count INT;
  promote_id UUID;
BEGIN
  SELECT capacity INTO cap FROM public.events WHERE id=_event_id;
  LOOP
    SELECT count(*) INTO going_count FROM public.rsvps WHERE event_id=_event_id AND status='going';
    EXIT WHEN going_count >= cap;
    SELECT id INTO promote_id FROM public.rsvps
      WHERE event_id=_event_id AND status='waitlist'
      ORDER BY waitlist_position ASC NULLS LAST, created_at ASC LIMIT 1;
    EXIT WHEN promote_id IS NULL;
    UPDATE public.rsvps SET status='going', ticket_code=public.gen_ticket_code(),
      waitlist_position=NULL, promoted_at=now() WHERE id=promote_id;
  END LOOP;
END;$$;

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES
  ('event-covers','event-covers',true),
  ('host-logos','host-logos',true),
  ('event-gallery','event-gallery',true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public read covers" ON storage.objects FOR SELECT USING (bucket_id IN ('event-covers','host-logos','event-gallery'));
CREATE POLICY "auth upload covers" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id IN ('event-covers','host-logos','event-gallery') AND auth.role()='authenticated'
);
CREATE POLICY "auth update own files" ON storage.objects FOR UPDATE USING (
  bucket_id IN ('event-covers','host-logos','event-gallery') AND auth.uid() = owner
);
CREATE POLICY "auth delete own files" ON storage.objects FOR DELETE USING (
  bucket_id IN ('event-covers','host-logos','event-gallery') AND auth.uid() = owner
);
