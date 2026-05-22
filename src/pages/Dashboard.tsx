import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Wrench,
  CheckCircle2,
  ClipboardList,
  TrendingUp,
  PhoneCall,
  Search,
  Bell,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, startOfDay, startOfMonth, subDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, BarChart, Bar } from "recharts";

type Status =
  | "aguardando"
  | "em_andamento"
  | "recebido"
  | "em_analise"
  | "aguardando_aprovacao"
  | "em_manutencao"
  | "pronto"
  | "entregue";

const statusMap: Record<Status, { label: string; className: string; dot: string }> = {
  aguardando: {
    label: "Aguardando",
    className: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    dot: "bg-amber-500",
  },

  em_andamento: {
    label: "Em andamento",
    className: "bg-primary/15 text-foreground border-primary/30",
    dot: "bg-primary",
  },

  recebido: {
    label: "Recebido",
    className: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },

  em_analise: {
    label: "Em Análise",
    className: "bg-purple-500/10 text-purple-600 border-purple-500/30",
    dot: "bg-purple-500",
  },

  aguardando_aprovacao: {
    label: "Aguardando Aprovação",
    className: "bg-amber-500/10 text-amber-700 border-amber-500/30",
    dot: "bg-amber-500",
  },

  em_manutencao: {
    label: "Em Manutenção",
    className: "bg-primary/15 text-foreground border-primary/30",
    dot: "bg-primary",
  },

  pronto: {
    label: "Pronto",
    className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
    dot: "bg-emerald-500",
  },

  entregue: {
    label: "Entregue",
    className: "bg-muted text-muted-foreground border-border",
    dot: "bg-muted-foreground",
  },
};


