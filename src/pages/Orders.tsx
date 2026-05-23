import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ClipboardList, Plus, Loader2, MessageCircle, Trash2, Clock, CheckCircle2, Circle, Pencil, PlusCircle, Calculator, Link2, MoreHorizontal, FileText, ArrowRight, Printer } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { openWhatsApp, WhatsAppTemplates } from "@/lib/whatsapp";
import { enqueueAutomation } from "@/lib/automations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PrintLayout } from "@/components/PrintLayout";

type Status = "aguardando" | "em_manutencao" | "pronto" | "entregue";

interface OrderItem {
  id: string;
  name: string;
  item_type: "peca" | "servico";
  unit_price: number;
  quantity: number;
  inventory_id?: string | null;
}

const statusConfig: Record<Status, { label: string; dotClass: string; badgeClass: string }> = {
  aguardando: { label: "Aguardando", dotClass: "bg-slate-400", badgeClass: "bg-slate-100 text-slate-700 border-slate-200" },
  em_manutencao: { label: "Em Manutenção", dotClass: "bg-blue-500", badgeClass: "bg-blue-100 text-blue-700 border-blue-200" },
  pronto: { label: "Pronto", dotClass: "bg-primary", badgeClass: "bg-primary/10 text-primary border-primary/20" },
  entregue: { label: "Entregue", dotClass: "bg-emerald-500", badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const statusOrder: Status[] = ["aguardando", "em_manutencao", "pronto", "entregue"];
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
  const [printOrder, setPrintOrder] = useState<{order: any, type: "os"|"quote"|"receipt"} | null>(null);

  // OS Form State
  const [form, setForm] = useState({
    client_id: "", vehicle_id: "", reported_problem: "",
    expected_delivery: "", discount: "0", notes: "",
    payment_method: "", payment_condition: "", warranty_text: "",
    paid: false
  });

  const [items, setItems] = useState<OrderItem[]>([]);

  const { data: workshopInfo } = useQuery({
    queryKey: ["workshop-info", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data } = await supabase.from("workshops").select("*").eq("id", workshopId!).single();
      return data;
    }
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, clients(name, phone, document), vehicles(brand, model, plate, mileage), order_items(*)")
        .eq("workshop_id", workshopId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
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

  const { data: inventory } = useQuery({
    queryKey: ["inventory", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data } = await supabase.from("inventory").select("*").eq("workshop_id", workshopId!);
      return data ?? [];
    },
  });

  // Calculate totals
  const { subtotal, discount, total, labor, parts } = useMemo(() => {
    let labor = 0;
    let parts = 0;
    items.forEach(i => {
      const rowTotal = i.unit_price * i.quantity;
      if (i.item_type === "servico") labor += rowTotal;
      if (i.item_type === "peca") parts += rowTotal;
    });
    const subtotal = labor + parts;
    const discount = Number(form.discount || 0);
    const total = Math.max(0, subtotal - discount);
    return { subtotal, discount, total, labor, parts };
  }, [items, form.discount]);

  const upsertMut = useMutation({
    mutationFn: async () => {
      const payload: any = {
        workshop_id: workshopId!,
        client_id: form.client_id,
        vehicle_id: form.vehicle_id,
        reported_problem: form.reported_problem || null,
        amount: total,
        discount: discount,
        notes: form.notes || null,
        expected_delivery: form.expected_delivery || null,
        payment_method: form.payment_method || null,
        payment_condition: form.payment_condition || null,
        warranty_text: form.warranty_text || null,
      };

      if (form.paid) {
         payload.paid = true;
         // se ja tiver data nao mexe
         const currentOrder = orders?.find(o => o.id === editingId);
         if (!currentOrder?.paid_at) {
             payload.paid_at = new Date().toISOString();
         }
      } else {
         payload.paid = false;
         payload.paid_at = null;
      }

      let currentOrderId = editingId;

      if (!currentOrderId) {
        payload.status = "aguardando";
        payload.entry_date = new Date().toISOString();
        const { data, error } = await supabase.from("orders").insert(payload).select("id").single();
        if (error) throw error;
        currentOrderId = data.id;
      } else {
        const { error } = await supabase.from("orders").update(payload).eq("id", currentOrderId);
        if (error) throw error;
      }

      // Sync items
      await supabase.from("order_items").delete().eq("order_id", currentOrderId);
      if (items.length > 0) {
        const { error: itemsErr } = await supabase.from("order_items").insert(
          items.map(i => ({
            order_id: currentOrderId,
            item_type: i.item_type,
            name: i.name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            total_price: i.quantity * i.unit_price,
            inventory_id: i.inventory_id || null
          }))
        );
        if (itemsErr) throw itemsErr;
      }
      
      // Auto Deduct Stock
      if (payload.status === "pronto" || payload.status === "entregue") {
        await checkAndDeductInventory(currentOrderId);
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "OS atualizada!" : "Ordem criada!");
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["dashboard-stats-full"] });
      qc.invalidateQueries({ queryKey: ["financial-orders"] });
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
      const { error } = await supabase.from("orders").update(updates as any).eq("id", id);
      if (error) throw error;
      
      if (status === "pronto" || status === "entregue") {
         await checkAndDeductInventory(id);
      }
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
      toast.success(vars.paid ? "OS Marcada como Paga." : "OS Marcada como Pendente.");
    },
    onError: (e: Error) => toast.error(e.message),
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

  const handlePrint = (o: any, type: "os"|"quote"|"receipt" = "os") => {
    setPrintOrder({order: o, type});
    setTimeout(() => {
      window.print();
      setPrintOrder(null);
    }, 500);
  };

  const openEdit = (o: any) => {
    setEditingId(o.id);
    setForm({
      client_id: o.client_id,
      vehicle_id: o.vehicle_id,
      reported_problem: o.reported_problem ?? "",
      expected_delivery: o.expected_delivery ?? "",
      discount: String(o.discount ?? 0),
      notes: o.notes ?? "",
      payment_method: o.payment_method ?? "",
      payment_condition: o.payment_condition ?? "",
      warranty_text: o.warranty_text ?? "",
      paid: o.paid ?? false
    });
    setItems((o.order_items || []).map((i:any) => ({ id: i.id, name: i.name, item_type: i.item_type, unit_price: i.unit_price, quantity: i.quantity, inventory_id: i.inventory_id })));
    setOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ client_id: "", vehicle_id: "", reported_problem: "", expected_delivery: "", discount: "0", notes: "", payment_method: "", payment_condition: "", warranty_text: "", paid: false });
    setItems([]);
    setOpen(true);
  };

  const addItem = (item_type: "peca" | "servico") => setItems([...items, { id: Math.random().toString(36).substr(2, 9), name: "", item_type, unit_price: 0, quantity: 1 }]);
  const updateItem = (id: string, field: keyof OrderItem, value: any) => {
    setItems(items.map(i => {
      if (i.id !== id) return i;
      const updated = { ...i, [field]: value };
      if (field === 'name' && i.item_type === 'peca') {
         const invItem = inventory?.find(inv => inv.name === value);
         if (invItem) {
            updated.unit_price = invItem.sale_price;
            updated.inventory_id = invItem.id;
         } else {
            updated.inventory_id = null;
         }
      }
      return updated;
    }));
  };
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const filtered = (orders ?? []).filter((o) => filter === "all" || o.status === filter);
  const counts = (s: Status | "all") => s === "all" ? (orders?.length ?? 0) : (orders?.filter((o) => o.status === s).length ?? 0);

  return (
    <>
      {printOrder && (
        <div id="print-area-wrapper">
          <PrintLayout order={{...printOrder.order, items: printOrder.order.order_items}} workshop={workshopInfo} type={printOrder.type} />
        </div>
      )}
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-secondary/30">
          <AppSidebar />
          <main className="flex-1 overflow-x-hidden flex flex-col">
            <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
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

            <div className="space-y-6 p-4 md:p-8 flex-1 overflow-y-auto">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Gestão de Ordens</h2>
                  <p className="text-sm text-muted-foreground">Acompanhe as Ordens de Serviço dos orçamentos aprovados.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(["all", ...statusOrder] as const).map((s) => (
                    <button key={s} onClick={() => setFilter(s)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap shadow-sm",
                        filter === s ? "bg-foreground text-background border-foreground scale-105" : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}>
                      {s === "all" ? "Todas" : statusConfig[s].label} 
                      <span className={cn("ml-1.5 px-1.5 py-0.5 rounded-full text-[10px]", filter === s ? "bg-background/20" : "bg-secondary text-muted-foreground")}>{counts(s)}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Card className="border-border/60 shadow-sm overflow-hidden bg-background">
                {isLoading ? (
                  <div className="p-8 space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">Nenhuma ordem encontrada</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      {filter !== "all" ? `Nenhuma OS com o status "${statusConfig[filter as Status].label}".` : "Comece criando a sua primeira Ordem de Serviço."}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-secondary/40">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[100px]">OS</TableHead>
                          <TableHead>Cliente / Veículo</TableHead>
                          <TableHead className="w-[180px]">Status</TableHead>
                          <TableHead className="text-center w-[120px]">Datas</TableHead>
                          <TableHead className="text-right w-[140px]">Financeiro</TableHead>
                          <TableHead className="w-[180px] text-right pr-6">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filtered.map((o) => {
                          const rawStatus = String(o.status);
                          const normalizedStatus: Status = (rawStatus === "recebido" || rawStatus === "em_analise" || rawStatus === "aguardando_aprovacao") ? "aguardando" : (rawStatus === "em_andamento" ? "em_manutencao" : rawStatus as Status);
                          const cfg = statusConfig[normalizedStatus] || statusConfig.aguardando;
                          const next = nextStatus(normalizedStatus);
                          
                          return (
                            <TableRow key={o.id} className="group hover:bg-secondary/40 transition-colors">
                              <TableCell>
                                <span className="font-mono font-bold text-sm">#{String(o.number).padStart(4, "0")}</span>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-sm">{o.vehicles?.brand} {o.vehicles?.model} {o.vehicles?.plate && <span className="text-xs font-mono font-normal ml-1 bg-muted px-1 py-0.5 rounded border border-border/50">{o.vehicles.plate}</span>}</span>
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                    <span>{o.clients?.name}</span>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold tracking-wide uppercase", cfg.badgeClass)}>
                                  <span className={cn("h-1.5 w-1.5 rounded-full", cfg.dotClass)} />
                                  {cfg.label}
                                </div>
                                {next && (
                                  <div className="mt-2">
                                    <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 py-0 border-primary/20 hover:border-primary/50 text-muted-foreground hover:text-foreground" onClick={() => updateStatusMut.mutate({ id: o.id, status: next, clientId: o.client_id })}>
                                      Mover p/ {statusConfig[next].label} <ArrowRight className="h-3 w-3 ml-1" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-0.5">
                                  <span className="text-xs font-medium text-foreground">{format(new Date(o.entry_date), "dd/MM/yy")}</span>
                                  {o.expected_delivery ? (
                                    <span className="text-[10px] text-muted-foreground">Até {format(new Date(o.expected_delivery), "dd/MM/yy")}</span>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground">—</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex flex-col items-end gap-1">
                                  <span className="font-semibold tabular-nums text-sm">{formatBRL(Number(o.amount))}</span>
                                  <Button 
                                    variant="default" 
                                    size="sm" 
                                    className={cn("h-7 px-3 text-xs font-bold tracking-wider rounded-md shadow-md transition-all hover:-translate-y-0.5", o.paid ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-orange-500 hover:bg-orange-600 text-white")}
                                    onClick={() => togglePaidMut.mutate({ id: o.id, paid: !o.paid })}
                                    title="Clique para alterar entre PAGO e PENDENTE"
                                  >
                                    {o.paid ? "✓ PAGO" : "⏳ PENDENTE"}
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell className="text-right pr-4">
                                <div className="flex items-center justify-end gap-1">
                                  <Button variant="outline" size="sm" onClick={() => handlePrint(o, "os")} className="h-8 border-border text-foreground hover:bg-secondary" title="Imprimir Ordem de Serviço">
                                    <Printer className="h-4 w-4 mr-1.5" /> Imprimir
                                  </Button>
                                  
                                  <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-56">
                                        <DropdownMenuItem onClick={() => {
                                          navigator.clipboard.writeText(`${window.location.origin}/portal/os/${o.id}`);
                                          toast.success("Link do Portal copiado!");
                                        }} className="cursor-pointer font-bold text-blue-600">
                                          <Link2 className="h-4 w-4 mr-2" /> Copiar Link Público
                                        </DropdownMenuItem>
                                        
                                        {o.paid && (
                                        <DropdownMenuItem onClick={() => handlePrint(o, "receipt")} className="cursor-pointer font-bold text-emerald-600">
                                          <FileText className="h-4 w-4 mr-2" /> Imprimir Recibo
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem onClick={() => openEdit(o)} className="cursor-pointer">
                                        <Pencil className="h-4 w-4 mr-2" /> Editar OS
                                      </DropdownMenuItem>
                                      
                                      {o.status === "pronto" && o.clients?.phone && (
                                        <DropdownMenuItem onClick={() => {
                                          const msg = WhatsAppTemplates.orderReady(o.clients!.name, `${o.vehicles?.brand} ${o.vehicles?.model}`, o.vehicles?.plate ?? "");
                                          if (workshopId) {
                                            enqueueAutomation(workshopId, "whatsapp_order_ready", { phone: o.clients!.phone!, message: msg, client_name: o.clients!.name, reference: `OS #${String(o.number).padStart(4, "0")}` }).catch(() => {});
                                          }
                                          openWhatsApp(o.clients!.phone, msg);
                                        }} className="cursor-pointer">
                                          <MessageCircle className="h-4 w-4 mr-2 text-green-500" /> Avisar Cliente
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={() => { if (confirm("Excluir OS permanentemente?")) delMut.mutate(o.id); }}>
                                        <Trash2 className="h-4 w-4 mr-2" /> Excluir OS
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            </div>

            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditingId(null); }}>
              <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0 border-0 shadow-xl overflow-hidden">
                <DialogHeader className="p-6 pb-5 bg-background border-b border-border/40 z-10">
                  <DialogTitle className="text-xl">{editingId ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-secondary/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Cliente <span className="text-red-500">*</span></Label>
                      <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v, vehicle_id: "" })}>
                        <SelectTrigger className="bg-background shadow-sm border-border/50 h-11"><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                        <SelectContent>{clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Veículo <span className="text-red-500">*</span></Label>
                      <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })} disabled={!form.client_id}>
                        <SelectTrigger className="bg-background shadow-sm border-border/50 h-11"><SelectValue placeholder={form.client_id ? "Selecione o veículo" : "Escolha o cliente primeiro"} /></SelectTrigger>
                        <SelectContent>
                          {vehicles?.map((v) => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} {v.plate && `— ${v.plate}`}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Relato do Cliente / Problema Relatado</Label>
                    <Textarea rows={2} className="bg-background shadow-sm border-border/50 resize-none placeholder:text-muted-foreground/60" placeholder="Qual o problema relatado? Barulhos, falhas..." value={form.reported_problem} onChange={(e) => setForm({ ...form, reported_problem: e.target.value })} />
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Peças e Serviços Adicionados</Label>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => addItem('servico')} className="h-8 gap-1.5 text-xs bg-background shadow-sm"><PlusCircle className="h-3.5 w-3.5" /> Adicionar Serviço</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => addItem('peca')} className="h-8 gap-1.5 text-xs bg-background shadow-sm"><PlusCircle className="h-3.5 w-3.5" /> Adicionar Peça</Button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-background overflow-hidden shadow-sm">
                      {items.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center bg-secondary/10">
                          <Calculator className="h-10 w-10 mb-3 opacity-20" />
                          Nenhum item adicionado à OS.
                        </div>
                      ) : (
                        <div className="divide-y divide-border/50">
                          {items.map((item) => (
                            <div key={item.id} className="p-3.5 flex items-start sm:items-center gap-3 flex-col sm:flex-row group transition-colors hover:bg-secondary/20">
                              <Badge variant="outline" className={cn("w-20 justify-center text-[10px] tracking-wider uppercase shrink-0 border-0 font-bold", item.item_type === 'servico' ? "bg-slate-800 text-white" : "bg-secondary text-foreground")}>
                                {item.item_type === 'servico' ? "Serviço" : "Peça"}
                              </Badge>
                              
                              <div className="flex-1 w-full relative">
                                <Input list={item.item_type === 'peca' ? "inventory-list" : undefined} className="h-9 w-full bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-primary shadow-none px-2" placeholder="Descrição do item..." value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} />
                                {item.item_type === 'peca' && inventory && (
                                  <datalist id="inventory-list">
                                    {inventory.map((inv: any) => <option key={inv.id} value={inv.name} />)}
                                  </datalist>
                                )}
                              </div>

                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <Input className="h-9 w-16 text-center bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-md" type="number" min="1" placeholder="Qtd" value={item.quantity || ''} onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))} />
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">R$</span>
                                  <Input className="h-9 w-28 pl-8 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary rounded-md text-right pr-3 font-medium" type="number" step="0.01" placeholder="Preço" value={item.unit_price || ''} onChange={(e) => updateItem(item.id, 'unit_price', Number(e.target.value))} />
                                </div>
                                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => removeItem(item.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações Extras e Resumo */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Forma de Pagamento</Label>
                          <Select value={form.payment_method} onValueChange={(v) => setForm({ ...form, payment_method: v })}>
                            <SelectTrigger className="bg-background shadow-sm border-border/50 h-10"><SelectValue placeholder="Dinheiro, Pix, Cartão..." /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pix">Pix</SelectItem>
                              <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                              <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                              <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                              <SelectItem value="Boleto">Boleto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Condição / Parcelas</Label>
                          <Input className="bg-background shadow-sm border-border/50 h-10" placeholder="Ex: 3x sem juros" value={form.payment_condition} onChange={(e) => setForm({ ...form, payment_condition: e.target.value })} />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Garantia do Serviço (Visível ao cliente)</Label>
                        <Input className="bg-background shadow-sm border-border/50 h-10" placeholder="Ex: 90 dias conforme CDC" value={form.warranty_text} onChange={(e) => setForm({ ...form, warranty_text: e.target.value })} />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Anotações Internas (Não visível ao cliente)</Label>
                        <Textarea rows={2} className="bg-background shadow-sm border-border/50 resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/50 bg-secondary/30 p-5 space-y-4 shadow-sm self-start">
                      <div className="flex justify-between items-center mb-2 pb-2 border-b border-border">
                        <h4 className="font-display font-semibold text-foreground flex items-center gap-2"><Calculator className="h-4 w-4" /> Resumo</h4>
                        
                        {/* TOGGLE PARA PAGAMENTO NA HORA */}
                        <div className="flex items-center space-x-2 bg-background/50 px-3 py-1.5 rounded-full border border-primary/20">
                          <Switch 
                            id="paid-toggle" 
                            checked={form.paid} 
                            onCheckedChange={(v) => setForm({...form, paid: v})}
                          />
                          <Label htmlFor="paid-toggle" className={cn("text-sm font-bold cursor-pointer", form.paid ? "text-emerald-600" : "text-muted-foreground")}>
                            {form.paid ? "PAGAMENTO RECEBIDO" : "Cobrança Pendente"}
                          </Label>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Mão de Obra</span>
                        <span className="font-semibold text-foreground">{formatBRL(labor)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground font-medium">Peças</span>
                        <span className="font-semibold text-foreground">{formatBRL(parts)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-2">
                        <span className="text-muted-foreground font-medium">Desconto Aplicado (R$)</span>
                        <Input type="number" step="0.01" className="h-9 w-32 text-right bg-background border-border/50" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
                      </div>
                      <div className="pt-4 mt-2 border-t border-border flex justify-between items-center">
                        <span className="font-bold text-base uppercase tracking-wider text-foreground">Total Final</span>
                        <span className="font-display text-3xl font-bold text-foreground tracking-tight">{formatBRL(total)}</span>
                      </div>
                    </div>
                  </div>

                </div>
                <DialogFooter className="p-6 bg-background border-t border-border/40 z-10 flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setOpen(false)} className="px-6">Cancelar</Button>
                  {editingId && (
                    <Button variant="outline" onClick={() => handlePrint({ ...form, id: editingId, discount: Number(form.discount || 0), number: (orders?.find((o:any) => o.id === editingId) as any)?.number, clients: clients?.find((c:any) => c.id === form.client_id), vehicles: vehicles?.find((v:any) => v.id === form.vehicle_id), order_items: items, amount: total }, "os")} className="px-6 border-border hover:bg-secondary">
                      <Printer className="h-4 w-4 mr-2" /> Imprimir
                    </Button>
                  )}
                  <Button variant="hero" onClick={() => upsertMut.mutate()} disabled={!form.client_id || !form.vehicle_id || upsertMut.isPending} className="px-8 shadow-md">
                    {upsertMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? "Salvar Alterações" : "Emitir Ordem de Serviço")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </SidebarProvider>
    </>
  );
}
