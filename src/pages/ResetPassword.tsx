import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Wrench, Lock, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [valid, setValid] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase auto-handles the recovery token from URL hash
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setValid(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setValid(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Senha deve ter no mínimo 8 caracteres.");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Senha atualizada!");
      navigate("/dashboard");
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-hero text-background">
      <div className="absolute inset-0 grid-pattern opacity-50" />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-background/10 bg-background/[0.04] p-8 shadow-elevated backdrop-blur-xl sm:p-10">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-glow">
              <Wrench className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <h1 className="font-display text-2xl font-bold">Definir nova senha</h1>
          </div>
          {valid ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="pwd" className="text-background/80">Nova senha</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-background/40" />
                  <Input id="pwd" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    className="h-12 border-background/10 bg-background/5 pl-10 text-background placeholder:text-background/30" />
                </div>
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Salvar senha <ArrowRight /></>}
              </Button>
            </form>
          ) : (
            <p className="text-center text-sm text-background/60">
              Link inválido ou expirado.{" "}
              <Link to="/login" className="text-primary">Voltar ao login</Link>
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
