import { motion } from "framer-motion";
import { FileText, Smile, Clock } from "lucide-react";

const stats = [
  { icon: FileText, value: "+50.000", label: "Ordens de Serviço geradas" },
  { icon: Smile, value: "98%", label: "Satisfação dos clientes" },
  { icon: Clock, value: "-40%", label: "Tempo em burocracia" },
];

const logos = ["Auto Premium", "Garage 48", "Elite Service", "TurboCar", "MecânicaPro"];

export function SocialProofSection() {
  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Oficinas que já confiam no OficinaPrime
        </p>

        <div className="mt-8 grid grid-cols-2 items-center gap-6 opacity-70 sm:grid-cols-5">
          {logos.map((logo) => (
            <div
              key={logo}
              className="text-center font-semibold tracking-tight text-foreground/60 transition-colors hover:text-gold"
            >
              {logo}
            </div>
          ))}
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold ring-1 ring-gold/20">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
