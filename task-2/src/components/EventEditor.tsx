import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { slugify } from "@/lib/utils-event";

export default function EventEditor({ eventId, onSaved }: { eventId?: string; onSaved: () => void }) {
  const { user } = useAuth();
  const [hosts, setHosts] = useState<Array<{ id: string; name: string }>>([]);
  const [hostId, setHostId] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", cover_image_url: "",
    start_at: "", end_at: "", timezone: "UTC",
    venue_address: "", online_link: "", capacity: 50,
    visibility: "public" as "public" | "unlisted",
    status: "draft" as "draft" | "published",
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("host_members").select("hosts(id,name)").eq("user_id", user.id).eq("role", "host");
      const hs = (data || []).map((m: { hosts: { id: string; name: string } }) => m.hosts).filter(Boolean);
      setHosts(hs);
      if (hs.length) setHostId(hs[0].id);
    })();
  }, [user]);

  useEffect(() => {
    if (!eventId) return;
    (async () => {
      const { data } = await supabase.from("events").select("*").eq("id", eventId).single();
      if (!data) return;
      setHostId(data.host_id);
      setForm({
        title: data.title, description: data.description ?? "", cover_image_url: data.cover_image_url ?? "",
        start_at: data.start_at.slice(0, 16), end_at: data.end_at.slice(0, 16), timezone: data.timezone,
        venue_address: data.venue_address ?? "", online_link: data.online_link ?? "",
        capacity: data.capacity, visibility: data.visibility, status: data.status,
      });
    })();
  }, [eventId]);

  const submit = async (e: React.FormEvent, publish?: boolean) => {
    e.preventDefault();
    if (!user || !hostId) return;
    if (!form.venue_address && !form.online_link) { toast.error("Provide a venue address or online link"); return; }
    setBusy(true);
    let cover = form.cover_image_url;
    if (coverFile) {
      const path = `${user.id}/${Date.now()}-${coverFile.name}`;
      const { error } = await supabase.storage.from("event-covers").upload(path, coverFile);
      if (!error) cover = supabase.storage.from("event-covers").getPublicUrl(path).data.publicUrl;
    }
    const payload = {
      ...form, cover_image_url: cover || null,
      venue_address: form.venue_address || null, online_link: form.online_link || null,
      capacity: Number(form.capacity), host_id: hostId, created_by: user.id,
      start_at: new Date(form.start_at).toISOString(),
      end_at: new Date(form.end_at).toISOString(),
      status: publish ? "published" : form.status,
    };
    if (eventId) {
      const { error } = await supabase.from("events").update(payload).eq("id", eventId);
      setBusy(false);
      if (error) { toast.error(error.message); return; }
    } else {
      const slug = slugify(form.title) + "-" + Math.random().toString(36).slice(2, 6);
      const { error } = await supabase.from("events").insert({ ...payload, slug });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
    }
    toast.success("Saved");
    onSaved();
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">{eventId ? "Edit event" : "New event"}</h1>
      <form className="mt-6 space-y-4">
        {hosts.length > 1 && (
          <div><Label>Host</Label>
            <select className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={hostId} onChange={(e) => setHostId(e.target.value)}>
              {hosts.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select></div>
        )}
        <div><Label>Title</Label><Input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}/></div>
        <div><Label>Description</Label><Textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Start</Label><Input type="datetime-local" required value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })}/></div>
          <div><Label>End</Label><Input type="datetime-local" required value={form.end_at} onChange={(e) => setForm({ ...form, end_at: e.target.value })}/></div>
        </div>
        <div><Label>Timezone (IANA)</Label><Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="Europe/Warsaw"/></div>
        <div><Label>Venue address</Label><Input value={form.venue_address} onChange={(e) => setForm({ ...form, venue_address: e.target.value })}/></div>
        <div><Label>Online link</Label><Input value={form.online_link} onChange={(e) => setForm({ ...form, online_link: e.target.value })}/></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><Label>Capacity</Label><Input type="number" min={1} value={form.capacity} onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}/></div>
          <div><Label>Visibility</Label>
            <select className="mt-1 w-full rounded-md border bg-background px-3 py-2" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as "public" | "unlisted" })}>
              <option value="public">Public</option><option value="unlisted">Unlisted</option>
            </select></div>
        </div>
        <div><Label>Cover image</Label><Input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}/></div>
        <div className="rounded-md border bg-muted p-3 text-sm">
          <span className="font-medium">Free</span> · <span className="text-muted-foreground" title="Coming soon — paid events are not available yet">Paid (coming soon)</span>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={busy} onClick={(e) => submit(e, false)}>Save draft</Button>
          <Button type="button" disabled={busy} onClick={(e) => submit(e, true)}>{form.status === "published" ? "Save" : "Publish"}</Button>
        </div>
      </form>
    </div>
  );
}
