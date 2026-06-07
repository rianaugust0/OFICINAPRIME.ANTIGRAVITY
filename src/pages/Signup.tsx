import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Wrench, Mail, Lock, User, Building2, Phone, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const schema = z.object({
  full_name: z.string().trim().min(2, "Nome muito curto").max(100),
  workshop_name: z.string().trim().max(100).optional().or(z.literal("")),
  whatsapp: z.string().trim().max(20).optional().or(z.literal("")),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72),
});

const Signup = () => {
  const [params] = useSearchParams();
  const invitedEmail = params.get("email") ?? "";
  const isInvited = !!params.get("invite");
  const [form, setForm] = useState({ full_name: "", workshop_name: "", whatsapp: "", email: invitedEmail, password: "" });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: parsed.data.full_name,
          workshop_name: parsed.data.workshop_name,
          whatsapp: parsed.data.whatsapp,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes("registered") ? "Este e-mail já está cadastrado." : error.message);
      return;
    }
    toast.success("Oficina criada! Bem-vindo ao OficinaPrime.");
    navigate("/dashboard", { replace: true });
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
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Já tenho conta →
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
              <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">{isInvited ? "Aceitar convite" : "Crie sua oficina"}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{isInvited ? "Crie sua conta para entrar na equipe." : "Comece grátis. Configure em 1 minuto."}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Field icon={User} label="Seu nome" id="full_name">
                <Input id="full_name" required value={form.full_name} onChange={set("full_name")} placeholder="Carlos Ribeiro" className={inputClass} />
              </Field>
              {!isInvited && (
                <Field icon={Building2} label="Nome da oficina" id="workshop_name">
                  <Input id="workshop_name" required value={form.workshop_name} onChange={set("workshop_name")} placeholder="Auto Center Ribeiro" className={inputClass} />
                </Field>
              )}
              {!isInvited && (
                <Field icon={Phone} label="WhatsApp da oficina" id="whatsapp">
                  <Input id="whatsapp" value={form.whatsapp} onChange={set("whatsapp")} placeholder="(11) 99999-0000" className={inputClass} />
                </Field>
              )}
              <Field icon={Mail} label="E-mail" id="email">
                <Input id="email" type="email" required value={form.email} onChange={set("email")} placeholder="voce@oficina.com" className={inputClass} disabled={isInvited} />
              </Field>
              <Field icon={Lock} label="Senha (mín. 8)" id="password">
                <Input id="password" type="password" required value={form.password} onChange={set("password")} placeholder="••••••••" className={inputClass} />
              </Field>

              <button type="submit" className="group mt-2 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 text-base font-semibold text-primary-foreground shadow-[0_0_40px_-6px_var(--gold-glow)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_60px_-4px_var(--gold-glow)] disabled:opacity-50" disabled={submitting}>
                {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Criar oficina <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></>}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              <span>Sem cartão de crédito. Cancele quando quiser.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

const inputClass = "h-12 border-white/10 bg-white/5 pl-11 text-foreground placeholder:text-muted-foreground/70 focus-visible:border-primary/60 focus-visible:ring-primary/30 backdrop-blur-sm";

function Field({ icon: Icon, label, id, children }: { icon: typeof User; label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-foreground/80 text-xs">{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        {children}
      </div>
    </div>
  );
}

export default Signup;
