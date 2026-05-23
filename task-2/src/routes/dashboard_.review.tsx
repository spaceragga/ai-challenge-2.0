import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard_/review")({ component: Review });

function Review() {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<Array<{ id: string; image_url: string; event_id: string }>>([]);
  const [reports, setReports] = useState<Array<{ id: string; target_type: string; target_id: string; reason: string; status: string }>>([]);

  const load = async () => {
    const { data: p } = await supabase.from("gallery_uploads").select("id,image_url,event_id").eq("status", "pending");
    setPhotos(p || []);
    const { data: r } = await supabase.from("reports").select("*").eq("status", "open");
    setReports(r || []);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const setPhoto = async (id: string, status: "approved" | "rejected") => {
    await supabase.from("gallery_uploads").update({ status }).eq("id", id);
    toast.success(status); load();
  };
  const hideReport = async (r: { id: string; target_type: string; target_id: string }) => {
    if (!confirm("Hide this content?")) return;
    if (r.target_type === "event") await supabase.from("events").update({ status: "draft" }).eq("id", r.target_id);
    if (r.target_type === "photo") await supabase.from("gallery_uploads").update({ status: "rejected" }).eq("id", r.target_id);
    await supabase.from("reports").update({ status: "hidden" }).eq("id", r.id);
    toast.success("Hidden"); load();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Review queue</h1>

      <h2 className="mt-6 mb-2 font-medium">Pending photos</h2>
      {photos.length === 0 ? <p className="text-sm text-muted-foreground">No pending photos.</p> :
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3">
          {photos.map(p => (
            <div key={p.id} className="rounded-md border bg-card p-2">
              <img src={p.image_url} className="aspect-square w-full rounded object-cover" alt="" />
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={() => setPhoto(p.id, "approved")}>Approve</Button>
                <Button size="sm" variant="outline" onClick={() => setPhoto(p.id, "rejected")}>Reject</Button>
              </div>
            </div>
          ))}
        </div>}

      <h2 className="mt-8 mb-2 font-medium">Open reports</h2>
      {reports.length === 0 ? <p className="text-sm text-muted-foreground">No open reports.</p> :
        <div className="grid gap-2">
          {reports.map(r => (
            <div key={r.id} className="flex items-start justify-between rounded-md border bg-card p-3">
              <div className="text-sm">
                <div className="font-mono text-xs text-muted-foreground">{r.target_type} · {r.target_id.slice(0, 8)}</div>
                <div>{r.reason}</div>
              </div>
              <Button size="sm" variant="destructive" onClick={() => hideReport(r)}>Hide</Button>
            </div>
          ))}
        </div>}
    </div>
  );
}
