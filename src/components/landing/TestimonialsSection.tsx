import { Star } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Carlos Mendes",
    role: "Dono — Auto Premium",
    avatar: "CM",
    text: "Saí da papelada e da planilha. Hoje eu vejo o faturamento da oficina em tempo real do celular. Em 30 dias paguei a licença e ainda sobrou.",
  },
  {
    name: "Rafael Souza",
    role: "Gerente — Garage 48",
    avatar: "RS",
    text: "O WhatsApp automático mudou o jogo. O cliente recebe o aviso quando o carro fica pronto e não enche mais a recepção de ligação.",
  },
  {
    name: "Juliana Alves",
    role: "Sócia — Elite Service",
    avatar: "JA",
    text: "Buscar histórico pela placa do carro é o melhor recurso. Em 2 segundos eu vejo tudo que já fizemos no veículo do cliente.",
  },
  {
    name: "Marcos Ribeiro",
    role: "Mecânico chefe — TurboCar",
    avatar: "MR",
    text: "Acabou aquela bagunça de orçamento perdido. Aprovação digital, ordem de serviço no tablet e estoque baixando sozinho. Sensacional.",
  },
];

export function TestimonialsSection() {
  return (
    <section id="depoimentos" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
            Depoimentos
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Quem usa, não troca por nada
          </h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-colors hover:border-gold/30"
            >
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 fill-gold text-gold" />
                ))}
              </div>
              <p className="mb-6 flex-1 text-sm leading-relaxed text-foreground/90">
                “{t.text}”
              </p>
              <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold/30 to-amber-600/20 text-sm font-bold text-gold ring-1 ring-gold/30">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
