import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, Wrench, Car, Users, FileText, BarChart3, MessageSquare,
  CheckCircle2, Clock, Smartphone, ShieldCheck, Star, MessageCircle,
} from "lucide-react";
import heroImg from "@/assets/hero-garage.jpg";

const features = [
  { icon: FileText, title: "Ordens de Serviço", desc: "Crie, acompanhe e finalize OS em segundos. Tudo organizado num só lugar." },
  { icon: Users, title: "Clientes & Veículos", desc: "Histórico completo de cada cliente e cada carro que passa pela sua oficina." },
  { icon: BarChart3, title: "Faturamento claro", desc: "Veja entradas, fechamentos e desempenho da oficina em tempo real." },
  { icon: MessageSquare, title: "WhatsApp integrado", desc: "Avise o cliente quando o carro estiver pronto com 1 clique." },
  { icon: Clock, title: "Agenda inteligente", desc: "Entradas, entregas e revisões organizadas. Nunca mais perca um horário." },
  { icon: Smartphone, title: "Funciona no celular", desc: "Use no escritório, na bancada ou na rua. Tudo responsivo." },
];

const plans = [
  {
    name: "Essencial", price: "97", featured: false,
    desc: "Para oficinas começando a se organizar.",
    features: ["Até 100 OS/mês", "1 usuário", "Clientes e veículos ilimitados", "WhatsApp manual", "Suporte por e-mail"],
  },
  {
    name: "Profissional", price: "197", featured: true,
    desc: "Para oficinas que querem crescer.",
    features: ["OS ilimitadas", "Até 5 usuários", "Agenda completa", "Relatórios financeiros", "Notificações automáticas", "Suporte prioritário"],
  },
  {
    name: "Premium", price: "397", featured: false,
    desc: "Para oficinas com várias unidades.",
    features: ["Tudo do Profissional", "Usuários ilimitados", "Multi-unidades", "API e integrações", "Gerente de conta", "Onboarding dedicado"],
  },
];

const testimonials = [
  { name: "Carlos R.", workshop: "Auto Center Ribeiro", text: "Em 2 semanas organizei 8 anos de bagunça. O OficinaPrime mudou meu negócio." },
  { name: "Patrícia M.", workshop: "Mecânica Express", text: "Faturei 30% a mais no primeiro mês só de não perder mais cliente esquecido." },
  { name: "Rodrigo L.", workshop: "Garage Premium", text: "Meus mecânicos amam. Os clientes amam. Eu amo. Simples assim." },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground">
              <Wrench className="h-5 w-5 text-primary" strokeWidth={2.5} />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              Oficina<span className="text-primary">Prime</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Depoimentos</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:inline-flex"><Button variant="ghost" size="sm">Entrar</Button></Link>
            <Link to="/signup"><Button variant="hero" size="sm">Começar grátis</Button></Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-hero text-background">
        <div className="absolute inset-0 grid-pattern opacity-60" />
        <div className="absolute -right-40 top-1/2 h-[600px] w-[600px] -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]" />

        <div className="container relative grid gap-12 py-20 md:py-28 lg:grid-cols-2 lg:items-center">
          <div className="animate-fade-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-background/10 bg-background/5 px-4 py-1.5 text-xs font-medium text-background/80 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Sistema de gestão para oficinas mecânicas
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-6xl lg:text-7xl">
              Sua oficina,<br />
              <span className="text-primary">no controle</span>.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-background/70 md:text-xl">
              Gerencie ordens de serviço, clientes, veículos e faturamento em um só lugar.
              Simples, rápido e profissional — feito para quem não tem tempo a perder.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link to="/signup">
                <Button variant="hero" size="xl" className="group w-full sm:w-auto">
                  Testar grátis por 14 dias
                  <ArrowRight className="transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <a href="#features">
                <Button variant="outline" size="xl" className="w-full border-background/20 bg-transparent text-background hover:bg-background/10 hover:text-background sm:w-auto">
                  Ver recursos
                </Button>
              </a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-background/60">
              {["Sem cartão de crédito", "Setup em 5 minutos", "Suporte em português"].map((t) => (
                <div key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {t}
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="absolute inset-0 rounded-3xl bg-primary/30 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl border border-background/10 shadow-elevated">
              <img src={heroImg} alt="Motor de carro com iluminação amarela em estúdio escuro" width={1536} height={1024} className="h-full w-full object-cover" />
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-border bg-secondary/40">
        <div className="container grid grid-cols-2 gap-8 py-12 md:grid-cols-4">
          {[
            { v: "+1.200", l: "Oficinas ativas" },
            { v: "98%", l: "Satisfação" },
            { v: "5min", l: "Setup completo" },
            { v: "24/7", l: "Disponibilidade" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="font-display text-3xl font-bold md:text-4xl">{s.v}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recursos</span>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Tudo que sua oficina precisa.</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Ferramentas simples e diretas para você focar no que importa: consertar carros e atender bem.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-foreground text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="border-t border-border bg-secondary/30 py-24">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Planos</span>
            <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Preço justo. Sem surpresas.</h2>
            <p className="mt-4 text-lg text-muted-foreground">14 dias grátis em qualquer plano. Cancele quando quiser.</p>
          </div>

          <div className="mt-16 grid gap-6 lg:grid-cols-3">
            {plans.map((p) => (
              <div key={p.name} className={`relative flex flex-col rounded-3xl border p-8 ${p.featured ? "border-primary bg-card shadow-elevated lg:scale-105" : "border-border bg-card"}`}>
                {p.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                    MAIS POPULAR
                  </div>
                )}
                <h3 className="font-display text-xl font-bold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-2xl font-semibold">R$</span>
                  <span className="font-display text-5xl font-bold tracking-tight">{p.price}</span>
                  <span className="text-sm text-muted-foreground">/mês</span>
                </div>
                <ul className="mt-6 space-y-3 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="mt-8">
                  <Button variant={p.featured ? "hero" : "outline"} size="lg" className="w-full">
                    Começar grátis
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="container py-24">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Depoimentos</span>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">Quem usa, recomenda.</h2>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <div key={t.name} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-4 flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="text-sm leading-relaxed">"{t.text}"</p>
              <div className="mt-5 border-t border-border pt-4">
                <p className="font-semibold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground">{t.workshop}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container pb-24">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-hero p-10 text-background md:p-16">
          <div className="absolute inset-0 grid-pattern opacity-40" />
          <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <Car className="mb-4 h-10 w-10 text-primary" />
              <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                Pronto para profissionalizar sua oficina?
              </h2>
              <p className="mt-3 max-w-xl text-background/70">
                Junte-se a centenas de oficinas que já organizaram a operação com o OficinaPrime.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link to="/signup"><Button variant="hero" size="xl" className="w-full">Começar agora</Button></Link>
              <a href="https://wa.me/5511999999999?text=Quero%20saber%20mais%20sobre%20o%20OficinaPrime" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="xl" className="w-full border-background/20 bg-transparent text-background hover:bg-background/10 hover:text-background gap-2">
                  <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border">
        <div className="container flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-foreground">
              <Wrench className="h-4 w-4 text-primary" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold">OficinaPrime</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link to="/login" className="hover:text-foreground">Entrar</Link>
            <Link to="/signup" className="hover:text-foreground">Criar conta</Link>
            <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Dados seguros</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 OficinaPrime. Feito para oficinas que andam pra frente.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