const formatBRL = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const Dashboard = () => {
  const { workshopId, user, workshop } = useAuth();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats-full", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const today = new Date();
      const todayStart = startOfDay(today).toISOString();
      const monthStart = startOfMonth(today).toISOString();

      const [orders, clients] = await Promise.all([
        supabase.from("orders").select("id, status, amount, paid, paid_at, updated_at").eq("workshop_id", workshopId!),
        supabase.from("clients").select("id", { count: "exact", head: true }).eq("workshop_id", workshopId!),
      ]);

      const allOrders = orders.data ?? [];

      const paidOrders = allOrders.filter(o => o.paid && o.paid_at);
      const todayRevenue = paidOrders.filter(o => isAfter(new Date(o.paid_at!), new Date(todayStart))).reduce((s, o) => s + Number(o.amount || 0), 0);
      const monthRevenue = paidOrders.filter(o => isAfter(new Date(o.paid_at!), new Date(monthStart))).reduce((s, o) => s + Number(o.amount || 0), 0);

      const ticketMedio = paidOrders.length > 0 ? (paidOrders.reduce((s, o) => s + Number(o.amount || 0), 0) / paidOrders.length) : 0;

      const chartData = Array.from({ length: 7 }).map((_, i) => {
        const d = subDays(today, 6 - i);
        return {
          day: format(d, "EEE", { locale: ptBR }),
          value: paidOrders.filter(o => format(new Date(o.paid_at!), "yyyy-MM-dd") === format(d, "yyyy-MM-dd")).reduce((s, o) => s + Number(o.amount || 0), 0)
        };
      });

      const statusData = [
        { name: "Recebido/Análise", value: allOrders.filter(o => o.status === "recebido" || o.status === "em_analise").length, fill: "hsl(var(--muted-foreground))" },
        { name: "Aguardando", value: allOrders.filter(o => o.status === "aguardando_aprovacao").length, fill: "hsl(var(--warning))" },
        { name: "Manutenção", value: allOrders.filter(o => o.status === "em_manutencao").length, fill: "hsl(var(--primary))" },
        { name: "Pronto", value: allOrders.filter(o => o.status === "pronto").length, fill: "hsl(var(--success))" },
      ];

      return {
        emAndamento: allOrders.filter((o) => o.status === "em_manutencao").length,
        prontos: allOrders.filter((o) => o.status === "pronto").length,
        abertas: allOrders.filter((o) => o.status !== "entregue").length,
        entregues: allOrders.filter((o) => o.status === "entregue").length,
        todayRevenue,
        monthRevenue,
        ticketMedio,
        pendentes: allOrders.filter((o) => !o.paid && o.status !== "recebido" && o.status !== "em_analise" && o.status !== "aguardando_aprovacao").length,
        clientesCount: clients.count ?? 0,
        chartData,
        statusData
      };
    },
  });

  const { data: recentOrders, isLoading: loadingOrders } = useQuery({
    queryKey: ["dashboard-recent-orders", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("id, number, status, amount, updated_at, reported_problem, service_done, clients(name), vehicles(brand, model, plate)")
        .eq("workshop_id", workshopId!)
        .order("updated_at", { ascending: false })
        .limit(6);
      return data ?? [];
    },
  });

  const firstName = ((user?.user_metadata?.full_name as string) || user?.email || "").split(" ")[0] || "Bem-vindo";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-secondary/30">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="hidden flex-1 md:block">
              <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar OS, cliente, placa…" className="h-10 border-border bg-secondary/60 pl-10 focus-visible:bg-background" />
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Link to="/notificacoes">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
                </Button>
              </Link>
              <Link to="/ordens">
                <Button variant="hero" size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" /> Nova OS
                </Button>
              </Link>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground capitalize">{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
                <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">
                  Olá, {firstName} 👋
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">Panorama de {workshop?.workshops?.name ?? "sua oficina"} hoje.</p>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Operação ativa
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4 w-full">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                  {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
                </div>
                <div className="grid gap-4 lg:grid-cols-2 mt-8">
                  <Skeleton className="h-[300px] rounded-2xl" />
                  <Skeleton className="h-[300px] rounded-2xl" />
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                  <StatCard label="Faturamento do Mês" value={formatBRL(stats?.monthRevenue ?? 0)} delta="Neste mês" trend="up" icon={TrendingUp} accent />
                  <StatCard label="Carros em andamento" value={String(stats?.emAndamento ?? 0)} delta="OS ativas" trend="neutral" icon={Wrench} />
                  <StatCard label="Prontos para retirar" value={String(stats?.prontos ?? 0)} delta="Aguardando cliente" trend="neutral" icon={CheckCircle2} />
                  <StatCard label="Ordens abertas" value={String(stats?.abertas ?? 0)} delta="Em fluxo" trend="neutral" icon={ClipboardList} />
                  <StatCard label="Pagamento pendente" value={String(stats?.pendentes ?? 0)} delta="OS a receber" trend="down" icon={PhoneCall} />
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-[2fr_1fr]">
                  <Card className="border-border/60 p-5 md:p-6 shadow-sm w-full overflow-hidden">
                    <div className="mb-4">
                      <h2 className="font-display text-lg font-semibold tracking-tight">Faturamento (Últimos 7 dias)</h2>
                    </div>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${v / 1000}k`} />
                          <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} formatter={(val: number) => [formatBRL(val), "Receita"]} />
                          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2.5} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="border-border/60 p-5 md:p-6 shadow-sm w-full overflow-hidden">
                    <div className="mb-4">
                      <h2 className="font-display text-lg font-semibold tracking-tight">Status das Ordens</h2>
                    </div>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.statusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                          <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                          <Tooltip cursor={{ fill: 'hsl(var(--muted)/0.4)' }} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }} />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                </div>
              </>
            )}

            <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
                <div>
                  <h2 className="font-display text-lg font-semibold tracking-tight">Últimas ordens de serviço</h2>
                  <p className="text-xs text-muted-foreground">Atualizado em tempo real</p>
                </div>
                <Link to="/ordens"><Button variant="outline" size="sm">Ver todas</Button></Link>
              </div>

              {loadingOrders ? (
                <div className="p-8 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : !recentOrders?.length ? (
                <div className="p-12 text-center text-sm text-muted-foreground">Nenhuma ordem de serviço ainda. <Link to="/ordens" className="text-primary underline">Criar primeira OS</Link></div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <th className="px-5 py-3 font-medium whitespace-nowrap">OS</th>
                        <th className="px-5 py-3 font-medium whitespace-nowrap">Cliente</th>
                        <th className="px-5 py-3 font-medium whitespace-nowrap">Veículo</th>
                        <th className="px-5 py-3 font-medium whitespace-nowrap">Serviço</th>
                        <th className="px-5 py-3 font-medium whitespace-nowrap">Status</th>
                        <th className="px-5 py-3 font-medium text-right whitespace-nowrap">Valor</th>
                        <th className="px-5 py-3 font-medium whitespace-nowrap">Atualizado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentOrders.map((o) => {
                        const orderStatus = o.status as string;

                        const normalizedStatus: Status =
                          orderStatus === "aguardando"
                            ? "recebido"
                            : orderStatus === "em_andamento"
                              ? "em_manutencao"
                              : (orderStatus as Status);

                        console.log("STATUS:", o.status);
                        console.log("NORMALIZED:", normalizedStatus);

                        const s = {
                          label: "Teste",
                          className: "bg-red-500 text-white border-red-500",
                          dot: "bg-red-500",
                        };

                        return (
                          <tr key={o.id} className="border-b border-border/60 transition-colors hover:bg-secondary/40 last:border-0">
                            <td className="px-5 py-4 font-mono text-xs font-semibold whitespace-nowrap">OS-{String(o.number).padStart(4, "0")}</td>
                            <td className="px-5 py-4 font-medium whitespace-nowrap">{o.clients?.name ?? "—"}</td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <div className="font-medium">{o.vehicles?.brand} {o.vehicles?.model}</div>
                              {o.vehicles?.plate && <div className="font-mono text-[10px] text-muted-foreground">{o.vehicles.plate}</div>}
                            </td>
                            <td className="px-5 py-4 text-muted-foreground truncate max-w-[150px]">{o.service_done || o.reported_problem || "—"}</td>
                            <td className="px-5 py-4 whitespace-nowrap">
                              <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] sm:text-xs font-medium", s.className)}>
                                <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} /> {s.label}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right font-semibold tabular-nums whitespace-nowrap">{formatBRL(Number(o.amount))}</td>
                            <td className="px-5 py-4 text-xs text-muted-foreground whitespace-nowrap">{format(new Date(o.updated_at), "dd/MM HH:mm", { locale: ptBR })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
