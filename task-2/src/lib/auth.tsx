import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isHost: boolean;
  hostCheckLoading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  loading: true,
  isHost: false,
  hostCheckLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [hostCheckLoading, setHostCheckLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) {
      setIsHost(false);
      setHostCheckLoading(false);
      return;
    }
    setHostCheckLoading(true);
    supabase
      .from("host_members")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("role", "host")
      .then(({ count }) => {
        setIsHost((count ?? 0) > 0);
        setHostCheckLoading(false);
      });
  }, [session?.user?.id]);

  const value: AuthCtx = {
    user: session?.user ?? null,
    session,
    loading,
    isHost,
    hostCheckLoading,
    signOut: async () => { await supabase.auth.signOut(); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
