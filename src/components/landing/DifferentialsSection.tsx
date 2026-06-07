import { Infinity as InfinityIcon, Smartphone, BadgeDollarSign, Lock, Headphones, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

const items = [
  {
    icon: InfinityIcon,
    title: "Sem limites",
    description: "OS, clientes, veículos e usuários ilimitados. Cresça sem medo de tarifa extra.",
  },
  {
    icon: Smartphone,
    title: "Qualquer dispositivo",
    description: "Use no celular, tablet ou computador. Tudo sincronizado em tempo real.",
  },
  {
    icon: BadgeDollarSign,
    title: "Preço justo",
    description: "Licença única. Sem mensalidade abusiva, sem surpresas no cartão.",
  },
  {
    icon: Lock,
    title: "Seus dados protegidos",
    description: "Backups automáticos e criptografia de ponta a ponta para sua tranquilidade.",
  },
  {
    icon: Headphones,
    title: "Suporte humano",
    description: "Atendimento por humanos de verdade, em português, quando você precisar.",
  },
  {
    icon: RefreshCw,
    title: "Atualizações vitalícias",
    description: "Receba novidades e melhorias sempre, sem pagar nada a mais.",
  },
];

export function DifferentialsSection() {
  return (
    <section className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
            Por que OficinaPrime
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Feito para quem leva a oficina a sério
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition-colors hover:border-gold/30 hover:bg-white/[0.05]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold ring-1 ring-gold/20 transition-transform group-hover:scale-110">
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="mb-1 text-base font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
