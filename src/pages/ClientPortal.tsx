import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Car, CheckCircle2, ChevronRight, Clock, MapPin, MessageCircle, 
  Phone, Receipt, ShieldCheck, Wrench, AlertCircle, Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatBRL = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const timelineSteps = [
  { id: "recebido", label: "Recebido", desc: "Veículo na oficina" },
  { id: "em_analise", label: "Em Análise", desc: "Avaliando problemas" },
  { id: "aguardando_aprovacao", label: "Aprovação", desc: "Aguardando seu ok" },
  { id: "em_manutencao", label: "Manutenção", desc: "Serviço em andamento" },
  { id: "pronto", label: "Pronto", desc: "Pode retirar" },
  { id: "entregue", label: "Entregue", desc: "Serviço concluído" }
];

export default function ClientPortal() {
  const { token } = useParams<{ token: string }>();
  const qc = useQueryClient();
  const [activeOsId, setActiveOsId] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["portal-data", token],
    enabled: !!token,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_portal_data", { p_token: token });
      if (error) throw error;
      if (!data) throw new Error("Token inválido ou expirado.");
      return data;
    }
  });

  const approveMut = useMutation({
    mutationFn: async (orderId: string) => {
      const { data, error } = await supabase.rpc("approve_portal_order", { p_token: token, p_order_id: orderId });
      if (error) throw error;
      if (!data) throw new Error("Não foi possível aprovar.");
      return data;
    },
    onSuccess: () => {
      toast.success("Orçamento aprovado com sucesso!");
      qc.invalidateQueries({ queryKey: ["portal-data", token] });
    },
    onError: (e: Error) => toast.error(e.message)
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary/30 p-4 pb-24 md:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-secondary/30 p-4 text-center">
        <div className="rounded-full bg-destructive/10 p-4 text-destructive mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="font-display text-2xl font-bold">Link inválido ou expirado</h1>
        <p className="mt-2 text-muted-foreground">Este link de acesso não é mais válido. Solicite um novo à oficina.</p>
      </div>
    );
  }

  const { workshop, client, vehicles, orders } = data;
  const activeOrder = orders.length > 0 ? (activeOsId ? orders.find((o: { id: string }) => o.id === activeOsId) : orders[0]) : null;
  const totalSpent = orders.reduce((acc: number, o: { amount: number }) => acc + Number(o.amount || 0), 0);

  const getStepStatus = (stepId: string, currentStatus: string) => {
    const currentIndex = timelineSteps.findIndex(s => s.id === currentStatus);
    const stepIndex = timelineSteps.findIndex(s => s.id === stepId);
    
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  const handleWhatsApp = () => {
    if (!workshop.whatsapp) return;
    const msg = `Olá! Sou o(a) ${client.name}, estou acessando meu portal e gostaria de falar sobre meu veículo.`;
    window.open(`https://wa.me/55${workshop.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-secondary/30 pb-24 font-sans text-foreground">
      {/* Header Premium */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {workshop.logo_url ? (
              <img src={workshop.logo_url} alt="Logo" className="h-8 w-8 rounded-md object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
                {workshop.name.charAt(0)}
              </div>
            )}
            <span className="font-display font-semibold tracking-tight">{workshop.name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleWhatsApp} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
            <MessageCircle className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl p-4 md:p-6 space-y-6">
        {/* Saudação e Resumo */}
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-bold tracking-tight">Olá, {client.name.split(" ")[0]} 👋</h1>
          <p className="text-sm text-muted-foreground">Acompanhe seus veículos e serviços em tempo real.</p>
        </div>

        {/* Card Veículos */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="p-4 border-border/60 bg-gradient-to-br from-card to-secondary/20 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Seu Veículo</p>
                {vehicles.length > 0 ? (
                  <>
                    <h3 className="font-display text-lg font-bold">{vehicles[0].brand} {vehicles[0].model}</h3>
                    {vehicles[0].plate && <span className="inline-block mt-1 bg-muted px-2 py-0.5 rounded text-xs font-mono border">{vehicles[0].plate}</span>}
                  </>
                ) : (
                  <p className="font-medium">Nenhum veículo cadastrado</p>
                )}
              </div>
              <div className="bg-primary/15 text-primary p-2 rounded-full">
                <Car className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4 border-border/60 bg-gradient-to-br from-card to-secondary/20 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Total Investido</p>
                <h3 className="font-display text-2xl font-bold">{formatBRL(totalSpent)}</h3>
                <p className="text-xs text-muted-foreground mt-1">Em {orders.length} serviços realizados</p>
              </div>
              <div className="bg-emerald-500/15 text-emerald-600 p-2 rounded-full">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Ordem de Serviço Ativa */}
        {activeOrder ? (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Ordem de Serviço Atual</h2>
              <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">OS-{String(activeOrder.number).padStart(4, "0")}</span>
            </div>
            
            <Card className="overflow-hidden border-border/60 shadow-sm relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              
              <div className="p-5 border-b border-border/50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-base">{activeOrder.service_done || activeOrder.reported_problem || "Manutenção"}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5"><Clock className="h-3 w-3" /> Entrada: {format(new Date(activeOrder.entry_date), "dd/MM/yyyy", { locale: ptBR })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-xl font-bold text-primary">{formatBRL(activeOrder.amount)}</p>
                  </div>
                </div>

                {/* Timeline */}
                <div className="mt-8 relative px-2">
                  <div className="absolute top-2.5 left-6 right-6 h-0.5 bg-border -z-10" />
                  
                  <div className="flex justify-between relative">
                    {timelineSteps.map((step) => {
                      const status = getStepStatus(step.id, activeOrder.status);
                      return (
                        <div key={step.id} className="flex flex-col items-center group relative w-16">
                          <div className={cn(
                            "h-6 w-6 rounded-full flex items-center justify-center border-2 transition-colors mb-2 z-10",
                            status === "completed" ? "bg-primary border-primary text-primary-foreground" :
                            status === "current" ? "bg-background border-primary text-primary" :
                            "bg-background border-border text-muted-foreground"
                          )}>
                            {status === "completed" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <div className={cn("h-2 w-2 rounded-full", status === "current" ? "bg-primary" : "bg-transparent")} />}
                          </div>
                          
                          <span className={cn(
                            "text-[10px] font-semibold uppercase text-center leading-tight",
                            status === "current" ? "text-primary" : "text-muted-foreground"
                          )}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="bg-secondary/20 p-4">
                {activeOrder.status === "aguardando_aprovacao" && !activeOrder.is_approved && (
                  <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                      <div>
                        <h4 className="font-semibold text-amber-900 dark:text-amber-400 text-sm">Aprovação Necessária</h4>
                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-1 mb-3">A oficina enviou um orçamento para aprovação. Revise os valores e autorize o serviço.</p>
                        <Button 
                          onClick={() => approveMut.mutate(activeOrder.id)} 
                          disabled={approveMut.isPending}
                          className="w-full sm:w-auto bg-amber-500 hover:bg-amber-600 text-white gap-2"
                        >
                          {approveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                          Aprovar Serviço
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <Button variant="outline" className="w-full gap-2 border-primary/20 hover:bg-primary/5 text-primary" onClick={handleWhatsApp}>
                  <MessageCircle className="h-4 w-4" /> Falar com o mecânico
                </Button>
              </div>
            </Card>
          </section>
        ) : (
          <Card className="p-8 text-center border-dashed border-border/60">
            <Wrench className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhuma Ordem de Serviço encontrada.</p>
          </Card>
        )}

        {/* Histórico Resumido */}
        {orders.length > 1 && (
          <section className="space-y-3 pt-4">
            <h2 className="font-display text-lg font-bold">Histórico</h2>
            <div className="space-y-3">
              {orders.filter((o: { id: string }) => o.id !== activeOrder?.id).slice(0, 5).map((o: { id: string; service_done: string; reported_problem: string; number: number; entry_date: string; amount: number }) => (
                <button 
                  key={o.id} 
                  onClick={() => setActiveOsId(o.id)}
                  className="w-full text-left bg-card hover:bg-secondary/40 transition-colors border border-border/60 rounded-xl p-4 flex items-center justify-between shadow-sm"
                >
                  <div>
                    <h4 className="font-semibold text-sm">{o.service_done || o.reported_problem || "Manutenção"}</h4>
                    <p className="text-xs text-muted-foreground mt-1">OS-{String(o.number).padStart(4, "0")} • {format(new Date(o.entry_date), "dd/MM/yyyy")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display font-bold">{formatBRL(o.amount)}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
