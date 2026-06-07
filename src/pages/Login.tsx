import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Wrench, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  useEffect(() => {
    if (user) navigate(from, { replace: true });
  }, [user, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message);
      return;
    }
    toast.success("Bem-vindo de volta!");
    navigate(from, { replace: true });
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) {
      setSubmitting(false);
      toast.error("Não foi possível entrar com Google.");
    }
  };

  const handleForgot = async () => {
    if (!email) {
      toast.info("Digite seu e-mail acima para receber o link.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) toast.error(error.message);
    else toast.success("Enviamos um link para redefinir sua senha.");
  };

  return (
    <div className="dark landing-theme relative min-h-screen overflow-hidden bg-background text-foreground">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, black, transparent)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 800px 500px at 50% 0%, var(--gold-glow), transparent 70%)",
        }}
      />

      <header className="relative z-10">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-elevated shadow-sm">
              <Wrench className="h-5 w-5 text-primary" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold tracking-tight text-foreground">
              Oficina<span className="text-primary">Prime</span>
            </span>
          </Link>
          <Link to="/" className="hidden text-sm text-muted-foreground hover:text-foreground transition-colors sm:inline">
            ← Voltar ao site
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10">
        <div className="w-full max-w-md animate-fade-up">
          <div className="relative rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/60 backdrop-blur-xl sm:p-10">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-[0_0_40px_-6px_var(--gold-glow)]">
                <Wrench className="h-7 w-7 text-primary-foreground" strokeWidth={2.5} />
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Bem-vindo de volta</h1>
              <p className="mt-2 text-sm text-muted-foreground">Acesse sua oficina e siga em frente.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground/80">E-mail</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" autoComplete="email" placeholder="voce@oficina.com" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="h-12 border-white/10 bg-white/5 pl-11 text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary/60 focus-visible:ring-primary/30 backdrop-blur-sm" />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground/80">Senha</Label>
                  <button type="button" onClick={handleForgot} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="h-12 border-white/10 bg-white/5 pl-11 pr-11 text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary/60 focus-visible:ring-primary/30 backdrop-blur-sm" />
                  <button type="button" onClick={() => setShowPassword((s) => !s)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" className="group mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 text-base font-semibold text-primary-foreground shadow-[0_0_40px_-6px_var(--gold-glow)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_60px_-4px_var(--gold-glow)] disabled:opacity-50" disabled={submitting}>
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Entrar <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
              </button>

              <div className="relative my-6 flex items-center">
                <div className="flex-1 border-t border-white/10" />
                <span className="px-3 text-[11px] uppercase tracking-wider text-muted-foreground">ou</span>
                <div className="flex-1 border-t border-white/10" />
              </div>

              <button type="button" onClick={handleGoogle} disabled={submitting}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-3 text-sm font-medium text-foreground transition-colors hover:bg-white/10 disabled:opacity-50">
                <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Entrar com Google
              </button>
            </form>

            <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Plataforma profissional. Seus dados, protegidos.</span>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não tem conta?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Criar oficina
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Login;
