import { useState } from "react";
import { Check, CreditCard, ShieldCheck } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";

const plans = [
  {
    id: "price_1TlelbGYDeFYiKXnst7igvyo",
    name: "Essencial",
    description: "Para oficinas pequenas começando a se organizar.",
    price: "97",
    popular: false,
    features: ["OS Ilimitadas", "Cadastro de Clientes", "Veículos", "Suporte por Email"]
  },
  {
    id: "price_1TlelqGYDeFYiKXnHWF8BeFH",
    name: "Profissional",
    description: "Para oficinas que querem controle total financeiro.",
    price: "147",
    popular: true,
    features: ["Tudo do Essencial", "Módulo Financeiro", "Controle de Estoque", "Suporte Prioritário WhatsApp"]
  },
  {
    id: "price_1Tlem4GYDeFYiKXng6sSl994",
    name: "Premium",
    description: "A solução definitiva com automações de venda.",
    price: "247",
    popular: false,
    features: ["Tudo do Profissional", "Automação WhatsApp", "Relatórios Avançados", "Múltiplos Usuários (Equipe)"]
  }
];

export default function Subscription() {
  const { workshop, workshopId } = useAuth();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);

  const trialEnds = workshop?.workshops?.trial_ends_at ? new Date(workshop.workshops.trial_ends_at) : new Date();
  const isExpired = isPast(trialEnds);
  const isTrialing = workshop?.workshops?.subscription_status === 'trialing';
  const isActive = workshop?.workshops?.subscription_status === 'active' || workshop?.workshops?.subscription_status === 'past_due';

  const handleSubscribe = async (planId: string) => {
    if (!workshopId) {
      toast.error("Erro: Sua conta não está vinculada a nenhuma oficina no banco de dados!");
      return;
    }

    setLoadingPlan(planId);
    try {
      // Call Supabase Edge Function to create Stripe Checkout Session
      const { data, error } = await supabase.functions.invoke('create-checkout', { body: { planId, workshopId } });
      
      if (error) {
        // Tenta ler o corpo do erro, pois o Supabase envia um objeto com o JSON da nossa Response(400)
        let errorMsg = error.message;
        try {
          const context = await error.context?.json();
          if (context && context.error) errorMsg = context.error;
        } catch(e) {}
        throw new Error(errorMsg);
      }

      if (data?.url) {
        window.location.href = data.url;
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error("Erro desconhecido. Dados recebidos: " + JSON.stringify(data));
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao processar assinatura");
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    if (!workshopId) return;
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', { body: { workshopId } });
      
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Erro desconhecido ao gerar o link do portal.");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao acessar o portal do cliente");
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-secondary/30">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              <h1 className="font-display text-lg font-semibold tracking-tight">Assinatura e Planos</h1>
            </div>
          </header>

          <div className="p-4 md:p-8 flex-1 overflow-y-auto max-w-5xl mx-auto w-full space-y-8">
            
            <div className="text-center space-y-2 mt-4">
              <h2 className="text-3xl font-display font-bold">Escolha o melhor plano para sua Oficina</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {isActive ? (
                  <span className="font-bold text-primary">Sua assinatura está ativa. Obrigado por ser Prime!</span>
                ) : isTrialing && !isExpired ? (
                  <>Você está no período de teste. Aproveite o sistema gratuitamente por mais <span className="font-bold text-primary">{formatDistanceToNow(trialEnds, { locale: ptBR })}</span>.</>
                ) : isTrialing && isExpired ? (
                  <span className="text-destructive font-bold">Seu período de teste expirou! Assine agora para continuar usando.</span>
                ) : (
                  "Gerencie sua assinatura e cobranças."
                )}
              </p>
            </div>

            {isActive ? (
              <Card className="max-w-md mx-auto border-primary/20 shadow-md">
                <CardHeader className="text-center">
                  <div className="mx-auto bg-emerald-500/10 text-emerald-600 p-4 rounded-full mb-4 w-fit">
                    <ShieldCheck className="w-10 h-10" />
                  </div>
                  <CardTitle className="text-2xl font-display">Assinatura Ativa</CardTitle>
                  <CardDescription>Você tem acesso total aos recursos da plataforma.</CardDescription>
                </CardHeader>
                <CardContent className="text-center pb-6">
                  <p className="text-muted-foreground mb-6">
                    Acesse o Portal do Cliente para visualizar suas faturas, alterar o cartão de crédito ou cancelar sua assinatura.
                  </p>
                  <Button 
                    size="lg" 
                    className="w-full font-bold" 
                    onClick={handleManageSubscription}
                    disabled={loadingPortal}
                  >
                    {loadingPortal ? "Aguarde..." : "Gerenciar Assinatura"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-3 gap-6 pt-6">
                {plans.map((plan) => (
                  <Card key={plan.id} className={`relative flex flex-col ${plan.popular ? 'border-primary shadow-lg md:scale-105 z-10' : 'border-border/60'}`}>
                    {plan.popular && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                        Mais Escolhido
                      </div>
                    )}
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-2xl font-display">{plan.name}</CardTitle>
                      <CardDescription className="h-10">{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center flex-1">
                      <div className="my-4 flex items-baseline justify-center gap-1">
                        <span className="text-xl font-semibold text-muted-foreground">R$</span>
                        <span className="text-5xl font-black tracking-tight">{plan.price}</span>
                        <span className="text-muted-foreground">/mês</span>
                      </div>
                      
                      <ul className="space-y-3 mt-8 text-left text-sm">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-3">
                            <div className="h-5 w-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                              <Check className="h-3.5 w-3.5" />
                            </div>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full font-bold" 
                        variant={plan.popular ? "default" : "outline"}
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={loadingPlan === plan.id}
                      >
                        {loadingPlan === plan.id ? "Aguarde..." : "Assinar Agora"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground pt-8 pb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Pagamento 100% seguro processado pelo Stripe
            </div>

          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
