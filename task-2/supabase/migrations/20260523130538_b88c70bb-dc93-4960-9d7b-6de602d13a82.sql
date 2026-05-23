
DROP VIEW IF EXISTS public.hosts_public;

CREATE VIEW public.hosts_public
WITH (security_invoker = on) AS
  SELECT id, slug, name, bio, logo_url, created_at
  FROM public.hosts;

-- Allow public read of hosts_public via a permissive policy on hosts limited to safe columns:
-- Since security_invoker=on requires SELECT on the underlying table, add a policy allowing
-- everyone to read hosts (the view exposes only safe columns; contact_email is hidden by view shape).
CREATE POLICY "hosts public read via view"
ON public.hosts FOR SELECT
USING (true);

-- But we don't want raw contact_email reads. Replace by revoking column on the table for anon/auth
-- and granting only the safe columns. However simpler: keep policy and revoke SELECT(contact_email).
REVOKE SELECT ON public.hosts FROM anon, authenticated;
GRANT SELECT (id, slug, name, bio, logo_url, created_by, created_at) ON public.hosts TO anon, authenticated;
GRANT SELECT (contact_email) ON public.hosts TO authenticated; -- still column-restricted by additional policy

-- Add a separate policy that only host members may read contact_email column.
-- Postgres doesn't support per-column RLS, so use a dedicated policy with a USING expression
-- that drops the row from non-members would hide all rows. Instead, rely on column-level GRANT:
-- non-members lack privilege to SELECT contact_email, so it's hidden.
REVOKE SELECT (contact_email) ON public.hosts FROM authenticated;
GRANT SELECT (contact_email) ON public.hosts TO authenticated;
-- (we cannot easily limit column to host members via RLS+GRANT; accept that contact_email column
-- privilege is granted to all authenticated, but RLS still requires row visibility — but row policy
-- is permissive 'true', so contact_email is exposed to authenticated. To truly hide it, restrict GRANT.)
REVOKE SELECT (contact_email) ON public.hosts FROM authenticated, anon;
