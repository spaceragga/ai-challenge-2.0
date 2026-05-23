import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/invite/$token")({ component: AcceptInvite });

function AcceptInvite() {
  const { token } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) { nav({ to: "/sign-in", search: { redirect: `/invite/${token}` } }); return; }
    (async () => {
      const { error } = await (supabase as any).rpc("accept_host_invite", { _token: token });
      if (error) { toast.error(error.message || "Invalid invite"); nav({ to: "/explore" }); return; }
      toast.success("Joined host org!");
      nav({ to: "/my-events" });
    })();
  }, [user, loading, token, nav]);

  return <div className="mx-auto max-w-md px-4 py-12 text-center text-muted-foreground">Accepting invite…</div>;
}
