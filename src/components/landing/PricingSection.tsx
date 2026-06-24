import { Link } from "react-router-dom";
import { Check, Zap, Star, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

const plans = [
  {
    name: "Básico",
    price: "97",
    description: "Perfeito para oficinas começando a se organizar.",
    icon: ShieldCheck,
    features: [
      "Ordens de Serviço ilimitadas",
      "Até 2 usuários do sistema",
      "Controle de Estoque simples",
      "Cadastro de clientes e veículos",
      "Dashboard de serviços"
    ],
    popular: false,
    color: "slate",
  },
  {
    name: "Profissional",
    price: "147",
    description: "A escolha certa para oficinas em crescimento.",
    icon: Star,
    features: [
      "Tudo do plano Básico",
      "Usuários Ilimitados",
      "Relatórios Financeiros Completos",
      "Controle de Comissões",
      "Portal do Cliente (Aprovação online)",
      "Suporte Prioritário"
    ],
    popular: true,
    color: "gold",
  },
  {
    name: "Premium",
    price: "247",
    description: "O poder absoluto para gerir oficinas de ponta.",
    icon: Zap,
    features: [
      "Tudo do plano Profissional",
      "Emissão de Notas Fiscais (NFe/NFCe)",
      "Robô de WhatsApp Automático",
      "Avisos automáticos de OS pronta",
      "Vistoria Digital com Fotos",
      "Onboarding dedicado"
    ],
    popular: false,
    color: "emerald",
  }
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
            Escolha o plano ideal para a sua oficina.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Evolua o seu sistema de acordo com o crescimento do seu negócio. Sem multas de cancelamento.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isPopular = plan.popular;
            
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative flex flex-col overflow-hidden rounded-3xl border-2 p-8 shadow-xl backdrop-blur-xl sm:p-10 ${
                  isPopular 
                    ? "border-gold/40 bg-gradient-to-b from-white/[0.06] to-white/[0.02] shadow-[0_0_80px_-20px_var(--gold-glow)] scale-100 lg:scale-105 z-10" 
                    : "border-border/50 bg-background/50"
                }`}
              >
                {isPopular && (
                  <>
                    <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-gold/20 blur-3xl" />
                    <div className="pointer-events-none absolute -bottom-24 right-0 h-48 w-48 rounded-full bg-amber-500/10 blur-3xl" />
                  </>
                )}

                <div className="relative flex-1">
                  <div className="mb-6 flex items-center justify-between">
                    <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                      isPopular ? "bg-gold/15 text-gold" : "bg-primary/10 text-primary"
                    }`}>
                      <Icon className="h-4 w-4" />
                      Plano {plan.name}
                    </div>
                    {isPopular && (
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                        Mais escolhido
                      </span>
                    )}
                  </div>

                  <div className="mb-2 flex items-baseline gap-2">
                    <span className="text-5xl font-extrabold tracking-tight text-foreground">
                      R$ {plan.price}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  
                  <p className="mb-8 text-sm text-muted-foreground h-10">
                    {plan.description}
                  </p>

                  <ul className="mb-10 flex flex-col gap-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          isPopular ? "bg-gold/20" : "bg-primary/20"
                        }`}>
                          <Check className={`h-3 w-3 ${isPopular ? "text-gold" : "text-primary"}`} />
                        </div>
                        <span className="text-sm text-foreground/90">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-auto relative z-20">
                  <Link
                    to="/signup"
                    onClick={() => trackEvent("click_pricing", { plan: plan.name })}
                    className={`flex h-14 w-full items-center justify-center rounded-xl text-base font-bold transition-all ${
                      isPopular
                        ? "bg-emerald-500 text-white hover:scale-[1.02] hover:bg-emerald-600 shadow-lg shadow-emerald-500/25"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    Testar Grátis
                  </Link>
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    ✓ 7 dias grátis • ✓ Cancele quando quiser
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


