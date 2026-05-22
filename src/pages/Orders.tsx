import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus, Loader2, MessageCircle, Trash2, Clock, CheckCircle2, Circle, Pencil, PlusCircle, Calculator, Link2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { openWhatsApp, WhatsAppTemplates } from "@/lib/whatsapp";
import { enqueueAutomation } from "@/lib/automations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

type Status = "recebido" | "em_analise" | "aguardando_aprovacao" | "em_manutencao" | "pronto" | "entregue";

interface OrderItem {
  id: string;
  name: string;
  type: "part" | "service";
  price: number;
  quantity: number;
}

interface OrderRow {
  id: string;
  number: number;
  reported_problem: string | null;
  service_done: string | null;
  parts_used: string | null;
  amount: number;
  discount: number | null;
  items: OrderItem[] | null;
  notes: string | null;
  status: Status;
  entry_date: string;
  expected_delivery: string | null;
  paid: boolean;
  client_id: string;
  vehicle_id: string;
  clients: { name: string; phone: string | null } | null;
  vehicles: { brand: string; model: string; plate: string | null } | null;
}

const statusConfig: Record<Status, { label: string; color: string }> = {
  recebido: { label: "Recebido", color: "bg-muted text-muted-foreground border-border" },
  em_analise: { label: "Em Análise", color: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30" },
  aguardando_aprovacao: { label: "Aguardando Aprovação", color: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30" },
  em_manutencao: { label: "Em Manutenção", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30" },
  pronto: { label: "Pronto", color: "bg-primary/20 text-primary border-primary/40" },
  entregue: { label: "Entregue", color: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
};

const statusOrder: Status[] = ["recebido", "em_analise", "aguardando_aprovacao", "em_manutencao", "pronto", "entregue"];
const nextStatus = (s: Status): Status | null => {
  const idx = statusOrder.indexOf(s);
  return idx < statusOrder.length - 1 ? statusOrder[idx + 1] : null;
};

const formatBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Orders() {
  const { workshopId } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<Status | "all">("all");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // OS Form State
  const [form, setForm] = useState({
    client_id: "", vehicle_id: "", reported_problem: "",
    expected_delivery: "", discount: "0", notes: ""
  });

  const [items, setItems] = useState<OrderItem[]>([]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, clients(name, phone), vehicles(brand, model, plate)")
        .eq("workshop_id", workshopId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as OrderRow[];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-min", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data } = await supabase.from("clients").select("id, name").eq("workshop_id", workshopId!).order("name");
      return data ?? [];
    },
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles-by-client", form.client_id],
    enabled: !!form.client_id,
    queryFn: async () => {
      const { data } = await supabase.from("vehicles").select("id, brand, model, plate").eq("client_id", form.client_id);
      return data ?? [];
    },
  });

  // Calculate totals
  const { subtotal, discount, total, labor, parts } = useMemo(() => {
    let labor = 0;
    let parts = 0;
    items.forEach(i => {
      const rowTotal = i.price * i.quantity;
      if (i.type === "service") labor += rowTotal;
      if (i.type === "part") parts += rowTotal;
    });
    const subtotal = labor + parts;
    const discount = Number(form.discount || 0);
    const total = Math.max(0, subtotal - discount);
    return { subtotal, discount, total, labor, parts };
  }, [items, form.discount]);

  const upsertMut = useMutation({
    mutationFn: async () => {
      // Build compat strings
      const parts_used = items.filter(i => i.type === "part").map(i => `${i.quantity}x ${i.name}`).join(", ");
      const service_done = items.filter(i => i.type === "service").map(i => i.name).join(", ");

      const payload: any = {
        workshop_id: workshopId!,
        client_id: form.client_id,
        vehicle_id: form.vehicle_id,
        reported_problem: form.reported_problem || null,
        service_done: service_done || null,
        parts_used: parts_used || null,
        amount: total,
        discount: discount,
        items: items, // JSONB
        notes: form.notes || null,
        expected_delivery: form.expected_delivery || null,
      };

      if (!editingId) {
        payload.status = "recebido";
        payload.entry_date = new Date().toISOString();
      }

      if (editingId) {
        const { error } = await supabase.from("orders").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("orders").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "OS atualizada!" : "Ordem criada!");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats-full"] });
      setOpen(false);
      setEditingId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatusMut = useMutation({
    mutationFn: async ({ id, status, clientId }: { id: string; status: Status; clientId: string }) => {
      const updates: { status: Status } = { status };
      if (status === "entregue") {
        await supabase.from("clients").update({ last_service_at: new Date().toISOString() }).eq("id", clientId);
      }
      const { error } = await supabase.from("orders").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats-full"] });
      toast.success("Status atualizado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const togglePaidMut = useMutation({
    mutationFn: async ({ id, paid }: { id: string; paid: boolean }) => {
      const payload = { paid, paid_at: paid ? new Date().toISOString() : null };
      const { error } = await supabase.from("orders").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats-full"] });
      qc.invalidateQueries({ queryKey: ["financial-orders"] });
      qc.invalidateQueries({ queryKey: ["reports"] });
      toast.success(vars.paid ? "Financeiro atualizado: OS Marcada como Paga." : "Financeiro atualizado: Marcada como Pendente.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const generateTokenMut = useMutation({
    mutationFn: async (clientId: string) => {
      const { data: existing } = await supabase
        .from<any>("client_portal_tokens")
        .select("token")
        .eq("client_id", clientId)
        .maybeSingle();

      if (existing) return existing.token;

      const token = Math.random().toString(36).substring(2, 10).toUpperCase();

      const { error } = await supabase
        .from<any>("client_portal_tokens")
        .insert({ client_id: clientId, token });

      if (error) throw error;

      return token;
      onSuccess: (token) => {
        const url = `${window.location.origin}/portal/${token}`;
        navigator.clipboard.writeText(url);
        toast.success("Link do portal copiado! Pode enviar para o cliente.");
      },
        onError: () => toast.error("Erro ao gerar link do portal."),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Ordem excluída.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (o: OrderRow) => {
    setEditingId(o.id);
    setForm({
      client_id: o.client_id,
      vehicle_id: o.vehicle_id,
      reported_problem: o.reported_problem ?? "",
      expected_delivery: o.expected_delivery ?? "",
      discount: String(o.discount ?? 0),
      notes: o.notes ?? "",
    });
    setItems(o.items || []);
    setOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ client_id: "", vehicle_id: "", reported_problem: "", expected_delivery: "", discount: "0", notes: "" });
    setItems([]);
    setOpen(true);
  };

  const addItem = (type: "part" | "service") => {
    setItems([...items, { id: Math.random().toString(36).substr(2, 9), name: "", type, price: 0, quantity: 1 }]);
  };

  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const filtered = (orders ?? []).filter((o) => filter === "all" || o.status === filter);
  const counts = (s: Status | "all") => s === "all" ? (orders?.length ?? 0) : (orders?.filter((o) => o.status === s).length ?? 0);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex flex-1 items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <h1 className="font-display text-lg font-semibold tracking-tight">Ordens de Serviço</h1>
              </div>
              <Button variant="hero" size="sm" className="gap-2" onClick={openNew} disabled={!clients?.length}>
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Nova OS</span>
              </Button>
            </div>
          </header>

          <div className="space-y-4 p-4 md:p-6 flex-1 overflow-y-auto">
            {/* Status filter */}
            <div className="flex flex-wrap gap-2">
              {(["all", ...statusOrder] as const).map((s) => (
                <button key={s} onClick={() => setFilter(s)}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                    filter === s ? "bg-foreground text-background border-foreground" : "border-border hover:border-primary/40",
                  )}>
                  {s === "all" ? "Todas" : statusConfig[s].label} <span className="ml-1.5 opacity-60">{counts(s)}</span>
                </button>
              ))}
            </div>

            {isLoading ? (
              <div className="grid gap-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <Card className="flex flex-col items-center justify-center border-dashed border-border/60 px-6 py-16 text-center shadow-sm">
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
                <p className="mt-4 font-medium">Nenhuma ordem</p>
                <p className="mt-1 text-sm text-muted-foreground">{clients?.length ? "Crie a primeira OS." : "Cadastre um cliente e veículo antes."}</p>
              </Card>
            ) : (
              <div className="grid gap-3">
                {filtered.map((o) => {
                  const rawStatus = String(o.status);

                  const normalizedStatus: Status =
                    rawStatus === "aguardando"
                      ? "recebido"
                      : rawStatus === "em_andamento"
                        ? "em_manutencao"
                        : rawStatus as Status;

                  const cfg = statusConfig[normalizedStatus];
                  const next = nextStatus(normalizedStatus);

                  const next = nextStatus(normalizedStatus as Status);
                  return (
                    <Card key={o.id} className="group border-border/60 p-5 transition-all hover:border-primary/40 hover:shadow-md">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-display text-sm font-bold text-muted-foreground">OS #{String(o.number).padStart(4, "0")}</span>
                            <Badge variant="outline" className={cn("font-medium", cfg.color)}>{cfg.label}</Badge>
                            {o.paid && <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">Pago</Badge>}
                          </div>
                          <p className="mt-2 font-display text-lg font-bold">
                            {o.vehicles?.brand} {o.vehicles?.model}
                            {o.vehicles?.plate && <span className="ml-2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-xs">{o.vehicles.plate}</span>}
                          </p>
                          <p className="text-sm text-muted-foreground">{o.clients?.name}</p>
                          {o.reported_problem && <p className="mt-2 text-sm"><span className="text-muted-foreground">Problema:</span> {o.reported_problem}</p>}

                          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-lg border border-border/50">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Entrada: {format(new Date(o.entry_date), "dd/MM/yyyy", { locale: ptBR })}</span>
                            {o.expected_delivery && <span>Previsão: {format(new Date(o.expected_delivery), "dd/MM/yyyy", { locale: ptBR })}</span>}
                            <span className="ml-auto font-display text-base font-bold text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-md">{formatBRL(Number(o.amount))}</span>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-row gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 sm:flex-col">
                          {next && (
                            <Button size="sm" variant="outline" className="shrink-0"
                              onClick={() => updateStatusMut.mutate({ id: o.id, status: next, clientId: o.client_id })}>
                              → {statusConfig[next].label}
                            </Button>
                          )}
                          {o.status === "pronto" && o.clients?.phone && (
                            <Button size="sm" variant="hero" className="gap-1.5 shrink-0"
                              onClick={() => {
                                const msg = WhatsAppTemplates.orderReady(o.clients!.name, `${o.vehicles?.brand} ${o.vehicles?.model}`, o.vehicles?.plate ?? "");
                                if (workshopId) {
                                  enqueueAutomation(workshopId, "whatsapp_order_ready", {
                                    phone: o.clients!.phone!, message: msg,
                                    client_name: o.clients!.name,
                                    reference: `OS #${String(o.number).padStart(4, "0")}`,
                                  }).catch(() => { /* log silencioso */ });
                                }
                                openWhatsApp(o.clients!.phone, msg);
                              }}>
                              <MessageCircle className="h-3.5 w-3.5" /> Avisar
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 gap-1.5 shrink-0"
                            onClick={() => togglePaidMut.mutate({ id: o.id, paid: !o.paid })}>
                            {o.paid ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Circle className="h-3.5 w-3.5" />}
                            {o.paid ? "Pago" : "Marcar pago"}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 gap-1.5 shrink-0 text-blue-600 dark:text-blue-400"
                            onClick={() => generateTokenMut.mutate(o.client_id)} disabled={generateTokenMut.isPending}>
                            {generateTokenMut.isPending && generateTokenMut.variables === o.client_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Link2 className="h-3.5 w-3.5" />}
                            Link Portal
                          </Button>
                          <div className="flex items-center ml-auto sm:ml-0 sm:mt-auto sm:justify-end gap-1">
                            <button onClick={() => openEdit(o)}
                              className="rounded-md p-2 text-muted-foreground transition hover:text-foreground hover:bg-muted" aria-label="Editar">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => { if (confirm("Excluir OS?")) delMut.mutate(o.id); }}
                              className="rounded-md p-2 text-muted-foreground transition hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditingId(null); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0">
              <DialogHeader className="p-5 pb-4 border-b border-border">
                <DialogTitle>{editingId ? "Editar OS" : "Nova ordem de serviço inteligente"}</DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-secondary/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Cliente *</Label>
                    <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v, vehicle_id: "" })}>
                      <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                      <SelectContent>{clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Veículo *</Label>
                    <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })} disabled={!form.client_id}>
                      <SelectTrigger className="bg-background"><SelectValue placeholder={form.client_id ? "Selecione" : "Escolha o cliente primeiro"} /></SelectTrigger>
                      <SelectContent>
                        {vehicles?.map((v) => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} {v.plate && `— ${v.plate}`}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Problema relatado pelo cliente</Label>
                  <Textarea rows={2} className="bg-background" value={form.reported_problem} onChange={(e) => setForm({ ...form, reported_problem: e.target.value })} />
                </div>

                {/* Itens Dinâmicos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Mão de Obra e Peças</Label>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => addItem('service')} className="h-8 gap-1 text-xs"><PlusCircle className="h-3.5 w-3.5" /> Serviço</Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => addItem('part')} className="h-8 gap-1 text-xs"><PlusCircle className="h-3.5 w-3.5" /> Peça</Button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-background overflow-hidden">
                    {items.length === 0 ? (
                      <div className="p-6 text-center text-sm text-muted-foreground flex flex-col items-center">
                        <Calculator className="h-8 w-8 mb-2 opacity-20" />
                        Nenhum item adicionado à OS.
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {items.map((item, index) => (
                          <div key={item.id} className="p-3 flex items-start sm:items-center gap-3 flex-col sm:flex-row group">
                            <Badge variant="outline" className={cn("w-20 justify-center text-[10px] uppercase shrink-0", item.type === 'service' ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground')}>
                              {item.type === 'service' ? 'Serviço' : 'Peça'}
                            </Badge>
                            <Input className="h-8 sm:flex-1" placeholder="Descrição..." value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} />
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <Input className="h-8 w-20 text-center" type="number" min="1" placeholder="Qtd" value={item.quantity || ''} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} />
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                                <Input className="h-8 w-28 pl-7" type="number" step="0.01" placeholder="Preço" value={item.price || ''} onChange={(e) => updateItem(item.id, 'price', Number(e.target.value))} />
                              </div>
                              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label>Previsão de entrega</Label>
                      <Input type="date" className="bg-background w-full sm:w-1/2" value={form.expected_delivery} onChange={(e) => setForm({ ...form, expected_delivery: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Observações internas</Label>
                      <Textarea rows={2} className="bg-background" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal Serviços</span>
                      <span className="font-medium">{formatBRL(labor)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal Peças</span>
                      <span className="font-medium">{formatBRL(parts)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Desconto (R$)</span>
                      <Input type="number" step="0.01" className="h-8 w-28 text-right bg-background" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
                    </div>
                    <div className="pt-3 border-t border-border flex justify-between items-center">
                      <span className="font-semibold">Valor Total</span>
                      <span className="font-display text-xl font-bold text-primary">{formatBRL(total)}</span>
                    </div>
                  </div>
                </div>

              </div>
              <DialogFooter className="p-5 border-t border-border bg-background">
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button variant="hero" onClick={() => upsertMut.mutate()} disabled={!form.client_id || !form.vehicle_id || upsertMut.isPending}>
                  {upsertMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? "Salvar alterações" : "Criar Ordem de Serviço")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
}
