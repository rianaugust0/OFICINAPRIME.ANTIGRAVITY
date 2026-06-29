import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, TrendingDown, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

export function RoiCalculatorSection() {
  const [osCount, setOsCount] = useState(50);
  
  // Lógica simples de cálculo de dor:
  // Assume-se que a oficina perde cerca de R$ 30 por OS por esquecer de cobrar spray/parafusos/miudezas (estoque sem baixa auto)
  // Assume-se que perdem 10% das vendas (ticket medio 300) por orçamento não respondido (sem auto whatsapp)
  const ticketMedio = 350;
  const pecasNaoCobradas = osCount * 35; // R$ 35 de perda por OS
  const clientesPerdidos = Math.floor(osCount * 0.1); 
  const faturamentoPerdidoVendas = clientesPerdidos * ticketMedio;
  
  const prejuizoTotal = pecasNaoCobradas + faturamentoPerdidoVendas;

  return (
    <section id="roi-calculator" className="relative py-24 lg:py-32 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-destructive/5 blur-3xl opacity-50" />
      
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-destructive/20 bg-background/80 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            
            {/* Esquerda: Interação */}
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                <Calculator className="h-3.5 w-3.5" />
                Calculadora de Prejuízo
              </div>
              <h2 className="mb-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Descubra quanto dinheiro o seu sistema velho está vazando.
              </h2>
              <p className="mb-8 text-muted-foreground">
                Arraste para o lado e selecione a quantidade média de Ordens de Serviço que a sua oficina faz por mês:
              </p>
              
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold">Volume Mensal:</span>
                  <span className="text-2xl font-black text-gold">{osCount} OS/mês</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="300" 
                  step="5"
                  value={osCount} 
                  onChange={(e) => setOsCount(Number(e.target.value))}
                  className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
                />
              </div>
            </div>

            {/* Direita: Resultado */}
            <motion.div 
              key={osCount}
              initial={{ opacity: 0.8, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center shadow-inner"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20 text-destructive">
                <TrendingDown className="h-8 w-8" />
              </div>
              <p className="text-sm font-semibold uppercase tracking-widest text-destructive">
                Prejuízo Estimado
              </p>
              <div className="my-4 flex items-baseline justify-center gap-2">
                <span className="text-2xl text-muted-foreground font-medium">R$</span>
                <span className="text-6xl font-black text-foreground">
                  {prejuizoTotal.toLocaleString("pt-BR")}
                </span>
                <span className="text-xl text-muted-foreground">/mês</span>
              </div>
              
              <div className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground text-left bg-black/20 p-4 rounded-xl border border-white/5">
                <p>📉 <b>R$ {pecasNaoCobradas.toLocaleString("pt-BR")}</b> esquecidos em peças não lançadas.</p>
                <p>👻 <b>{clientesPerdidos} clientes</b> perdidos por falta de orçamentos rápidos pelo WhatsApp.</p>
              </div>

              <Link
                to="/signup"
                onClick={() => trackEvent("click_testar_gratis", { source: "roi_calculator" })}
                className="mt-8 group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-6 py-4 text-base font-bold text-background transition-all hover:bg-foreground/90 hover:scale-[1.02]"
              >
                Estancar Sangria (Testar Grátis)
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
