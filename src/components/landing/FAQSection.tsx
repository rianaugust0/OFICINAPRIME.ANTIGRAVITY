import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/analytics";

const faqs = [
  {
    q: "Como funciona a assinatura?",
    a: "O investimento é de R$ 150 por mês com tudo incluso (OS, usuários, WhatsApp e estoque ilimitados). Você pode cancelar quando quiser, sem multa nem fidelidade.",
  },
  {
    q: "Terei suporte depois da compra?",
    a: "Sim. Suporte prioritário por humanos de verdade (chat e WhatsApp) e todas as atualizações do sistema estão inclusas, sem custo adicional.",
  },
  {
    q: "Como funciona o WhatsApp automático?",
    a: "O sistema avisa seu cliente sozinho quando o carro fica pronto, manda lembretes de revisão e cobranças. Você configura uma vez e ele trabalha por você.",
  },
  {
    q: "Posso usar em mais de um computador ou celular?",
    a: "Sim. Acesso ilimitado em qualquer dispositivo (computador, tablet ou celular), com sincronização em tempo real e usuários ilimitados.",
  },
  {
    q: "Meus dados ficam seguros?",
    a: "Sim. Usamos criptografia de ponta a ponta e backups automáticos diários em nuvem. Seus dados são seus — você pode exportar quando quiser.",
  },
  {
    q: "E se eu não gostar?",
    a: "Você tem 30 dias de garantia incondicional. Não gostou? Devolvemos 100% do valor e o cancelamento é imediato, sem burocracia.",
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
            Perguntas frequentes
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Tudo que você precisa saber
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={`overflow-hidden rounded-2xl border backdrop-blur-xl transition-colors ${
                  isOpen ? "border-gold/30 bg-white/[0.04]" : "border-white/10 bg-white/[0.02]"
                }`}
              >
                <button
                  onClick={() => {
                    const next = isOpen ? null : i;
                    setOpen(next);
                    if (!isOpen) trackEvent("faq_expand", { index: i, question: f.q });
                  }}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                >
                  <span className="text-base font-semibold text-foreground">
                    {f.q}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-gold transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      <p className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground sm:px-6">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
