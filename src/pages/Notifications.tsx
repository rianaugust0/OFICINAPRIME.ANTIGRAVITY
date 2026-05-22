import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Bell, ClipboardCheck, MessageCircle, AlertTriangle, CalendarClock, Wallet,
  Wrench, Filter, Loader2, RefreshCw, Activity, CheckCircle2, XCircle, Clock,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { openWhatsApp, WhatsAppTemplates } from "@/lib/whatsapp";
import { enqueueAutomation, retryAutomation } from "@/lib/automations";
import { formatDistanceToNow, isAfter, isToday, startOfDay, endOfDay, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type NotifType = "os_pronta" | "pagamento" | "revisao" | "alerta";

interface Notif {
  id: string;
  type: NotifType;
  title: string;
  description: string;
  time: string;
  meta?: string;
  phone?: string | null;
  clientName?: string;
  vehicleLabel?: string;
  plate?: string;
}

const config: Record<NotifType, { label: string; icon: typeof Bell; color: string; bg: string }> = {
  os_pronta: { label: "OS pronta", icon: ClipboardCheck, color: "text-primary", bg: "bg-primary/15 border-primary/30" },
  pagamento: { label: "Pagamento", icon: Wallet, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
  revisao: { label: "Revisão hoje", icon: CalendarClock, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  alerta: { label: "Alerta", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
};

const filters: { id: NotifType | "all"; label: string }[] = [
  { id: "all", label: "Todas" },
  { id: "os_pronta", label: "OS pronta" },
  { id: "pagamento", label: "Pagamento" },
  { id: "revisao", label: "Revisão" },
  { id: "alerta", label: "Alertas" },
];

export default function Notifications() {
  const { workshopId } = useAuth();
  const [filter, setFilter] = useState<NotifType | "all">("all");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const todayStart = startOfDay(new Date()).toISOString();
      const todayEnd = endOfDay(new Date()).toISOString();

      const [readyOrders, unpaidOrders, todayAppts] = await Promise.all([
        supabase.from("orders").select("id, number, updated_at, clients(name, phone), vehicles(brand, model, plate)").eq("workshop_id", workshopId!).eq("status", "pronto").order("updated_at", { ascending: false }),
        supabase.from("orders").select("id, number, amount, updated_at, expected_delivery, clients(name, phone)").eq("workshop_id", workshopId!).eq("paid", false).neq("status", "aguardando").order("updated_at", { ascending: false }),
        supabase.from("appointments").select("id, scheduled_at, type, service, clients(name, phone), vehicles(brand, model, plate)").eq("workshop_id", workshopId!).gte("scheduled_at", todayStart).lte("scheduled_at", todayEnd).order("scheduled_at"),
      ]);

      const notifs: Notif[] = [];

      (readyOrders.data ?? []).forEach((o: any) => {
        notifs.push({
          id: `ready-${o.id}`,
          type: "os_pronta",
          title: `OS #${String(o.number).padStart(4, "0")} pronta para retirada`,
          description: `${o.vehicles?.brand ?? ""} ${o.vehicles?.model ?? ""} — ${o.clients?.name ?? ""}`.trim(),
          time: formatDistanceToNow(new Date(o.updated_at), { addSuffix: true, locale: ptBR }),
          meta: o.vehicles?.plate ?? undefined,
          phone: o.clients?.phone,
          clientName: o.clients?.name,
          vehicleLabel: `${o.vehicles?.brand ?? ""} ${o.vehicles?.model ?? ""}`.trim(),
          plate: o.vehicles?.plate ?? "",
        });
      });

      (unpaidOrders.data ?? []).forEach((o: any) => {
        const due = o.expected_delivery ? new Date(o.expected_delivery) : null;
        const overdue = due && isAfter(new Date(), due) ? ` (vencido há ${differenceInDays(new Date(), due)} dias)` : "";
        notifs.push({
          id: `pay-${o.id}`,
          type: "pagamento",
          title: `Pagamento pendente — ${Number(o.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
          description: `OS #${String(o.number).padStart(4, "0")} — ${o.clients?.name ?? ""}${overdue}`,
          time: formatDistanceToNow(new Date(o.updated_at), { addSuffix: true, locale: ptBR }),
          phone: o.clients?.phone,
          clientName: o.clients?.name,
        });
      });

      (todayAppts.data ?? []).forEach((a: any) => {
        const time = new Date(a.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        notifs.push({
          id: `appt-${a.id}`,
          type: "revisao",
          title: `${a.type === "entrada" ? "Entrada" : a.type === "entrega" ? "Entrega" : "Revisão"} agendada hoje ${time}`,
          description: `${a.vehicles ? `${a.vehicles.brand} ${a.vehicles.model} — ` : ""}${a.clients?.name ?? "Sem cliente"}`,
          time: isToday(new Date(a.scheduled_at)) ? "Hoje" : "Em breve",
          phone: a.clients?.phone,
        });
      });

      return notifs;
    },
  });

  const notifs = data ?? [];
  const filtered = useMemo(
    () => (filter === "all" ? notifs : notifs.filter((n) => n.type === filter)),
    [notifs, filter],
  );

  const isRead = (id: string) => readIds.has(id);
  const unread = notifs.filter((n) => !isRead(n.id)).length;
  const counts = (id: NotifType | "all") =>
    id === "all" ? notifs.filter((n) => !isRead(n.id)).length : notifs.filter((n) => n.type === id && !isRead(n.id)).length;

  const markAllRead = () => setReadIds(new Set(notifs.map((n) => n.id)));
  const toggleRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex flex-1 items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <h1 className="font-display text-lg font-semibold tracking-tight">Notificações</h1>
                {unread > 0 && <Badge className="bg-primary text-primary-foreground hover:bg-primary">{unread} novas</Badge>}
              </div>
              <Button variant="outline" size="sm" className="gap-2" onClick={markAllRead} disabled={unread === 0}>
                <span className="hidden sm:inline">Marcar todas como lidas</span><span className="sm:hidden">Ler todas</span>
              </Button>
            </div>
          </header>

          {isLoading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Tabs defaultValue="alertas" className="p-4 md:p-6">
              <TabsList className="mb-4">
                <TabsTrigger value="alertas" className="gap-2"><Bell className="h-3.5 w-3.5" /> Alertas</TabsTrigger>
                <TabsTrigger value="fila" className="gap-2"><Activity className="h-3.5 w-3.5" /> Fila de automações</TabsTrigger>
              </TabsList>

              <TabsContent value="alertas" className="mt-0">
                <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                  <Card className="h-fit border-border/60 p-3">
                    <div className="mb-2 flex items-center gap-2 px-2 py-1.5">
                      <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Filtrar</p>
                    </div>
                    <div className="space-y-1">
                      {filters.map((f) => {
                        const active = filter === f.id;
                        const c = counts(f.id);
                        return (
                          <button key={f.id} onClick={() => setFilter(f.id)}
                            className={cn("flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                              active ? "bg-foreground text-background font-semibold" : "text-foreground hover:bg-muted")}>
                            <span>{f.label}</span>
                            {c > 0 && (
                              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold",
                                active ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary")}>
                                {c}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </Card>

                  <div className="space-y-3">
                    {filtered.length === 0 ? (
                      <Card className="flex flex-col items-center justify-center border-dashed border-border/60 px-6 py-16 text-center">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <Bell className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <p className="mt-4 font-medium">Nenhuma notificação</p>
                        <p className="mt-1 text-sm text-muted-foreground">Você está em dia. ✨</p>
                      </Card>
                    ) : (
                      filtered.map((n) => {
                        const cfg = config[n.type];
                        const Icon = cfg.icon;
                        const read = isRead(n.id);
                        return (
                          <Card key={n.id} className={cn("group relative overflow-hidden border-border/60 p-4 transition-all hover:border-primary/40 hover:shadow-md", !read && "bg-muted/30")}>
                            {!read && <span className="absolute left-0 top-0 h-full w-1 bg-primary" />}
                            <div className="flex gap-4 pl-2">
                              <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border", cfg.bg)}>
                                <Icon className={cn("h-5 w-5", cfg.color)} />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline" className={cn("font-medium", cfg.bg, cfg.color)}>{cfg.label}</Badge>
                                  {n.meta && <span className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] tracking-wider">{n.meta}</span>}
                                  <span className="ml-auto text-xs text-muted-foreground">{n.time}</span>
                                </div>
                                <p className={cn("mt-2 text-sm", !read ? "font-semibold text-foreground" : "text-foreground")}>{n.title}</p>
                                <p className="mt-0.5 text-sm text-muted-foreground">{n.description}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {n.type === "os_pronta" && n.phone && (
                                    <Button size="sm" variant="hero" className="h-8 gap-1.5"
                                      onClick={() => openWhatsApp(n.phone!, WhatsAppTemplates.orderReady(n.clientName ?? "", n.vehicleLabel ?? "", n.plate ?? ""))}>
                                      <MessageCircle className="h-3.5 w-3.5" /> Avisar no WhatsApp
                                    </Button>
                                  )}
                                  {n.type === "pagamento" && n.phone && (
                                    <Button size="sm" variant="outline" className="h-8 gap-1.5"
                                      onClick={() => openWhatsApp(n.phone!, WhatsAppTemplates.paymentDue(n.clientName ?? "", n.title.replace(/^.*— /, "")))}>
                                      <Wallet className="h-3.5 w-3.5" /> Cobrar cliente
                                    </Button>
                                  )}
                                  {n.type === "revisao" && (
                                    <Link to="/agenda"><Button size="sm" variant="outline" className="h-8 gap-1.5">
                                      <Wrench className="h-3.5 w-3.5" /> Abrir agenda
                                    </Button></Link>
                                  )}
                                  <Button size="sm" variant="ghost" className="h-8 text-muted-foreground hover:text-foreground" onClick={() => toggleRead(n.id)}>
                                    {read ? "Marcar como não lida" : "Marcar como lida"}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fila" className="mt-0">
                <AutomationQueue />
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}

// =================== Automation Queue Panel ===================

const statusBadge: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
  pending: { label: "Pendente", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30", Icon: Clock },
  processing: { label: "Processando", cls: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30", Icon: Loader2 },
  sent: { label: "Enviado", cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30", Icon: CheckCircle2 },
  failed: { label: "Falhou", cls: "bg-destructive/10 text-destructive border-destructive/30", Icon: XCircle },
  dlq: { label: "Descartado", cls: "bg-destructive/15 text-destructive border-destructive/40", Icon: XCircle },
};

const kindLabel: Record<string, string> = {
  whatsapp_order_ready: "WhatsApp · OS pronta",
  whatsapp_payment_due: "WhatsApp · Cobrança",
  whatsapp_appointment_reminder: "WhatsApp · Lembrete",
  whatsapp_custom: "WhatsApp · Personalizada",
};

function AutomationQueue() {
  const { workshopId } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"all" | "pending" | "sent" | "failed" | "dlq">("all");

  const { data: jobs, isLoading } = useQuery({
    queryKey: ["automation-jobs", workshopId, tab],
    enabled: !!workshopId,
    refetchInterval: 8000,
    queryFn: async () => {
      let q = supabase
        .from("automation_jobs")
        .select("*")
        .eq("workshop_id", workshopId!)
        .order("created_at", { ascending: false })
        .limit(100);
      if (tab !== "all") q = q.eq("status", tab as "pending" | "sent" | "failed" | "dlq");
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const retryMut = useMutation({
    mutationFn: (id: string) => retryAutomation(id),
    onSuccess: () => { toast.success("Job reenviado para a fila."); qc.invalidateQueries({ queryKey: ["automation-jobs"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const triggerMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.functions.invoke("process-automations", { body: { batch: 20 } });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Worker disparado."); qc.invalidateQueries({ queryKey: ["automation-jobs"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  type JobR = {
    id: string; kind: string; status: string; attempts: number; max_attempts: number;
    last_error: string | null; created_at: string; processed_at: string | null;
    payload: { phone?: string; message?: string; client_name?: string; reference?: string } | null;
  };
  const list = (jobs ?? []) as JobR[];

  const summary = useMemo(() => {
    const all = list;
    return {
      pending: all.filter((j) => j.status === "pending" || j.status === "processing").length,
      sent: all.filter((j) => j.status === "sent").length,
      failed: all.filter((j) => j.status === "failed").length,
      dlq: all.filter((j) => j.status === "dlq").length,
    };
  }, [list]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Pendentes", val: summary.pending, color: "text-amber-600 dark:text-amber-400" },
          { label: "Enviados", val: summary.sent, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Falhas", val: summary.failed, color: "text-destructive" },
          { label: "Descartados", val: summary.dlq, color: "text-destructive" },
        ].map((s) => (
          <Card key={s.label} className="border-border/60 p-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className={cn("mt-1 font-display text-2xl font-bold", s.color)}>{s.val}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {(["all", "pending", "sent", "failed", "dlq"] as const).map((s) => (
            <button key={s} onClick={() => setTab(s)}
              className={cn("rounded-full border px-4 py-1.5 text-xs font-medium transition-colors",
                tab === s ? "bg-foreground text-background border-foreground" : "border-border hover:border-primary/40")}>
              {s === "all" ? "Todos" : statusBadge[s].label}
            </button>
          ))}
        </div>
        <Button size="sm" variant="outline" className="gap-2" onClick={() => triggerMut.mutate()} disabled={triggerMut.isPending}>
          {triggerMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Processar agora
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : list.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-dashed border-border/60 px-6 py-16 text-center">
          <Activity className="h-8 w-8 text-muted-foreground" />
          <p className="mt-4 font-medium">Sem jobs nesta visualização</p>
          <p className="mt-1 text-sm text-muted-foreground">As automações aparecerão aqui assim que forem disparadas.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {list.map((j) => {
            const cfg = statusBadge[j.status] ?? statusBadge.pending;
            const Icon = cfg.Icon;
            return (
              <Card key={j.id} className="border-border/60 p-4 transition hover:border-primary/40">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={cn("gap-1 font-medium", cfg.cls)}>
                        <Icon className={cn("h-3 w-3", j.status === "processing" && "animate-spin")} />
                        {cfg.label}
                      </Badge>
                      <span className="text-xs font-medium text-muted-foreground">{kindLabel[j.kind] ?? j.kind}</span>
                      <span className="text-xs text-muted-foreground">· tentativa {j.attempts}/{j.max_attempts}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(j.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    {j.payload?.client_name && (
                      <p className="mt-2 text-sm font-medium">{j.payload.client_name}{j.payload.reference && <span className="ml-2 text-muted-foreground">· {j.payload.reference}</span>}</p>
                    )}
                    {j.payload?.message && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">"{j.payload.message}"</p>
                    )}
                    {j.last_error && (
                      <p className="mt-2 rounded-md border border-destructive/30 bg-destructive/5 px-2 py-1 text-xs text-destructive">
                        ⚠ {j.last_error}
                      </p>
                    )}
                  </div>
                  {(j.status === "failed" || j.status === "dlq") && (
                    <Button size="sm" variant="outline" className="gap-1.5" onClick={() => retryMut.mutate(j.id)} disabled={retryMut.isPending}>
                      <RefreshCw className="h-3.5 w-3.5" /> Reprocessar
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
