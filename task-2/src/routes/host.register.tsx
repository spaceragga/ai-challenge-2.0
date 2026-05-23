import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { slugify } from "@/lib/utils-event";

export const Route = createFileRoute("/host/register")({ component: Register });

function Register() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) nav({ to: "/sign-in", search: { redirect: "/host/register" } });
    if (user?.email) setContactEmail((c) => c || user.email!);
  }, [user, loading, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return;
    setBusy(true);
    let logo_url: string | null = null;
    if (logo) {
      const path = `${user.id}/${Date.now()}-${logo.name}`;
      const { error } = await supabase.storage.from("host-logos").upload(path, logo);
      if (!error) logo_url = supabase.storage.from("host-logos").getPublicUrl(path).data.publicUrl;
    }
    const slug = slugify(name) + "-" + Math.random().toString(36).slice(2, 6);
    const { data: host, error } = await supabase.from("hosts").insert({
      name, slug, bio, contact_email: contactEmail, logo_url, created_by: user.id,
    }).select("id").single();
    if (error || !host) { setBusy(false); toast.error(error?.message || "Failed"); return; }
    const { error: mErr } = await supabase.from("host_members").insert({ host_id: host.id, user_id: user.id, role: "host" });
    setBusy(false);
    if (mErr) { toast.error(mErr.message); return; }
    toast.success("Host created!");
    nav({ to: "/dashboard" });
  };

  if (!user) return null;
  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <h1 className="text-2xl font-semibold">Become a Host</h1>
      <p className="mt-1 text-sm text-muted-foreground">Create a host org to start publishing events.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><Label>Host name</Label><Input required value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>Bio</Label><Textarea value={bio} onChange={(e) => setBio(e.target.value)} /></div>
        <div><Label>Contact email</Label><Input type="email" required value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} /></div>
        <div><Label>Logo</Label><Input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} /></div>
        <Button disabled={busy} className="w-full">{busy ? "Creating…" : "Create host"}</Button>
      </form>
    </div>
  );
}
