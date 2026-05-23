import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/lib/utils-event";
import { MapPin, Globe, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/explore")({
  head: () => ({ meta: [
    { title: "Explore — EventPass" },
    { name: "description", content: "Discover upcoming community events." },
  ]}),
  component: ExplorePage,
});

type EventRow = {
  id: string; slug: string; title: string; description: string | null;
  cover_image_url: string | null; start_at: string; end_at: string;
  timezone: string; venue_address: string | null; online_link: string | null;
  hosts: { name: string; slug: string } | null;
};

function ExplorePage() {
  const [q, setQ] = useState("");
  const [loc, setLoc] = useState("");
  const [includePast, setIncludePast] = useState(false);
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      let query = supabase.from("events")
        .select("id,slug,title,description,cover_image_url,start_at,end_at,timezone,venue_address,online_link,hosts(name,slug)")
        .eq("status", "published").eq("visibility", "public")
        .order("start_at", { ascending: true });
      if (!includePast) query = query.gte("end_at", new Date().toISOString());
      const { data, error } = await query;
      if (!active) return;
      if (error) { console.error(error); setRows([]); }
      else setRows((data as unknown as EventRow[]) || []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [includePast]);

  const filtered = rows.filter((e) => {
    const ql = q.trim().toLowerCase();
    if (ql) {
      const hay = `${e.title} ${e.description ?? ""} ${e.hosts?.name ?? ""}`.toLowerCase();
      if (!hay.includes(ql)) return false;
    }
    const ll = loc.trim().toLowerCase();
    if (ll) {
      const where = `${e.venue_address ?? ""} ${e.online_link ?? ""}`.toLowerCase();
      if (!where.includes(ll)) return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Discover events</h1>
        <p className="mt-1 text-muted-foreground">Free community events. RSVP in one tap.</p>
      </div>
      <div className="mb-6 grid gap-3 md:grid-cols-[1fr_240px_auto]">
        <Input placeholder="Search title, description, host…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Input placeholder="Location" value={loc} onChange={(e) => setLoc(e.target.value)} />
        <div className="flex items-center gap-2 rounded-md border bg-card px-3">
          <Switch id="past" checked={includePast} onCheckedChange={setIncludePast} />
          <Label htmlFor="past" className="cursor-pointer text-sm">Include past</Label>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center">
          <CalendarDays className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No events match your filters.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((e) => {
            const ended = new Date(e.end_at).getTime() < Date.now();
            return (
              <Link key={e.id} to="/events/$slug" params={{ slug: e.slug }}
                className="group overflow-hidden rounded-lg border bg-card transition hover:shadow-md">
                <div className="aspect-[16/9] bg-muted">
                  {e.cover_image_url && (
                    <img src={e.cover_image_url} alt={e.title}
                      className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="line-clamp-2 font-medium leading-snug">{e.title}</h3>
                    {ended && <Badge variant="secondary">Ended</Badge>}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{fmtDate(e.start_at, e.timezone)}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                    {e.venue_address ? <><MapPin className="h-3 w-3"/> <span className="truncate">{e.venue_address}</span></>
                      : <><Globe className="h-3 w-3"/> Online</>}
                  </div>
                  {e.hosts && <p className="mt-2 text-xs text-muted-foreground">by <span className="font-medium text-foreground">{e.hosts.name}</span></p>}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
