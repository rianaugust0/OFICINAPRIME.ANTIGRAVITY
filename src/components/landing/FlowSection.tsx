import { ClipboardList, PackageSearch, MessageCircle, Wallet } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: ClipboardList,
    step: "01",
    title: "Recebe o carro e cria a OS",
    description:
      "Cadastre o veículo pela placa em segundos. O histórico aparece automaticamente.",
  },
  {
    icon: PackageSearch,
    step: "02",
    title: "Estoque encontra as peças",
    description:
      "O sistema separa as peças e avisa quando algo precisa ser comprado.",
  },
  {
    icon: MessageCircle,
    step: "03",
    title: "Cliente aprova no WhatsApp",
    description:
      "Envie o orçamento e receba a aprovação direto pelo celular do cliente.",
  },
  {
    icon: Wallet,
    step: "04",
    title: "Financeiro atualizado",
    description:
      "Ao finalizar a OS, a conta a receber entra no fluxo de caixa automaticamente.",
  },
];

export function FlowSection() {
  return (
    <section id="fluxo" className="relative py-24 lg:py-32">
      {/* Subtle backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-gold/[0.02] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
            Como funciona o fluxo
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Da recepção ao caixa, sem retrabalho
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Quatro passos simples que tiram a bagunça do dia a dia da oficina.
          </p>
        </div>

        <div className="relative grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Connector line on desktop */}
          <div className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent lg:block" />

          {steps.map((s, i) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
            >
              <div className="relative mb-5 flex items-center justify-between">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold to-amber-500 text-primary-foreground shadow-[0_0_25px_-5px_var(--gold-glow)]">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="text-3xl font-extrabold text-gold/20">
                  {s.step}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {s.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {s.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
