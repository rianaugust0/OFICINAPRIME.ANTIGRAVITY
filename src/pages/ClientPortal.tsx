import { useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Car, CheckCircle2, CircleDashed, Clock, ShieldCheck, Wrench, AlertCircle, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const formatBRL = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ClientPortal() {
  const { id } = useParams();
  const qc = useQueryClient();

  // Fetch the OS and all related data
  // We use the anon key. If RLS blocks relations, we'll only get the order data.
  const { data: os, isLoading, error } = useQuery({
    queryKey: ["portal_os", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          workshops(name),
          vehicles(brand, model, plate, year, color, photo_url),
          clients(name, phone)
        `)
        .eq("id", id)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  const { data: items } = useQuery({
    queryKey: ["portal_os_items", id],
    enabled: !!id,
    queryFn: async () => {
      // First try to get services
      const { data: services } = await supabase.from("services").select("*").eq("order_id", id);
      // Then parts
      const { data: parts } = await supabase.from("parts").select("*").eq("order_id", id);
      
      return {
        services: services || [],
        parts: parts || []
      };
    }
  });

  const approveMut = useMutation({
    mutationFn: async () => {
      // Approving budget
      const { error } = await supabase.from("orders").update({ status: "approved" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Orçamento aprovado com sucesso! O mecânico já foi notificado.");
      qc.invalidateQueries({ queryKey: ["portal_os", id] });
    },
    onError: (e: Error) => toast.error("Erro ao aprovar: " + e.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !os) {
    return (
      <div className="min-h-screen bg-secondary/30 flex flex-col items-center justify-center p-4 text-center">
        <div className="h-20 w-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold font-display tracking-tight mb-2">Ordem de Serviço não encontrada</h1>
        <p className="text-muted-foreground">O link pode estar quebrado ou a OS foi excluída pelo estabelecimento.</p>
      </div>
    );
  }

  const v = os.vehicles;
  const w = os.workshops;
  const totalServices = items?.services.reduce((acc, s) => acc + Number(s.price), 0) || 0;
  const totalParts = items?.parts.reduce((acc, p) => acc + (Number(p.price) * Number(p.quantity)), 0) || 0;
  const total = Number(os.amount) || (totalServices + totalParts);

  const statuses = [
    { id: "pending", label: "Na Fila", icon: Clock },
    { id: "budget", label: "Orçamento", icon: FileText },
    { id: "approved", label: "Em Serviço", icon: Wrench },
    { id: "finished", label: "Pronto", icon: CheckCircle2 },
  ];

  const currentStatusIndex = statuses.findIndex(s => s.id === os.status);

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 font-sans pb-24 selection:bg-primary/40">
      {/* Header Premium */}
      <header className="bg-black/80 backdrop-blur-xl border-b border-white/5 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Wrench className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-display font-bold tracking-tight text-white">{w?.name || "OficinaPrime"}</span>
          </div>
          <Badge status={os.status} />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 mt-8 space-y-8">
        
        {/* Foto do Veículo e Titulo */}
        <section className="relative rounded-3xl overflow-hidden bg-secondary/20 border border-white/5 flex flex-col sm:flex-row items-center p-6 gap-6 shadow-2xl">
          <div className="w-32 h-32 shrink-0 rounded-2xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center relative">
            {v?.photo_url ? (
              <img src={v.photo_url} alt="Veículo" className="w-full h-full object-cover" />
            ) : (
              <Car className="h-12 w-12 text-slate-600" />
            )}
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-primary font-bold tracking-widest uppercase text-xs mb-1">OS #{os.id.split('-')[0]}</p>
            <h1 className="text-3xl font-display font-black text-white">{v?.brand} {v?.model}</h1>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3 text-sm text-slate-400">
              {v?.plate && <span className="bg-black/50 px-2.5 py-1 rounded border border-white/5 font-mono text-white tracking-widest">{v.plate}</span>}
              {v?.year && <span>{v.year}</span>}
              {v?.color && <span className="capitalize">{v.color}</span>}
            </div>
          </div>
        </section>

        {/* Timeline Visual */}
        <section className="bg-secondary/20 rounded-3xl border border-white/5 p-6 md:p-8">
          <h2 className="text-lg font-bold text-white mb-8">Linha do Tempo</h2>
          <div className="relative">
            <div className="absolute left-[21px] top-4 bottom-4 w-0.5 bg-white/5" />
            <div className="space-y-8">
              {statuses.map((step, idx) => {
                const isCompleted = currentStatusIndex >= idx;
                const isCurrent = currentStatusIndex === idx;
                const Icon = step.icon;

                return (
                  <div key={step.id} className="relative flex items-center gap-6">
                    <div className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center border-4 border-[#050505] transition-colors duration-500 ${isCompleted ? 'bg-primary text-primary-foreground' : 'bg-secondary text-slate-500'}`}>
                      <Icon className="h-5 w-5" />
                      {isCurrent && (
                        <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-50" />
                      )}
                    </div>
                    <div>
                      <p className={`font-bold text-lg ${isCompleted ? 'text-white' : 'text-slate-500'}`}>{step.label}</p>
                      {isCurrent && <p className="text-sm text-primary">Estágio atual</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Serviços e Orçamento */}
        <section className="bg-secondary/20 rounded-3xl border border-white/5 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Resumo do Serviço</h2>
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
          </div>
          
          <div className="space-y-6">
            {/* Descrição do problema */}
            {os.description && (
              <div className="bg-black/40 rounded-2xl p-4 border border-white/5">
                <p className="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2">Relato Inicial</p>
                <p className="text-sm leading-relaxed text-slate-300">{os.description}</p>
              </div>
            )}

            {/* Itens */}
            {(items?.services.length > 0 || items?.parts.length > 0) && (
              <div className="space-y-4">
                <p className="text-xs uppercase tracking-widest font-bold text-slate-500">Orçamento Detalhado</p>
                <div className="divide-y divide-white/5 border border-white/5 rounded-2xl overflow-hidden bg-black/20">
                  {items.services.map((s: any) => (
                    <div key={s.id} className="flex justify-between p-4 text-sm hover:bg-white/[0.02] transition-colors">
                      <span className="text-slate-300">{s.name} <span className="text-slate-500 text-xs ml-2">(Mão de obra)</span></span>
                      <span className="font-mono text-white">{formatBRL(s.price)}</span>
                    </div>
                  ))}
                  {items.parts.map((p: any) => (
                    <div key={p.id} className="flex justify-between p-4 text-sm hover:bg-white/[0.02] transition-colors">
                      <span className="text-slate-300">{p.quantity}x {p.name} <span className="text-slate-500 text-xs ml-2">(Peça)</span></span>
                      <span className="font-mono text-white">{formatBRL(p.price * p.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <span className="text-lg text-slate-400">Total Previsto</span>
              <span className="text-3xl font-display font-black text-white">{formatBRL(total)}</span>
            </div>
          </div>
        </section>
      </main>

      {/* Floating Action Bar */}
      {os.status === "budget" && (
        <div className="fixed bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent pb-8">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row gap-3">
            <Button 
              size="xl" 
              variant="hero" 
              className="flex-1 rounded-2xl h-16 text-lg font-bold shadow-[0_0_40px_rgba(245,196,0,0.3)] animate-pulse"
              onClick={() => approveMut.mutate()}
              disabled={approveMut.isPending}
            >
              Aprovar Orçamento
            </Button>
            <Button size="xl" variant="outline" className="rounded-2xl h-16 bg-secondary/80 border-white/10 hover:bg-secondary">
              Falar com o Mecânico
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: "Na Fila", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
    budget: { label: "Aguardando Aprovação", color: "bg-amber-500/20 text-amber-500 border-amber-500/30" },
    approved: { label: "Em Serviço", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    finished: { label: "Pronto para Retirada", color: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30" },
  };
  const config = map[status] || map.pending;

  return (
    <div className={`px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${config.color}`}>
      {config.label}
    </div>
  );
}
