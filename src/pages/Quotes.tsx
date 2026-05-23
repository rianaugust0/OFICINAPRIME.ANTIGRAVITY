import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileSignature, Plus, Loader2, MessageCircle, Trash2, Clock, CheckCircle2, Circle, Pencil, PlusCircle, Calculator, Link2, MoreHorizontal, FileText, ArrowRight, Printer, XCircle, Send, Search } from "lucide-react";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { openWhatsApp, WhatsAppTemplates } from "@/lib/whatsapp";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { PrintLayout } from "@/components/PrintLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";

type Status = "novo" | "contato_feito" | "analise" | "aprovado" | "recusado";

interface QuoteItem {
  id: string;
  name: string;
  item_type: "peca" | "servico";
  unit_price: number;
  quantity: number;
}

const statusConfig: Record<Status, { label: string; color: string; border: string }> = {
  novo: { label: "Novo Orçamento", color: "bg-slate-500", border: "border-slate-200" },
  contato_feito: { label: "Contato Feito", color: "bg-blue-500", border: "border-blue-200" },
  analise: { label: "Em Análise", color: "bg-amber-500", border: "border-amber-200" },
  aprovado: { label: "Aprovado", color: "bg-emerald-500", border: "border-emerald-200" },
  recusado: { label: "Recusado", color: "bg-red-500", border: "border-red-200" },
};

const statusOrder: Status[] = ["novo", "contato_feito", "analise", "aprovado", "recusado"];

const formatBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Quotes() {
  const { workshopId } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [printQuote, setPrintQuote] = useState<any | null>(null);

  // Form State
  const [form, setForm] = useState({
    client_id: "", vehicle_id: "", notes: "", discount: "0",
    payment_method: "", payment_condition: "", warranty_text: ""
  });

  const [items, setItems] = useState<QuoteItem[]>([]);

  const { data: workshopInfo } = useQuery({
    queryKey: ["workshop-info", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data } = await supabase.from("workshops").select("*").eq("id", workshopId!).single();
      return data;
    }
  });

  const { data: quotes, isLoading } = useQuery({
    queryKey: ["quotes", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*, clients(name, phone, document), vehicles(brand, model, plate, mileage), quote_items(*)")
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
        vehicle_id: form.vehicle_id || null,
        amount: total,
        notes: form.notes || null,
        payment_method: form.payment_method || null,
        payment_condition: form.payment_condition || null,
        warranty_text: form.warranty_text || null,
        discount: Number(form.discount || 0),
      };

      let currentId = editingId;

      if (!currentId) {
        payload.status = "novo";
        const { data, error } = await supabase.from("quotes").insert(payload).select("id").single();
        if (error) throw error;
        currentId = data.id;
      } else {
        const { error } = await supabase.from("quotes").update(payload).eq("id", currentId);
        if (error) throw error;
      }

      // Sync items
      await supabase.from("quote_items").delete().eq("quote_id", currentId);
      if (items.length > 0) {
        const { error: itemsErr } = await supabase.from("quote_items").insert(
          items.map(i => ({
            quote_id: currentId,
            item_type: i.item_type,
            name: i.name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            total_price: i.quantity * i.unit_price
          }))
        );
        if (itemsErr) throw itemsErr;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Orçamento atualizado!" : "Orçamento criado!");
      qc.invalidateQueries({ queryKey: ["quotes"] });
      setOpen(false);
      setEditingId(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateStatusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Status atualizado.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("quotes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      toast.success("Orçamento excluído.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handlePrint = (o: any) => {
    setPrintQuote(o);
    setTimeout(() => {
      window.print();
      setPrintQuote(null);
    }, 500);
  };

  const openEdit = (o: any) => {
    setEditingId(o.id);
    setForm({
      client_id: o.client_id,
      vehicle_id: o.vehicle_id || "",
      notes: o.notes ?? "",
      discount: String(o.discount ?? 0),
      payment_method: o.payment_method ?? "",
      payment_condition: o.payment_condition ?? "",
      warranty_text: o.warranty_text ?? ""
    });
    setItems((o.quote_items || []).map((i:any) => ({ id: i.id, name: i.name, item_type: i.item_type, unit_price: i.unit_price, quantity: i.quantity })));
    setOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ client_id: "", vehicle_id: "", notes: "", discount: "0", payment_method: "", payment_condition: "", warranty_text: "" });
    setItems([]);
    setOpen(true);
  };

  const addItem = (item_type: "peca" | "servico") => setItems([...items, { id: Math.random().toString(36).substr(2, 9), name: "", item_type, unit_price: 0, quantity: 1 }]);
  const updateItem = (id: string, field: keyof QuoteItem, value: any) => setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const filtered = (quotes ?? []).filter((q) => {
    const clientName = q.clients?.name || "";
    const vehicleBrand = q.vehicles?.brand || "";
    return clientName.toLowerCase().includes(search.toLowerCase()) || 
           vehicleBrand.toLowerCase().includes(search.toLowerCase()) ||
           q.id.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <ErrorBoundary>
      {printQuote && (
        <div id="print-area-wrapper">
          <PrintLayout order={{...printQuote, items: printQuote.quote_items}} workshop={workshopInfo} type="quote" />
        </div>
      )}
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-secondary/30">
          <AppSidebar />
          <main className="flex-1 overflow-x-hidden flex flex-col h-screen">
            <header className="shrink-0 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="flex flex-1 items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FileSignature className="h-5 w-5 text-primary" />
                  <h1 className="font-display text-lg font-semibold tracking-tight">Orçamentos</h1>
                </div>
                <Button variant="hero" size="sm" className="gap-2" onClick={openNew} disabled={!clients?.length}>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Criar Orçamento</span>
                </Button>
              </div>
            </header>

            <div className="flex flex-col flex-1 overflow-hidden p-4 md:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight">Funil de Vendas</h2>
                  <p className="text-sm text-muted-foreground">Acompanhe negociações e aprovações de orçamentos.</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar orçamento..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                    className="pl-10 bg-background" 
                  />
                </div>
              </div>

              {isLoading ? (
                <div className="p-8 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
                </div>
              ) : (
                <div className="flex-1 overflow-x-auto overflow-y-hidden pt-2">
                  <div className="flex h-full gap-4 min-w-[1000px] pb-4">
                    {statusOrder.map((statusId) => {
                      const col = statusConfig[statusId];
                      const columnQuotes = filtered.filter(q => q.status === statusId);
                      const totalValue = columnQuotes.reduce((acc, q) => acc + Number(q.amount || 0), 0);

                      return (
                        <div key={statusId} className="flex flex-col flex-1 min-w-[280px] max-w-[350px] bg-secondary/30 rounded-xl border border-border/50 overflow-hidden">
                          <div className={cn("p-4 border-b bg-background flex flex-col gap-1", col.border)}>
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold text-sm flex items-center gap-2">
                                <span className={cn("w-2 h-2 rounded-full", col.color)} />
                                {col.label}
                              </h3>
                              <Badge variant="secondary" className="font-mono">{columnQuotes.length}</Badge>
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">{formatBRL(totalValue)}</span>
                          </div>

                          <div className="flex-1 overflow-y-auto p-3 space-y-3">
                            {columnQuotes.map((q) => (
                              <Card key={q.id} className="p-4 shadow-sm border-border/60 hover:border-primary/30 transition-all cursor-default group relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-border group-hover:bg-primary transition-colors" />
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-mono text-muted-foreground font-semibold bg-secondary px-1.5 py-0.5 rounded">#{q.id.substring(0,8).toUpperCase()}</span>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2 opacity-50 group-hover:opacity-100">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => handlePrint(q)} className="font-bold cursor-pointer"><Printer className="h-4 w-4 mr-2" /> Imprimir Orçamento</DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openEdit(q)} className="cursor-pointer"><Pencil className="h-4 w-4 mr-2" /> Editar Detalhes</DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      {q.status !== "contato_feito" && <DropdownMenuItem onClick={() => updateStatusMut.mutate({id: q.id, status: "contato_feito"})} className="cursor-pointer"><Send className="h-4 w-4 mr-2 text-blue-500" /> Mover para Contato Feito</DropdownMenuItem>}
                                      {q.status !== "analise" && <DropdownMenuItem onClick={() => updateStatusMut.mutate({id: q.id, status: "analise"})} className="cursor-pointer"><FileText className="h-4 w-4 mr-2 text-amber-500" /> Mover para Análise</DropdownMenuItem>}
                                      {q.status !== "aprovado" && <DropdownMenuItem onClick={() => updateStatusMut.mutate({id: q.id, status: "aprovado"})} className="cursor-pointer"><CheckCircle2 className="h-4 w-4 mr-2 text-emerald-500" /> Mover para Aprovado</DropdownMenuItem>}
                                      {q.status !== "recusado" && <DropdownMenuItem onClick={() => updateStatusMut.mutate({id: q.id, status: "recusado"})} className="cursor-pointer"><XCircle className="h-4 w-4 mr-2 text-red-500" /> Mover para Recusado</DropdownMenuItem>}
                                      {q.status !== "novo" && <DropdownMenuItem onClick={() => updateStatusMut.mutate({id: q.id, status: "novo"})} className="cursor-pointer"><ArrowRight className="h-4 w-4 mr-2" /> Voltar para Novo</DropdownMenuItem>}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={() => { if (confirm("Excluir orçamento?")) delMut.mutate(q.id); }}>
                                        <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                                <div className="space-y-2">
                                  <div>
                                    <h4 className="font-semibold text-sm line-clamp-1">{q.clients?.name}</h4>
                                    {q.vehicles && <p className="text-xs text-muted-foreground mt-0.5">{q.vehicles.brand} {q.vehicles.model}</p>}
                                  </div>
                                  <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-3">
                                    <span className="text-[10px] text-muted-foreground">{format(new Date(q.created_at), "dd/MM/yyyy")}</span>
                                    <span className="font-bold text-sm text-primary">{formatBRL(Number(q.amount))}</span>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal */}
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditingId(null); }}>
              <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col gap-0 p-0 border-0 shadow-xl overflow-hidden">
                <DialogHeader className="p-6 pb-5 bg-background border-b border-border/40 z-10">
                  <DialogTitle className="text-xl">{editingId ? "Editar Orçamento" : "Novo Orçamento"}</DialogTitle>
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
                      <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Veículo</Label>
                      <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })} disabled={!form.client_id}>
                        <SelectTrigger className="bg-background shadow-sm border-border/50 h-11"><SelectValue placeholder={form.client_id ? "Selecione o veículo" : "Escolha o cliente primeiro"} /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum / Não aplicável</SelectItem>
                          {vehicles?.map((v) => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} {v.plate && `— ${v.plate}`}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Descrição Resumida do Orçamento</Label>
                    <Textarea rows={2} className="bg-background shadow-sm border-border/50 resize-none placeholder:text-muted-foreground/60" placeholder="Ex: Revisão de 50.000km, Troca de óleo..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>

                  {/* Itens Dinâmicos */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">Itens do Orçamento</Label>
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => addItem('servico')} className="h-8 gap-1.5 text-xs bg-background shadow-sm"><PlusCircle className="h-3.5 w-3.5" /> Adicionar Serviço</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => addItem('peca')} className="h-8 gap-1.5 text-xs bg-background shadow-sm"><PlusCircle className="h-3.5 w-3.5" /> Adicionar Peça</Button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-background overflow-hidden shadow-sm">
                      {items.length === 0 ? (
                        <div className="p-8 text-center text-sm text-muted-foreground flex flex-col items-center bg-secondary/10">
                          <Calculator className="h-10 w-10 mb-3 opacity-20" />
                          Nenhum item adicionado ao orçamento.
                        </div>
                      ) : (
                        <div className="divide-y divide-border/50">
                          {items.map((item, index) => (
                            <div key={item.id} className="p-3.5 flex items-start sm:items-center gap-3 flex-col sm:flex-row group transition-colors hover:bg-secondary/20">
                              <Badge variant="outline" className={cn("w-20 justify-center text-[10px] tracking-wider uppercase shrink-0 border-0 font-bold", item.item_type === 'servico' ? "bg-slate-800 text-white" : "bg-secondary text-foreground")}>
                                {item.item_type === 'servico' ? "Serviço" : "Peça"}
                              </Badge>
                              <Input className="h-9 sm:flex-1 bg-transparent border-0 focus-visible:ring-1 focus-visible:ring-primary shadow-none px-2" placeholder="Descrição do item..." value={item.name} onChange={(e) => updateItem(item.id, 'name', e.target.value)} />
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
                    </div>

                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4 shadow-sm self-start">
                      <h4 className="font-display font-semibold text-primary mb-2 flex items-center gap-2"><Calculator className="h-4 w-4" /> Resumo Financeiro</h4>
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
                      <div className="pt-4 mt-2 border-t border-primary/20 flex justify-between items-center">
                        <span className="font-bold text-base uppercase tracking-wider">Total Final</span>
                        <span className="font-display text-3xl font-bold text-primary tracking-tight">{formatBRL(total)}</span>
                      </div>
                    </div>
                  </div>

                </div>
                <DialogFooter className="p-6 bg-background border-t border-border/40 z-10 flex justify-end gap-3">
                  <Button variant="ghost" onClick={() => setOpen(false)} className="px-6">Cancelar</Button>
                  {editingId && (
                    <Button variant="outline" onClick={() => handlePrint({ ...form, id: editingId, quote_items: items, amount: total, discount: Number(form.discount || 0), clients: clients?.find((c:any) => c.id === form.client_id), vehicles: vehicles?.find((v:any) => v.id === form.vehicle_id) })} className="px-6 border-border hover:bg-secondary">
                      <Printer className="h-4 w-4 mr-2" /> Imprimir
                    </Button>
                  )}
                  <Button variant="hero" onClick={() => upsertMut.mutate()} disabled={!form.client_id || upsertMut.isPending} className="px-8 shadow-md">
                    {upsertMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? "Salvar Alterações" : "Emitir Orçamento")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </main>
        </div>
      </SidebarProvider>
    </ErrorBoundary>
  );
}
