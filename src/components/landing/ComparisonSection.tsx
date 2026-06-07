import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

const rows = [
  { label: "Mensalidade", prime: "R$ 150 — tudo incluso", others: "R$ 200+ por módulo" },
  { label: "Cancelar quando quiser", prime: true, others: false },
  { label: "Ordens de Serviço", prime: "Ilimitadas", others: "Limitadas por plano" },
  { label: "Usuários simultâneos", prime: "Ilimitados", others: "Cobrança por usuário" },
  { label: "Disparos no WhatsApp", prime: "Sem limite", others: "Pacotes pagos" },
  { label: "Atualizações contínuas", prime: true, others: false },
  { label: "Suporte humano", prime: "Prioritário", others: "Robô / chat lento" },
];

function Cell({ value, highlight }: { value: string | boolean; highlight?: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <div className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${highlight ? "bg-gold/20 text-gold" : "bg-white/5 text-muted-foreground"}`}>
        <Check className="h-4 w-4" strokeWidth={3} />
      </div>
    ) : (
      <div className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <X className="h-4 w-4" strokeWidth={3} />
      </div>
    );
  }
  return (
    <span className={`text-sm font-medium ${highlight ? "text-gold" : "text-muted-foreground"}`}>
      {value}
    </span>
  );
}

export function ComparisonSection() {
  return (
    <section id="comparativo" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
            Comparativo
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Por que pagar mensalidade para sempre?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Veja como o OficinaPrime economiza milhares de reais por ano.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl"
        >
          <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center border-b border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent">
            <div className="px-5 py-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-8">
              Recurso
            </div>
            <div className="border-x border-white/10 px-3 py-5 text-center sm:px-6">
              <p className="text-xs uppercase tracking-wider text-gold">OficinaPrime</p>
              <p className="mt-1 text-sm font-bold text-foreground sm:text-base">R$ 150/mês</p>
            </div>
            <div className="px-3 py-5 text-center sm:px-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Tradicionais</p>
              <p className="mt-1 text-sm font-bold text-muted-foreground sm:text-base">R$ 200+/mês + extras</p>
            </div>
          </div>

          {rows.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-[1.4fr_1fr_1fr] items-center ${i % 2 === 0 ? "bg-white/[0.015]" : ""}`}
            >
              <div className="px-5 py-4 text-sm font-medium text-foreground sm:px-8">
                {row.label}
              </div>
              <div className="border-x border-white/10 px-3 py-4 text-center sm:px-6">
                <Cell value={row.prime} highlight />
              </div>
              <div className="px-3 py-4 text-center sm:px-6">
                <Cell value={row.others} />
              </div>
            </div>
          ))}
        </motion.div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Tudo ilimitado por <span className="font-semibold text-gold">R$ 150/mês</span> — sem módulos extras.
        </p>
      </div>
    </section>
  );
}
