import { Link } from "react-router-dom";
import { Check, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

const benefits = [
  "OS ilimitadas todo mês",
  "Usuários e veículos ilimitados",
  "Estoque inteligente integrado",
  "Relatórios financeiros completos",
  "WhatsApp e automações inclusas",
  "Acesso em qualquer dispositivo",
  "Atualizações contínuas",
  "Suporte humano prioritário",
];

export function PricingSection() {
  return (
    <section id="planos" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
            Planos e preços
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Um único plano. Tudo ilimitado.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            R$ 150 por mês. Sem pegadinha, sem módulo extra, sem multa de
            cancelamento.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-lg"
        >
          <div className="relative overflow-hidden rounded-3xl border-2 border-gold/40 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-8 shadow-[0_0_80px_-20px_var(--gold-glow)] backdrop-blur-xl sm:p-10">
            <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 right-0 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative">
              <div className="mb-6 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 px-3 py-1 text-sm font-medium text-gold">
                  <Zap className="h-4 w-4" />
                  Plano Prime
                </div>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                  Mais escolhido
                </span>
              </div>

              <div className="mb-2 flex items-baseline gap-2">
                <span className="text-6xl font-extrabold tracking-tight text-foreground">
                  R$ 150
                </span>
                <span className="text-lg text-muted-foreground">/mês</span>
              </div>
              <p className="mb-8 text-sm text-muted-foreground">
                Tudo ilimitado. Cancele quando quiser, sem multa.
              </p>

              <ul className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {benefits.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2.5 text-sm text-foreground"
                  >
                    <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </div>
                    <span className="leading-snug">{b}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/signup"
                onClick={() => trackEvent("click_comecar_agora", { source: "pricing_card", plan: "prime_monthly" })}
                className="group block w-full rounded-xl bg-gradient-to-r from-gold to-amber-400 py-4 text-center text-base font-semibold text-primary-foreground shadow-[0_0_30px_-4px_var(--gold-glow)] transition-all hover:-translate-y-0.5 hover:shadow-[0_0_50px_-4px_var(--gold-glow)]"
              >
                Começar Agora
              </Link>

              <p className="mt-4 text-center text-xs text-muted-foreground">
                ✓ 30 dias de garantia incondicional • ✓ Sem cartão de crédito
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
