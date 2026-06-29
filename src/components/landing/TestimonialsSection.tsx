import { Star } from "lucide-react";
import { motion } from "framer-motion";

const testimonials = [
  {
    name: "Carlos Mendes",
    role: "Dono — Auto Premium",
    avatar: "CM",
    text: "Antes eu perdia 2 horas anotando tudo num caderno e abrindo o site do banco pra gerar Pix. Hoje eu crio a OS, e a cobrança sai na hora. A paz de espírito não tem preço.",
  },
  {
    name: "Rafael Souza",
    role: "Gerente — Garage 48",
    avatar: "RS",
    text: "Minha recepção vivia lotada de cliente perguntando 'Meu carro tá pronto?'. O robô de WhatsApp acabou com isso. O cliente recebe a mensagem no segundo que o mecânico dá baixa.",
  },
  {
    name: "Juliana Alves",
    role: "Sócia — Elite Service",
    avatar: "JA",
    text: "Nós usávamos um sistema antigo que precisava de curso pra aprender a clicar nos botões. O OficinaPrime é tão simples que o borracheiro aprendeu em 5 minutos no celular dele.",
  },
  {
    name: "Marcos Ribeiro",
    role: "Mecânico chefe — TurboCar",
    avatar: "MR",
    text: "Acabou aquela bagunça de comprar peça duplicada porque esqueceram de dar baixa. A peça entra na OS e já some do estoque. O sistema se paga só com o que economizamos de peça perdida.",
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
