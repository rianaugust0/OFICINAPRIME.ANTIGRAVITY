import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3, TrendingUp, DollarSign, ClipboardCheck, Receipt, Users, Sparkles, Download, Wrench, Loader2, ArrowUpRight,
  UserPlus, FileText, CheckCircle
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfDay, startOfWeek, startOfMonth, startOfYear, format, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const formatBRL = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const PIE_COLORS = ["hsl(48 100% 50%)", "hsl(0 0% 18%)", "hsl(0 0% 45%)", "hsl(0 0% 75%)"];

interface OrderRow {
  amount: number; paid: boolean; status: string; updated_at: string; paid_at: string | null; entry_date: string;
  service_done: string | null; reported_problem: string | null;
  client_id: string;
}

interface ClientRow {
  created_at: string;
}

export default function Reports() {
  const { workshopId } = useAuth();
  const [period, setPeriod] = useState<"diario" | "semanal" | "mensal" | "anual">("mensal");

  const { data, isLoading } = useQuery({
    queryKey: ["reports-full", workshopId, period],
    enabled: !!workshopId,
    queryFn: async () => {
      const now = new Date();
      let sinceDate: Date;
      if (period === "diario") sinceDate = startOfDay(now);
      else if (period === "semanal") sinceDate = startOfWeek(now, { weekStartsOn: 1 });
      else if (period === "mensal") sinceDate = startOfMonth(now);
      else sinceDate = startOfYear(now);
      
      const since = sinceDate.toISOString();

      const [ordersRes, clientsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("amount, paid, status, updated_at, paid_at, entry_date, service_done, reported_problem, client_id")
          .eq("workshop_id", workshopId!)
          .gte("updated_at", since),
        supabase
          .from("clients")
          .select("created_at")
          .eq("workshop_id", workshopId!)
          .gte("created_at", since)
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (clientsRes.error) throw clientsRes.error;

      return {
        orders: (ordersRes.data ?? []) as OrderRow[],
        clients: (clientsRes.data ?? []) as ClientRow[],
      };
    },
  });

  const orders = data?.orders ?? [];
  const clients = data?.clients ?? [];

  const metrics = useMemo(() => {
    const paidOrders = orders.filter(o => o.paid);
    const revenue = paidOrders.reduce((s, o) => s + Number(o.amount || 0), 0);
    const profit = revenue * 0.4; // 40% estimated
    const ticket = paidOrders.length ? revenue / paidOrders.length : 0;
    const delivered = orders.filter(o => o.status === "entregue").length;
    const opened = orders.filter(o => o.status !== "entregue").length;

    return { revenue, profit, ticket, delivered, opened, newClients: clients.length };
  }, [orders, clients]);

  const kpis = [
    { label: `Faturamento`, value: formatBRL(metrics.revenue), delta: `Receita`, icon: DollarSign, accent: true },
    { label: "Novos Clientes", value: String(metrics.newClients), delta: "Cadastrados", icon: UserPlus },
    { label: "OS Entregues", value: String(metrics.delivered), delta: "Finalizadas", icon: CheckCircle },
    { label: "OS Abertas", value: String(metrics.opened), delta: "Em andamento", icon: FileText },
    { label: "Ticket médio", value: formatBRL(metrics.ticket), delta: "Por OS paga", icon: Receipt },
  ];

  const services = useMemo(() => {
    const map = new Map<string, { count: number; revenue: number }>();
    orders.forEach((o) => {
      const name = (o.service_done || o.reported_problem || "Outros").split(/[.,;\n]/)[0].trim().slice(0, 40) || "Outros";
      const cur = map.get(name) ?? { count: 0, revenue: 0 };
      cur.count += 1;
      if (o.paid) cur.revenue += Number(o.amount || 0);
      map.set(name, cur);
    });
    return [...map.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [orders]);

  const distribution = useMemo(() => {
    const total = services.reduce((s, x) => s + x.count, 0) || 1;
    return services.slice(0, 4).map((s) => ({ name: s.name, value: Math.round((s.count / total) * 100) }));
  }, [services]);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background print-container">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6 hide-print">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex flex-1 items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h1 className="font-display text-lg font-semibold tracking-tight">Relatórios Premium</h1>
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
                <Download className="h-4 w-4" /><span className="hidden sm:inline">Exportar PDF</span>
              </Button>
            </div>
          </header>

          <div className="space-y-6 p-4 md:p-6 flex-1 overflow-y-auto">
            
            <div className="hidden print-header mb-6">
              <h1 className="text-2xl font-bold font-display">Relatório: {period.toUpperCase()}</h1>
              <p className="text-muted-foreground text-sm">Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
            </div>

            <Tabs value={period} onValueChange={(v) => setPeriod(v as any)} className="w-full hide-print">
              <TabsList className="grid w-full grid-cols-4 max-w-[400px]">
                <TabsTrigger value="diario">Diário</TabsTrigger>
                <TabsTrigger value="semanal">Semanal</TabsTrigger>
                <TabsTrigger value="mensal">Mensal</TabsTrigger>
                <TabsTrigger value="anual">Anual</TabsTrigger>
              </TabsList>
            </Tabs>

            {isLoading ? (
              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
                  {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  <Skeleton className="h-[350px] lg:col-span-2 w-full rounded-2xl" />
                  <Skeleton className="h-[350px] w-full rounded-2xl" />
                </div>
              </div>
            ) : orders.length === 0 ? (
              <div className="p-12 mt-4">
                <Card className="flex flex-col items-center border-dashed border-border/60 px-6 py-16 text-center shadow-sm">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-4 font-medium">Sem dados no período {period}</p>
                  <p className="mt-1 text-sm text-muted-foreground">Tente alterar a visualização para ver resultados anteriores.</p>
                </Card>
              </div>
            ) : (
            <div className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-5 page-break-inside-avoid">
                {kpis.map((k) => {
                  const Icon = k.icon;
                  return (
                    <Card key={k.label} className={cn("relative overflow-hidden border-border/60 p-5 transition-all hover:shadow-md", k.accent && "bg-foreground text-background border-foreground")}>
                      <div className="flex items-start justify-between">
                        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg hide-print", k.accent ? "bg-primary text-primary-foreground" : "bg-muted")}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className={cn("flex items-center gap-1 text-xs font-semibold hide-print", k.accent ? "text-primary" : "text-emerald-600")}>
                          <ArrowUpRight className="h-3 w-3" /> {k.delta}
                        </span>
                      </div>
                      <p className={cn("mt-4 text-xs uppercase tracking-wider", k.accent ? "text-background/60" : "text-muted-foreground")}>{k.label}</p>
                      <p className="mt-1 font-display text-2xl font-bold tracking-tight">{k.value}</p>
                    </Card>
                  );
                })}
              </div>

              <div className="grid gap-4 lg:grid-cols-3 page-break-inside-avoid">
                <Card className="border-border/60 p-5 lg:col-span-2 shadow-sm">
                  <div className="mb-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Desempenho</p>
                    <h3 className="font-display text-lg font-semibold">Volume de Serviços ({period})</h3>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={services.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{fill: 'hsl(var(--muted)/0.4)'}} contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                        <Bar dataKey="count" fill="hsl(48 100% 50%)" radius={[4, 4, 0, 0]} name="Qtd OS" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="border-border/60 p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Distribuição</p>
                  <h3 className="font-display text-lg font-semibold">Tipos de serviço</h3>
                  {distribution.length === 0 ? (
                    <div className="py-12 text-center text-sm text-muted-foreground">Sem dados suficientes.</div>
                  ) : (
                    <>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={distribution} dataKey="value" innerRadius={50} outerRadius={80} paddingAngle={3}>
                              {distribution.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i]} />))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        {distribution.map((d, i) => (
                          <div key={d.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: PIE_COLORS[i] }} />
                              <span className="truncate">{d.name}</span>
                            </div>
                            <span className="font-medium">{d.value}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Card>
              </div>

              {services.length > 0 && (
                <Card className="border-border/60 p-5 shadow-sm page-break-inside-avoid">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Ranking</p>
                      <h3 className="font-display text-lg font-semibold">Serviços que mais geram receita</h3>
                    </div>
                    <Badge variant="outline" className="gap-1"><Wrench className="h-3 w-3" />{services.reduce((s, x) => s + x.count, 0)} OS</Badge>
                  </div>
                  <div className="grid gap-6">
                    <div className="space-y-2.5">
                      {services.slice().sort((a, b) => b.revenue - a.revenue).map((s, i) => (
                        <div key={s.name} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3 transition-colors hover:border-primary/40 gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground font-display text-sm font-bold text-background hide-print">{i + 1}</span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{s.name}</p>
                              <p className="text-xs text-muted-foreground">{s.count} ordens no período</p>
                            </div>
                          </div>
                          <p className="font-display text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-md self-start sm:self-auto">{formatBRL(s.revenue)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}
            </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
