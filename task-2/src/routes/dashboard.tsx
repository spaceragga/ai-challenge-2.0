import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtDate, isPast } from "@/lib/utils-event";
import { toast } from "sonner";
import { Plus, Copy } from "lucide-react";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

type Ev = {
  id: string; slug: string; title: string; start_at: string; end_at: string; timezone: string;
  status: string; visibility: string; capacity: number; host_id: string;
};

function Dashboard() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [hosts, setHosts] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [activeHost, setActiveHost] = useState<string | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);
  const [stats, setStats] = useState<Record<string, { going: number; waitlist: number; checked: number }>>({});
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");

  useEffect(() => {
    if (!loading && !user) nav({ to: "/sign-in", search: { redirect: "/dashboard" } });
  }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("host_members")
        .select("role,hosts(id,name,slug)").eq("user_id", user.id).eq("role", "host");
      const hs = (data || []).map((m: { hosts: { id: string; name: string; slug: string } }) => m.hosts).filter(Boolean);
      setHosts(hs);
      if (hs.length) setActiveHost(hs[0].id);
    })();
  }, [user]);

  useEffect(() => {
    if (!activeHost) return;
    (async () => {
      const { data } = await supabase.from("events").select("*").eq("host_id", activeHost).order("start_at", { ascending: false });
      const evs = (data || []) as Ev[];
      setEvents(evs);
      const ids = evs.map(e => e.id);
      if (ids.length) {
        const { data: rs } = await supabase.from("rsvps").select("event_id,status,checked_in_at").in("event_id", ids);
        const map: Record<string, { going: number; waitlist: number; checked: number }> = {};
        evs.forEach(e => { map[e.id] = { going: 0, waitlist: 0, checked: 0 }; });
        (rs || []).forEach((r: { event_id: string; status: string; checked_in_at: string | null }) => {
          if (r.status === "going") map[r.event_id].going++;
          if (r.status === "waitlist") map[r.event_id].waitlist++;
          if (r.checked_in_at) map[r.event_id].checked++;
        });
        setStats(map);
      }
    })();
  }, [activeHost]);

  const filtered = events.filter(e => tab === "past" ? isPast(e.end_at) : !isPast(e.end_at));

  const togglePublish = async (e: Ev) => {
    const next = e.status === "published" ? "draft" : "published";
    await supabase.from("events").update({ status: next }).eq("id", e.id);
    setEvents(es => es.map(x => x.id === e.id ? { ...x, status: next } : x));
    toast.success(next === "published" ? "Published" : "Unpublished");
  };

  const duplicate = async (e: Ev) => {
    const { data: full } = await supabase.from("events").select("*").eq("id", e.id).single();
    if (!full) return;
    const { id, created_at, updated_at, ...rest } = full;
    void id; void created_at; void updated_at;
    const newSlug = `${e.slug}-copy-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("events").insert({ ...rest, slug: newSlug, title: `${e.title} (Copy)`, status: "draft" });
    if (error) { toast.error(error.message); return; }
    toast.success("Duplicated");
    const { data } = await supabase.from("events").select("*").eq("host_id", activeHost!).order("start_at", { ascending: false });
    setEvents((data || []) as Ev[]);
  };

  const exportCSV = async (e: Ev) => {
    const { data: rsvps } = await supabase.from("rsvps")
      .select("status,checked_in_at,user_id").eq("event_id", e.id);
    const rows = (rsvps || []) as Array<{ status: string; checked_in_at: string | null; user_id: string }>;
    const userIds = Array.from(new Set(rows.map(r => r.user_id)));
    const { data: profs } = await supabase.from("profiles").select("id,full_name,email").in("id", userIds);
    const pmap = new Map<string, { full_name: string | null; email: string | null }>();
    (profs || []).forEach(p => pmap.set(p.id, { full_name: p.full_name, email: p.email }));
    const header = "name,email,rsvp_status,check_in_time\n";
    const body = rows.map(r => {
      const p = pmap.get(r.user_id);
      const n = (p?.full_name || "").replace(/"/g, '""');
      const em = (p?.email || "").replace(/"/g, '""');
      return `"${n}","${em}","${r.status}","${r.checked_in_at || ""}"`;
    }).join("\n");
    const csv = "\uFEFF" + header + body;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `event-${e.slug}-rsvps.csv`; a.click();
  };

  const generateInvite = async (role: "host" | "checker") => {
    if (!activeHost) return;
    const token = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    const { error } = await supabase.from("host_invite_links").insert({ host_id: activeHost, role, token });
    if (error) { toast.error(error.message); return; }
    const url = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success(`${role} invite link copied`);
  };

  if (!user) return null;
  if (hosts.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold">No host org yet</h1>
        <p className="mt-2 text-muted-foreground">Become a host to create events.</p>
        <Link to="/host/register" className="mt-4 inline-block"><Button>Become a Host</Button></Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Host Dashboard</h1>
          {hosts.length > 1 && (
            <select value={activeHost ?? ""} onChange={(e) => setActiveHost(e.target.value)}
              className="mt-2 rounded-md border bg-background px-2 py-1 text-sm">
              {hosts.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => generateInvite("host")}><Copy className="mr-1 h-3 w-3"/>Invite Host</Button>
          <Button variant="outline" size="sm" onClick={() => generateInvite("checker")}><Copy className="mr-1 h-3 w-3"/>Invite Checker</Button>
          <Link to="/dashboard/review"><Button variant="outline" size="sm">Review</Button></Link>
          <Link to="/dashboard/events/new"><Button size="sm"><Plus className="mr-1 h-4 w-4"/>New event</Button></Link>
        </div>
      </div>

      <div className="mt-6 inline-flex rounded-md border bg-card p-0.5">
        {(["upcoming", "past"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1 text-sm rounded ${tab === t ? "bg-accent" : "text-muted-foreground"}`}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3">
        {filtered.length === 0 ? <p className="text-sm text-muted-foreground">No events.</p> :
        filtered.map(e => {
          const s = stats[e.id] || { going: 0, waitlist: 0, checked: 0 };
          return (
            <div key={e.id} className="rounded-lg border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Link to="/events/$slug" params={{ slug: e.slug }} className="font-medium hover:underline">{e.title}</Link>
                    <Badge variant={e.status === "published" ? "default" : "secondary"}>{e.status}</Badge>
                    {e.visibility === "unlisted" && <Badge variant="outline">Unlisted</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{fmtDate(e.start_at, e.timezone)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Going {s.going} · Waitlist {s.waitlist} · Checked-in {s.checked} / {e.capacity}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to="/dashboard/events/$id/edit" params={{ id: e.id }}><Button variant="outline" size="sm">Edit</Button></Link>
                  <Link to="/dashboard/events/$id/check-in" params={{ id: e.id }}><Button variant="outline" size="sm">Check-in</Button></Link>
                  <Button variant="outline" size="sm" onClick={() => exportCSV(e)}>Export CSV</Button>
                  <Button variant="outline" size="sm" onClick={() => duplicate(e)}>Duplicate</Button>
                  <Button variant="outline" size="sm" onClick={() => togglePublish(e)}>{e.status === "published" ? "Unpublish" : "Publish"}</Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
