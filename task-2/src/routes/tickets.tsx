import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fmtDate, buildICS, downloadFile } from "@/lib/utils-event";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Ticket } from "lucide-react";

export const Route = createFileRoute("/tickets")({ component: Tickets });

function Tickets() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Array<{
    id: string; ticket_code: string;
    events: { id: string; slug: string; title: string; start_at: string; end_at: string; timezone: string; venue_address: string | null; online_link: string | null; description: string | null };
  }>>([]);

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/sign-in", search: { redirect: "/tickets" } }); return; }
    (async () => {
      const { data } = await supabase.from("rsvps")
        .select("id,ticket_code,events(id,slug,title,start_at,end_at,timezone,venue_address,online_link,description)")
        .eq("user_id", user.id).eq("status", "going").gte("events.end_at", new Date().toISOString());
      setRows((data as never) || []);
    })();
  }, [user, loading, nav]);

  if (!user) return null;
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">My Tickets</h1>
      {rows.length === 0 ? (
        <div className="mt-8 rounded-lg border bg-card p-12 text-center">
          <Ticket className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No upcoming tickets.</p>
          <Link to="/explore" className="mt-2 inline-block text-sm underline">Browse events</Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4">
          {rows.filter(r => r.events).map((r) => (
            <div key={r.id} className="rounded-lg border bg-card p-5">
              <div className="flex items-start gap-4">
                <div className="rounded-md border bg-background p-2"><QRCodeSVG value={r.ticket_code} size={100} /></div>
                <div className="flex-1">
                  <Link to="/events/$slug" params={{ slug: r.events.slug }} className="font-semibold hover:underline">{r.events.title}</Link>
                  <p className="text-xs text-muted-foreground">{fmtDate(r.events.start_at, r.events.timezone)}</p>
                  <p className="text-xs text-muted-foreground">{r.events.venue_address || r.events.online_link}</p>
                  <div className="mt-2 font-mono text-sm tracking-wider">{r.ticket_code}</div>
                  <Button size="sm" variant="outline" className="mt-2"
                    onClick={() => {
                      const ics = buildICS({ uid: r.events.id, title: r.events.title,
                        description: r.events.description ?? undefined,
                        start: r.events.start_at, end: r.events.end_at,
                        location: r.events.venue_address ?? r.events.online_link ?? undefined });
                      downloadFile(`${r.events.slug}.ics`, ics, "text/calendar");
                    }}>Add to Calendar</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
