import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtDate, isPast } from "@/lib/utils-event";
import { Badge } from "@/components/ui/badge";


export const Route = createFileRoute("/hosts/$slug")({ component: HostPage });

function HostPage() {
  const { slug } = Route.useParams();
  const [host, setHost] = useState<{ id: string; name: string; bio: string | null; logo_url: string | null } | null>(null);
  const [events, setEvents] = useState<Array<{ id: string; slug: string; title: string; start_at: string; end_at: string; timezone: string; cover_image_url: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: h } = await (supabase as any).from("hosts_public").select("id,name,bio,logo_url").eq("slug", slug).maybeSingle();
      setHost(h || null);
      if (h) {
        const { data: ev } = await supabase.from("events")
          .select("id,slug,title,start_at,end_at,timezone,cover_image_url")
          .eq("host_id", h.id).eq("status", "published").eq("visibility", "public")
          .order("start_at", { ascending: false });
        setEvents(ev || []);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-12 text-muted-foreground">Loading…</div>;
  if (!host) return <div className="mx-auto max-w-4xl px-4 py-12">Host not found.</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-start gap-4">
        {host.logo_url && <img src={host.logo_url} alt={host.name} className="h-16 w-16 rounded-full object-cover" />}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{host.name}</h1>
          {host.bio && <p className="mt-3 text-sm text-foreground/80">{host.bio}</p>}
        </div>
      </div>

      <h2 className="mt-10 mb-4 text-lg font-semibold">Events</h2>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No published events yet.</p>
      ) : (
        <div className="grid gap-3">
          {events.map((e) => {
            const ended = isPast(e.end_at);
            return (
              <Link key={e.id} to="/events/$slug" params={{ slug: e.slug }}
                className="flex items-center gap-4 rounded-md border bg-card p-3 hover:bg-accent">
                <div className="h-16 w-24 shrink-0 overflow-hidden rounded bg-muted">
                  {e.cover_image_url && <img src={e.cover_image_url} className="h-full w-full object-cover" alt=""/>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{e.title}</span>
                    {ended && <Badge variant="secondary">Ended</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">{fmtDate(e.start_at, e.timezone)}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
