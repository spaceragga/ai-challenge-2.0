import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard_/events/$id/check-in")({ component: CheckIn });

function CheckIn() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState<{ title: string; capacity: number } | null>(null);
  const [code, setCode] = useState("");
  const [counts, setCounts] = useState({ going: 0, checked: 0 });
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    const { data: e } = await supabase.from("events").select("title,capacity").eq("id", id).single();
    setEvent(e);
    const { data: rs } = await supabase.from("rsvps").select("status,checked_in_at").eq("event_id", id);
    const going = (rs || []).filter(r => r.status === "going").length;
    const checked = (rs || []).filter(r => r.checked_in_at).length;
    setCounts({ going, checked });
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    setBusy(true);
    const c = code.trim().toUpperCase();
    const { data: r } = await supabase.from("rsvps").select("id,checked_in_at,event_id").eq("event_id", id).eq("ticket_code", c).maybeSingle();
    if (!r) { toast.error("Ticket not found"); setBusy(false); return; }
    if (r.checked_in_at) { toast.error("Already checked in"); setBusy(false); return; }
    const now = new Date().toISOString();
    await supabase.from("rsvps").update({ checked_in_at: now }).eq("id", r.id);
    await supabase.from("check_in_log").insert({ event_id: id, rsvp_id: r.id, ticket_code: c, scanned_by: user.id });
    toast.success("Checked in!");
    setCode(""); await refresh(); setBusy(false);
  };

  const undo = async () => {
    const { data: last } = await supabase.from("check_in_log").select("*").eq("event_id", id).eq("undone", false)
      .order("scanned_at", { ascending: false }).limit(1).maybeSingle();
    if (!last) { toast.error("Nothing to undo"); return; }
    await supabase.from("check_in_log").update({ undone: true }).eq("id", last.id);
    await supabase.from("rsvps").update({ checked_in_at: null }).eq("id", last.rsvp_id);
    toast.success("Undone");
    await refresh();
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-2xl font-semibold">{event?.title || "Check-in"}</h1>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md border bg-card p-3"><div className="text-xs text-muted-foreground">Going</div><div className="text-2xl font-semibold">{counts.going}</div></div>
        <div className="rounded-md border bg-card p-3"><div className="text-xs text-muted-foreground">Checked-in</div><div className="text-2xl font-semibold">{counts.checked}</div></div>
        <div className="rounded-md border bg-card p-3"><div className="text-xs text-muted-foreground">Remaining</div><div className="text-2xl font-semibold">{counts.going - counts.checked}</div></div>
      </div>
      <form onSubmit={submit} className="mt-6 flex gap-2">
        <Input placeholder="Ticket code" value={code} onChange={(e) => setCode(e.target.value)} className="font-mono uppercase tracking-wider" />
        <Button disabled={busy || !code}>Check in</Button>
      </form>
      <Button variant="ghost" size="sm" className="mt-3" onClick={undo}>Undo last scan</Button>
    </div>
  );
}
