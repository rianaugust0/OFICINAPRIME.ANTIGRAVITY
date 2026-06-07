import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ShieldCheck, Zap, Sparkles, Mail, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function HeroSection() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setError("Digite um e-mail válido.");
      trackEvent("hero_email_invalid", { email });
      return;
    }
    setError(null);
    trackEvent("click_testar_gratis", { email, source: "hero_form" });
    navigate({ to: "/signup", search: { email } });
  };

  const onCtaClick = () => {
    trackEvent("click_testar_gratis", { source: "hero_cta_button" });
  };

  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-28">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 800px 500px at 50% 0%, var(--gold-glow), transparent 70%)",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
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

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-xs font-medium text-gold backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Sistema de gestão #1 para oficinas mecânicas
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="max-w-5xl text-4xl font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            Assuma o controle{" "}
            <span className="bg-gradient-to-r from-gold via-amber-300 to-gold bg-clip-text text-transparent">
              absoluto
            </span>{" "}
            da sua oficina mecânica.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            O software definitivo que integra ordens de serviço, clientes,
            estoque e WhatsApp automático.{" "}
            <span className="text-foreground/80">Tudo no mesmo lugar.</span>
          </motion.p>

          <motion.form
            onSubmit={onSubmit}
            noValidate
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="mt-10 flex w-full max-w-xl flex-col items-stretch gap-3 sm:flex-row"
          >
            <div className="relative flex-1">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                aria-label="Seu e-mail"
                aria-invalid={!!error}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="seu@email.com.br"
                className={`h-13 w-full rounded-xl border bg-white/5 py-3.5 pl-11 pr-4 text-base text-foreground placeholder:text-muted-foreground/70 backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 ${
                  error
                    ? "border-destructive/60 focus:border-destructive/60 focus:ring-destructive/20"
                    : "border-white/10 focus:border-gold/40 focus:ring-gold/20"
                }`}
              />
            </div>
            <button
              type="submit"
              onClick={onCtaClick}
              className="group inline-flex h-13 items-center justify-center gap-2 rounded-xl bg-gold px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-[0_0_40px_-6px_var(--gold-glow)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_60px_-4px_var(--gold-glow)]"
            >
              Testar Grátis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.form>

          {error && (
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-destructive" role="alert">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
          >
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-gold" /> 30 dias grátis
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-gold" /> Sem cartão de crédito
            </span>
            <Link
              to="/login"
              onClick={() => trackEvent("click_entrar", { source: "hero_secondary" })}
              className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline"
            >
              Já tenho conta — Entrar
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
            className="relative mt-20 w-full max-w-6xl"
          >
            <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-gradient-to-tr from-gold/20 via-amber-500/10 to-transparent blur-3xl" />

            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-black/60 backdrop-blur-xl">
              <div className="overflow-hidden rounded-xl ring-1 ring-white/10">
                <img
                  src="/images/hero-dashboard.png"
                  alt="Dashboard do OficinaPrime mostrando ordens de serviço, gráficos financeiros e controle de estoque"
                  className="w-full"
                  width={1600}
                  height={1024}
                />
              </div>

              <motion.div
                initial={{ opacity: 0, x: -20, y: -10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 1 }}
                className="absolute -left-4 top-16 hidden rounded-xl border border-white/10 bg-surface-elevated/90 p-3 shadow-xl backdrop-blur-md sm:block"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold">
                    <Zap className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      OS finalizada
                    </p>
                    <p className="text-xs font-semibold text-foreground">
                      Honda Civic • ABC-1234
                    </p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20, y: -10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 1.15 }}
                className="absolute -right-4 bottom-20 hidden rounded-xl border border-white/10 bg-surface-elevated/90 p-3 shadow-xl backdrop-blur-md sm:block"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Faturamento hoje
                    </p>
                    <p className="text-xs font-semibold text-foreground">
                      R$ 8.420,00 ▲ 24%
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
