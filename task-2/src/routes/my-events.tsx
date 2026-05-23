import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fmtDate } from "@/lib/utils-event";

export const Route = createFileRoute("/my-events")({ component: MyEvents });

type Row = { id: string; slug: string; title: string; start_at: string; end_at: string; timezone: string; host_id: string; hosts: { name: string } | null; role: "host" | "checker" };

function MyEvents() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!loading && !user) nav({ to: "/sign-in", search: { redirect: "/my-events" } });
  }, [user, loading, nav]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: mems } = await supabase.from("host_members").select("host_id,role").eq("user_id", user.id);
      const ids = (mems || []).map(m => m.host_id);
      if (!ids.length) { setRows([]); return; }
      const roleMap = new Map<string, "host" | "checker">();
      (mems || []).forEach((m: { host_id: string; role: "host" | "checker" }) => roleMap.set(m.host_id, m.role));
      const { data } = await supabase.from("events").select("id,slug,title,start_at,end_at,timezone,host_id,hosts(name)").in("host_id", ids).order("start_at", { ascending: false });
      setRows(((data || []) as Array<Omit<Row, "role">>).map(e => ({ ...e, role: roleMap.get(e.host_id) || "checker" })));
    })();
  }, [user]);

  const filtered = rows.filter(r => !q || r.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold">My Events</h1>
      <Input className="mt-4 max-w-sm" placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="mt-4 grid gap-3">
        {filtered.length === 0 ? <p className="text-sm text-muted-foreground">No events.</p> :
          filtered.map(r => (
            <div key={r.id} className="flex items-center justify-between rounded-md border bg-card p-3">
              <div>
                <Link to="/events/$slug" params={{ slug: r.slug }} className="font-medium hover:underline">{r.title}</Link>
                <Badge variant="outline" className="ml-2">{r.role}</Badge>
                <p className="text-xs text-muted-foreground">{fmtDate(r.start_at, r.timezone)} · {r.hosts?.name}</p>
              </div>
              <div className="flex gap-2">
                {r.role === "host" && <Link to="/dashboard/events/$id/edit" params={{ id: r.id }}><Button size="sm" variant="outline">Edit</Button></Link>}
                <Link to="/dashboard/events/$id/check-in" params={{ id: r.id }}><Button size="sm" variant="outline">Check-in</Button></Link>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
