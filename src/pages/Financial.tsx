import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wallet, TrendingUp, Clock, Receipt, Download, ArrowUpRight, ArrowDownRight,
  CircleDollarSign, CalendarDays, Loader2, Printer, FileSpreadsheet
} from "lucide-react";
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfDay, startOfWeek, startOfMonth, format, subDays, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import Papa from "papaparse";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const formatBRL = (v: number) => Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface OrderRow {
  id: string;
  number: number;
  amount: number;
  paid: boolean;
  status: string;
  updated_at: string;
  paid_at: string | null;
  service_done: string | null;
  reported_problem: string | null;
  clients: { name: string } | null;
}

export default function Financial() {
  const { workshopId } = useAuth();
  const [period] = useState<"semana">("semana");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["financial-orders", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const since = subDays(new Date(), 60).toISOString();
      const { data, error } = await supabase
        .from("orders")
        .select("id, number, amount, paid, status, updated_at, paid_at, service_done, reported_problem, clients(name)")
        .eq("workshop_id", workshopId!)
        .gte("updated_at", since)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrderRow[];
    },
  });

  const stats = useMemo(() => {
    const all = orders ?? [];
    const now = new Date();
    const dayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    const paid = all.filter((o) => o.paid && o.paid_at);
    const sum = (arr: OrderRow[]) => arr.reduce((s, o) => s + Number(o.amount || 0), 0);
    const paidDate = (o: OrderRow) => new Date(o.paid_at || o.updated_at);

    const today = sum(paid.filter((o) => isAfter(paidDate(o), dayStart)));
    const week = sum(paid.filter((o) => isAfter(paidDate(o), weekStart)));
    const month = sum(paid.filter((o) => isAfter(paidDate(o), monthStart)));
    const pending = sum(all.filter((o) => !o.paid && o.status !== "aguardando"));
    const pendingCount = all.filter((o) => !o.paid && o.status !== "aguardando").length;
    const ticket = paid.length > 0 ? sum(paid) / paid.length : 0;

    return { today, week, month, pending, pendingCount, ticket, paidCount: paid.length };
  }, [orders]);

  const chartData = useMemo(() => {
    const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const buckets = days.map((d, i) => ({ day: d, value: 0, date: new Date(weekStart.getTime() + i * 86400000) }));
    (orders ?? []).filter((o) => o.paid).forEach((o) => {
      const d = new Date(o.paid_at || o.updated_at);
      if (isAfter(d, weekStart)) {
        const idx = (d.getDay() + 6) % 7;
        buckets[idx].value += Number(o.amount || 0);
      }
    });
    return buckets.map(({ day, value }) => ({ day, value }));
  }, [orders]);

  const handleExportCSV = () => {
    if (!orders || orders.length === 0) return toast.error("Sem dados para exportar.");
    
    const csvData = orders.map(o => ({
      "OS": `OS-${String(o.number).padStart(4, "0")}`,
      "Cliente": o.clients?.name || "N/A",
      "Serviço": o.service_done || o.reported_problem || "N/A",
      "Status": o.status,
      "Valor": o.amount,
      "Pago": o.paid ? "Sim" : "Não",
      "Data Pagamento": o.paid_at ? format(new Date(o.paid_at), "dd/MM/yyyy HH:mm") : "N/A",
      "Última Atualização": format(new Date(o.updated_at), "dd/MM/yyyy HH:mm")
    }));

    const csv = Papa.unparse(csvData, { delimiter: ";" });
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `financeiro_oficinaprime_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Arquivo exportado com sucesso!");
  };

  const totalChart = chartData.reduce((s, d) => s + d.value, 0);
  const recentTransactions = (orders ?? []).slice(0, 8);

  const statCards = [
    { label: "Faturamento Hoje", value: stats.today, sub: "OS pagas hoje", icon: CircleDollarSign, accent: true, deltaUp: true, delta: "Hoje" },
    { label: "Faturamento Semana", value: stats.week, sub: "Últimos 7 dias", icon: TrendingUp, accent: false, deltaUp: true, delta: "Semana" },
    { label: "Faturamento Mês", value: stats.month, sub: "Mês atual", icon: CalendarDays, accent: false, deltaUp: true, delta: "Mês" },
    { label: "Pendentes", value: stats.pending, sub: `${stats.pendingCount} OS a receber`, icon: Clock, accent: false, deltaUp: false, delta: `${stats.pendingCount} OS` },
    { label: "Ticket Médio", value: stats.ticket, sub: "Por OS paga", icon: Receipt, accent: false, deltaUp: true, delta: `${stats.paidCount} OS` },
  ];

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background print-container">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden flex flex-col h-screen">
          <header className="shrink-0 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6 z-10">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex flex-1 items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                <h1 className="font-display text-lg font-semibold tracking-tight">Financeiro</h1>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="h-4 w-4" /> <span className="hidden sm:inline">Exportar</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.print()} className="cursor-pointer gap-2">
                    <Printer className="h-4 w-4" /> Imprimir Relatório PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer gap-2">
                    <FileSpreadsheet className="h-4 w-4" /> Exportar Planilha (Excel/CSV)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <div className="space-y-6 p-4 md:p-6 flex-1 overflow-y-auto">
            <div className="hidden print-header mb-6">
              <h1 className="text-2xl font-bold font-display">Relatório Financeiro</h1>
              <p className="text-muted-foreground text-sm">Gerado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</p>
            </div>

            {isLoading ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-5">
                  {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
                </div>
                <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
                  <Skeleton className="h-[350px] w-full rounded-2xl" />
                  <Skeleton className="h-[350px] w-full rounded-2xl" />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-5 page-break-inside-avoid">
                  {statCards.map((s) => {
                    const Icon = s.icon;
                    return (
                      <Card key={s.label} className={cn("relative overflow-hidden border-border/60 p-5 transition-all hover:shadow-md", s.accent && "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent")}>
                        <div className="flex items-start justify-between">
                          <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", s.accent ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                            <Icon className="h-4 w-4" strokeWidth={2.5} />
                          </div>
                          <span className={cn("flex items-center gap-0.5 text-xs font-semibold", s.deltaUp ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground")}>
                            {s.deltaUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {s.delta}
                          </span>
                        </div>
                        <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                        <p className="mt-1 font-display text-xl font-bold leading-tight tracking-tight md:text-2xl">{formatBRL(s.value)}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>
                      </Card>
                    );
                  })}
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_340px] page-break-inside-avoid">
                  <Card className="border-border/60 p-5 md:p-6 shadow-sm">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Faturamento da semana</p>
                        <p className="mt-1 font-display text-3xl font-bold tracking-tight">{formatBRL(totalChart)}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <TrendingUp className="h-3 w-3" /> Receita por dia da semana atual
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
                          <Tooltip
                            cursor={{ stroke: "hsl(var(--primary))", strokeWidth: 1, strokeDasharray: "3 3" }}
                            contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                            labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                            formatter={(v: number) => [formatBRL(v), "Faturamento"]}
                          />
                          <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#fillRevenue)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>

                  <Card className="border-border/60 p-5 md:p-6 shadow-sm">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Resumo do Mês</p>
                    <div className="mt-4 space-y-5">
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Recebido</span>
                          <span className="font-semibold">{formatBRL(stats.month)}</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${stats.month + stats.pending > 0 ? (stats.month / (stats.month + stats.pending)) * 100 : 0}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">A receber</span>
                          <span className="font-semibold">{formatBRL(stats.pending)}</span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${stats.month + stats.pending > 0 ? (stats.pending / (stats.month + stats.pending)) * 100 : 0}%` }} />
                        </div>
                      </div>
                      <div className="border-t border-border/60 pt-4 flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Total previsto</span>
                        <span className="font-display text-lg font-bold">{formatBRL(stats.month + stats.pending)}</span>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-3 border-t border-border/60 pt-5">
                      <div>
                        <p className="text-xs text-muted-foreground">OS pagas</p>
                        <p className="mt-1 font-display text-xl font-bold">{stats.paidCount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">OS pendentes</p>
                        <p className="mt-1 font-display text-xl font-bold text-primary">{stats.pendingCount}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="border-border/60 shadow-sm page-break-inside-avoid">
                  <div className="flex items-center justify-between border-b border-border/60 p-5">
                    <div>
                      <h2 className="font-display text-base font-semibold">Movimentações recentes</h2>
                      <p className="text-xs text-muted-foreground">Últimas ordens de serviço</p>
                    </div>
                  </div>
                  {recentTransactions.length === 0 ? (
                    <div className="p-12 text-center text-sm text-muted-foreground">Nenhuma movimentação ainda.</div>
                  ) : (
                    <div className="divide-y divide-border/60">
                      {recentTransactions.map((t) => (
                        <div key={t.id} className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/30">
                          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full hide-print", t.paid ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-primary/15 text-primary")}>
                            {t.paid ? <TrendingUp className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium">{t.clients?.name ?? "Cliente"}</span>
                              <Badge variant="outline" className="hidden font-mono text-[10px] sm:inline-flex">OS-{String(t.number).padStart(4, "0")}</Badge>
                            </div>
                            <p className="truncate text-xs text-muted-foreground">{t.service_done || t.reported_problem || "—"}</p>
                          </div>
                          <div className="hidden text-right text-xs text-muted-foreground md:block">
                            {format(new Date(t.updated_at), "dd/MM HH:mm", { locale: ptBR })}
                          </div>
                          <div className="text-right">
                            <p className="font-display text-base font-bold tabular-nums">{formatBRL(Number(t.amount))}</p>
                            <Badge variant="outline" className={cn("mt-0.5 text-[10px] capitalize hide-print", t.paid ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-primary/15 text-primary border-primary/30")}>
                              {t.paid ? "pago" : "pendente"}
                            </Badge>
                            <span className="hidden print-status text-xs font-semibold text-muted-foreground mt-1">
                              {t.paid ? "PAGO" : "PENDENTE"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
