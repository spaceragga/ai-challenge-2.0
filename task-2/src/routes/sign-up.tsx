import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { slugify } from "@/lib/utils-event";

export const Route = createFileRoute("/sign-up")({ component: SignUp });

function SignUp() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [asHost, setAsHost] = useState(false);
  const [hostName, setHostName] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data: signUpData, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }

    // Ensure session — try sign-in if email confirm is off this is already set
    let userId = signUpData.user?.id ?? null;
    if (!signUpData.session) {
      const { data: signInData } = await supabase.auth.signInWithPassword({ email, password });
      userId = signInData.user?.id ?? userId;
    }

    if (asHost && userId) {
      const finalHostName = hostName.trim() || name;
      const slug = slugify(finalHostName) + "-" + Math.random().toString(36).slice(2, 6);
      const { data: host, error: hErr } = await supabase
        .from("hosts")
        .insert({ name: finalHostName, slug, contact_email: email, created_by: userId })
        .select("id")
        .single();
      if (hErr || !host) {
        setBusy(false);
        toast.error(hErr?.message || "Account created, but host setup failed. Try /host/register.");
        nav({ to: "/explore" });
        return;
      }
      const { error: mErr } = await supabase
        .from("host_members")
        .insert({ host_id: host.id, user_id: userId, role: "host" });
      if (mErr) {
        setBusy(false);
        toast.error(mErr.message);
        return;
      }
      setBusy(false);
      toast.success("Host account created!");
      nav({ to: "/dashboard" });
      return;
    }

    setBusy(false);
    toast.success("Account created!");
    nav({ to: "/explore" });
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-muted-foreground">Free, takes 10 seconds.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div><Label htmlFor="n">Full name</Label><Input id="n" required value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label htmlFor="e">Email</Label><Input id="e" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><Label htmlFor="p">Password</Label><Input id="p" type="password" minLength={6} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>

        <div className="flex items-start gap-2 rounded-md border bg-muted/40 p-3">
          <Checkbox id="ah" checked={asHost} onCheckedChange={(v) => setAsHost(v === true)} className="mt-0.5" />
          <div className="flex-1">
            <Label htmlFor="ah" className="cursor-pointer">Register as a host</Label>
            <p className="text-xs text-muted-foreground">Hosts can create and publish events.</p>
            {asHost && (
              <Input
                className="mt-2"
                placeholder="Host / organization name"
                value={hostName}
                onChange={(e) => setHostName(e.target.value)}
              />
            )}
          </div>
        </div>

        <Button className="w-full" disabled={busy}>{busy ? "Creating…" : "Create account"}</Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">Have an account? <Link to="/sign-in" className="underline">Sign in</Link></p>
    </div>
  );
}
