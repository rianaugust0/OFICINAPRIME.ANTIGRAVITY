import {
  LayoutDashboard,
  Wrench,
  DollarSign,
  Users,
  Rocket,
  Calendar,
  Package,
  FileText,
  TrendingUp,
  Car,
  MessageCircle,
  Bell,
} from "lucide-react";
import { motion } from "framer-motion";

const modules = [
  {
    icon: LayoutDashboard,
    tag: "Visão Geral",
    title: "Dashboard inteligente",
    description:
      "Acompanhe faturamento, funil de OS e indicadores da oficina em tempo real, com gráficos claros e objetivos.",
    bullets: [
      { icon: TrendingUp, label: "Gráficos de faturamento" },
      { icon: FileText, label: "Funil de Ordens de Serviço" },
    ],
  },
  {
    icon: Wrench,
    tag: "Oficina & Estoque",
    title: "Estoque Anti-Desperdício",
    description:
      "A peça foi pra OS? O sistema subtrai do estoque. Chega de comprar peças duplicadas ou perder dinheiro porque esqueceu de anotar.",
    bullets: [
      { icon: Package, label: "Baixa automática na OS" },
      { icon: Calendar, label: "Controle sem planilhas" },
    ],
  },
  {
    icon: DollarSign,
    tag: "Faturamento e NF-e",
    title: "Emita Notas e Pix na Hora",
    description:
      "Pare de abrir o site do banco. Gere links de cobrança Pix e emita Notas Fiscais automaticamente de dentro da Ordem de Serviço.",
    bullets: [
      { icon: FileText, label: "NF-e em 1 clique" },
      { icon: DollarSign, label: "Acabe com a inadimplência" },
    ],
  },
  {
    icon: Users,
    tag: "Relacionamento (CRM)",
    title: "Cliente e veículo na palma da mão",
    description:
      "Cadastro de clientes, veículos e fornecedores com histórico completo de serviços — busque pela placa do carro.",
    bullets: [
      { icon: Car, label: "Histórico pela placa" },
      { icon: Users, label: "Cadastro de fornecedores" },
    ],
  },
  {
    icon: Rocket,
    tag: "Comunicação (Robô)",
    title: "WhatsApp trabalhando por você",
    description:
      "Carro ficou pronto? Seu cliente recebe um alerta no WhatsApp. Sem você precisar pegar o celular e digitar uma palavra sequer.",
    bullets: [
      { icon: MessageCircle, label: "Alertas Automáticos" },
      { icon: Bell, label: "Lembretes de revisão (CRM)" },
    ],
  },
];

export function FeaturesSection() {
  return (
    <section id="recursos" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-3 py-1 text-xs font-medium text-gold">
            Funcionalidades Premium
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
            Sistemas velhos dão dor de cabeça. O OficinaPrime dá lucro.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Esqueça aquele sistema cinza que você precisa de curso para usar. Nós criamos um ecossistema que faz o trabalho chato por você.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => (
            <motion.div
              key={m.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-gold/30 hover:bg-white/[0.05] ${
                i === 4 ? "lg:col-span-1" : ""
              }`}
            >
              {/* Hover glow */}
              <div className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(400px circle at 50% 0%, var(--gold-glow), transparent 60%)",
                }}
              />

              <div className="relative">
                <div className="mb-5 flex items-center gap-3">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 text-gold ring-1 ring-gold/20">
                    <m.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider text-gold/80">
                    {m.tag}
                  </span>
                </div>

                <h3 className="mb-2 text-xl font-semibold text-foreground">
                  {m.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {m.description}
                </p>

                <ul className="mt-5 space-y-2 border-t border-white/5 pt-4">
                  {m.bullets.map((b) => (
                    <li
                      key={b.label}
                      className="flex items-center gap-2 text-sm text-foreground/80"
                    >
                      <b.icon className="h-4 w-4 text-gold" />
                      {b.label}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
