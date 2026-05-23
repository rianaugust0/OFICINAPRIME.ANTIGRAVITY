import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface WorkshopMembership {
  workshop_id: string;
  role: "dono" | "mecanico" | "atendente";
  workshops: { id: string; name: string; whatsapp: string | null; logo_url: string | null; plan: string; created_at: string };
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  workshop: WorkshopMembership | null;
  workshopId: string | null;
  refreshWorkshop: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [workshop, setWorkshop] = useState<WorkshopMembership | null>(null);

  const loadWorkshop = async (uid: string) => {
    const { data } = await supabase
      .from("workshop_members")
      .select("workshop_id, role, workshops(id, name, whatsapp, logo_url, plan, created_at)")
      .eq("user_id", uid)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    setWorkshop((data as unknown as WorkshopMembership) ?? null);
  };

  useEffect(() => {
    // Set up listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Defer DB calls to avoid deadlock
        setTimeout(() => loadWorkshop(sess.user.id), 0);
      } else {
        setWorkshop(null);
      }
    });

    // THEN check existing session
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) loadWorkshop(sess.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const refreshWorkshop = async () => {
    if (user) await loadWorkshop(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setWorkshop(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        workshop,
        workshopId: workshop?.workshop_id ?? null,
        refreshWorkshop,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
