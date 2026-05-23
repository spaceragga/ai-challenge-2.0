import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { fmtDate, isPast, genTicketCode, buildICS, downloadFile } from "@/lib/utils-event";
import { MapPin, Globe, Calendar, AlertCircle, Star, ImagePlus, Flag } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export const Route = createFileRoute("/events/$slug")({ component: EventPage });

type EventDetail = {
  id: string; slug: string; title: string; description: string | null;
  cover_image_url: string | null; start_at: string; end_at: string; timezone: string;
  venue_address: string | null; online_link: string | null; capacity: number;
  status: string; visibility: string; host_id: string;
  hosts: { id: string; slug: string; name: string; logo_url: string | null } | null;
};

function EventPage() {
  const { slug } = Route.useParams();
  const nav = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [myRsvp, setMyRsvp] = useState<{ id: string; status: string; ticket_code: string | null; waitlist_position: number | null; promoted_at: string | null } | null>(null);
  const [counts, setCounts] = useState({ going: 0, waitlist: 0 });
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ rating: number; comment: string }>({ rating: 5, comment: "" });
  const [myFeedback, setMyFeedback] = useState<boolean>(false);
  const [gallery, setGallery] = useState<{ id: string; image_url: string }[]>([]);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const load = async () => {
    setLoading(true);
    const { data: e } = await supabase.from("events")
      .select("id,slug,title,description,cover_image_url,start_at,end_at,timezone,venue_address,online_link,capacity,status,visibility,host_id,hosts(id,slug,name,logo_url)")
      .eq("slug", slug).maybeSingle();
    if (!e) { setEvent(null); setLoading(false); return; }
    setEvent(e as unknown as EventDetail);
    const { data: rs } = await supabase.from("rsvps").select("status").eq("event_id", e.id).neq("status", "cancelled");
    const going = (rs || []).filter((r) => r.status === "going").length;
    const waitlist = (rs || []).filter((r) => r.status === "waitlist").length;
    setCounts({ going, waitlist });

    if (user) {
      const { data: mine } = await supabase.from("rsvps")
        .select("id,status,ticket_code,waitlist_position,promoted_at")
        .eq("event_id", e.id).eq("user_id", user.id).neq("status", "cancelled").maybeSingle();
      setMyRsvp(mine || null);
      if (mine?.promoted_at) {
        toast.success(`You've been promoted from the waitlist for ${e.title}!`);
        await supabase.from("rsvps").update({ promoted_at: null }).eq("id", mine.id);
      }
      const { data: fb } = await supabase.from("event_feedback").select("id").eq("event_id", e.id).eq("user_id", user.id).maybeSingle();
      setMyFeedback(!!fb);
    }
    const { data: gl } = await supabase.from("gallery_uploads").select("id,image_url").eq("event_id", e.id).eq("status", "approved");
    setGallery(gl || []);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [slug, user?.id]);

  if (loading) return <div className="mx-auto max-w-4xl px-4 py-12 text-muted-foreground">Loading…</div>;
  if (!event) return <div className="mx-auto max-w-4xl px-4 py-12">Event not found.</div>;

  const ended = isPast(event.end_at);
  const seatsLeft = event.capacity - counts.going;

  const rsvp = async () => {
    if (!user) { nav({ to: "/sign-in", search: { redirect: window.location.pathname } }); return; }
    setBusy(true);
    const goingFull = counts.going >= event.capacity;
    if (goingFull) {
      const { error } = await supabase.from("rsvps").insert({
        event_id: event.id, user_id: user.id, status: "waitlist", waitlist_position: counts.waitlist + 1,
      });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("Added to waitlist");
    } else {
      const { error } = await supabase.from("rsvps").insert({
        event_id: event.id, user_id: user.id, status: "going", ticket_code: genTicketCode(),
      });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      toast.success("You're going! 🎉");
    }
    await load();
  };

  const cancel = async () => {
    if (!myRsvp) return;
    if (!confirm("Cancel your RSVP?")) return;
    setBusy(true);
    await supabase.from("rsvps").update({ status: "cancelled", ticket_code: null, waitlist_position: null }).eq("id", myRsvp.id);
    await supabase.rpc("promote_waitlist", { _event_id: event.id });
    setBusy(false);
    toast.success("RSVP cancelled");
    await load();
  };

  const submitFeedback = async () => {
    if (!user) return;
    const { error } = await supabase.from("event_feedback").insert({
      event_id: event.id, user_id: user.id, rating: feedback.rating,
      comment: feedback.comment || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Thanks for the feedback!");
    setMyFeedback(true);
  };

  const uploadPhoto = async (file: File) => {
    if (!user) return;
    const path = `${user.id}/${event.id}-${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("event-gallery").upload(path, file);
    if (upErr) { toast.error(upErr.message); return; }
    const { data } = supabase.storage.from("event-gallery").getPublicUrl(path);
    const { error } = await supabase.from("gallery_uploads").insert({
      event_id: event.id, user_id: user.id, image_url: data.publicUrl, status: "pending",
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Photo submitted for approval");
  };

  const submitReport = async () => {
    if (!user || !reportReason.trim()) return;
    const { error } = await supabase.from("reports").insert({
      target_type: "event", target_id: event.id, reporter_id: user.id, reason: reportReason,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Report submitted");
    setReportOpen(false); setReportReason("");
  };

  const downloadICS = () => {
    const ics = buildICS({ uid: event.id, title: event.title, description: event.description ?? undefined,
      start: event.start_at, end: event.end_at, location: event.venue_address ?? event.online_link ?? undefined });
    downloadFile(`${event.slug}.ics`, ics, "text/calendar");
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {ended && (
        <div className="mb-4 flex items-center gap-2 rounded-md border bg-muted px-4 py-3 text-sm">
          <AlertCircle className="h-4 w-4" /> This event has ended.
        </div>
      )}
      {event.cover_image_url && (
        <div className="mb-6 aspect-[16/8] overflow-hidden rounded-lg border bg-muted">
          <img src={event.cover_image_url} alt={event.title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight">{event.title}</h1>
            {event.visibility === "unlisted" && <Badge variant="outline">Unlisted</Badge>}
          </div>
          {event.hosts && (
            <Link to="/hosts/$slug" params={{ slug: event.hosts.slug }}
              className="mt-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              {event.hosts.logo_url && <img src={event.hosts.logo_url} className="h-5 w-5 rounded-full object-cover" alt=""/>}
              by <span className="font-medium text-foreground">{event.hosts.name}</span>
            </Link>
          )}
        </div>
        {user && (
          <Button variant="ghost" size="sm" onClick={() => setReportOpen(!reportOpen)}>
            <Flag className="mr-1 h-3 w-3" />Report
          </Button>
        )}
      </div>

      {reportOpen && (
        <div className="mt-3 rounded-md border bg-card p-3">
          <Textarea placeholder="Reason for reporting…" value={reportReason} onChange={(e) => setReportReason(e.target.value)} />
          <div className="mt-2 flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={submitReport}>Submit report</Button>
          </div>
        </div>
      )}

      <div className="mt-6 grid gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2"><Calendar className="h-4 w-4"/> {fmtDate(event.start_at, event.timezone)} → {fmtDate(event.end_at, event.timezone)} ({event.timezone})</div>
        {event.venue_address && <div className="flex items-center gap-2"><MapPin className="h-4 w-4"/> {event.venue_address}</div>}
        {event.online_link && <div className="flex items-center gap-2"><Globe className="h-4 w-4"/> <a href={event.online_link} className="underline" target="_blank" rel="noreferrer">{event.online_link}</a></div>}
        <div>Capacity: {event.capacity} · Going: {counts.going} · {seatsLeft > 0 ? `${seatsLeft} seats left` : "Full"}</div>
      </div>

      {event.description && <p className="mt-6 whitespace-pre-wrap text-[15px] leading-7">{event.description}</p>}

      {/* RSVP block */}
      {!ended && (
        <div className="mt-8 rounded-lg border bg-card p-5">
          {myRsvp ? (
            <div>
              {myRsvp.status === "going" && myRsvp.ticket_code && (
                <div>
                  <div className="flex items-center gap-2"><Badge>Going</Badge></div>
                  <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                    <div className="rounded-md border bg-background p-3"><QRCodeSVG value={myRsvp.ticket_code} size={140} /></div>
                    <div>
                      <div className="text-xs text-muted-foreground">Ticket code</div>
                      <div className="font-mono text-2xl font-semibold tracking-wider">{myRsvp.ticket_code}</div>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" variant="outline" onClick={downloadICS}>Add to Calendar</Button>
                        <Button size="sm" variant="ghost" onClick={cancel} disabled={busy}>Cancel RSVP</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {myRsvp.status === "waitlist" && (
                <div>
                  <Badge variant="secondary">Waitlisted</Badge>
                  <p className="mt-2 text-sm">You're #{myRsvp.waitlist_position} on the waitlist. We'll promote you if a seat opens.</p>
                  <Button size="sm" variant="ghost" className="mt-2" onClick={cancel} disabled={busy}>Leave waitlist</Button>
                </div>
              )}
            </div>
          ) : (
            <Button onClick={rsvp} disabled={busy} size="lg">
              {seatsLeft > 0 ? "RSVP — Free" : "Join waitlist"}
            </Button>
          )}
        </div>
      )}

      {/* Feedback */}
      {ended && user && myRsvp?.status === "going" && !myFeedback && (
        <div className="mt-8 rounded-lg border bg-card p-5">
          <h3 className="font-medium">Leave feedback</h3>
          <div className="mt-3 flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setFeedback((f) => ({ ...f, rating: n }))}>
                <Star className={`h-6 w-6 ${n <= feedback.rating ? "fill-warning text-warning" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea className="mt-3" placeholder="Optional comment…" value={feedback.comment}
            onChange={(e) => setFeedback((f) => ({ ...f, comment: e.target.value }))} />
          <Button className="mt-3" size="sm" onClick={submitFeedback}>Submit</Button>
        </div>
      )}

      {/* Gallery */}
      {ended && (
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Event gallery</h3>
            {user && (
              <label className="cursor-pointer text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <ImagePlus className="h-4 w-4" /> Upload photo
                <input type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && uploadPhoto(e.target.files[0])} />
              </label>
            )}
          </div>
          {gallery.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No approved photos yet.</p>
          ) : (
            <div className="mt-3 grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
              {gallery.map((g) => <img key={g.id} src={g.image_url} className="aspect-square rounded-md object-cover" alt="" />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
