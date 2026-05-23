import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bot, Plus, Search, MessageCircle, CalendarClock, Cake, Zap, CheckCircle2, MoreHorizontal, FileText, PauseCircle, PlayCircle, Settings2, Trash2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AutomationType = "service_reminder" | "birthday" | "feedback" | "payment";

const typeConfig: Record<string, { label: string; icon: any; color: string }> = {
  service_reminder: { label: "Lembrete de Serviço", icon: CalendarClock, color: "text-blue-500 bg-blue-500/10" },
  birthday: { label: "Aniversário", icon: Cake, color: "text-fuchsia-500 bg-fuchsia-500/10" },
  feedback: { label: "Pós-Venda", icon: MessageCircle, color: "text-emerald-500 bg-emerald-500/10" },
  payment: { label: "Follow-up / Cobrança", icon: Zap, color: "text-amber-500 bg-amber-500/10" },
};

export default function Automations() {
  const { workshopId } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", type: "service_reminder" as AutomationType, trigger_condition: "", message_template: ""
  });

  const { data: automations = [], isLoading } = useQuery({
    queryKey: ["automations", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automation_rules")
        .select("*")
        .eq("workshop_id", workshopId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const upsertMut = useMutation({
    mutationFn: async () => {
      const payload: any = {
        workshop_id: workshopId!,
        name: form.name,
        type: form.type,
        trigger_condition: form.trigger_condition,
        message_template: form.message_template,
      };

      if (!editingId) {
        payload.is_active = true;
        const { error } = await supabase.from("automation_rules").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("automation_rules").update(payload).eq("id", editingId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Regra atualizada!" : "Regra criada com sucesso!");
      qc.invalidateQueries({ queryKey: ["automations"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMut = useMutation({
    mutationFn: async ({ id, is_active }: { id: string, is_active: boolean }) => {
      const { error } = await supabase.from("automation_rules").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automation_rules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Regra excluída.");
      qc.invalidateQueries({ queryKey: ["automations"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditingId(null);
    setForm({ name: "", type: "service_reminder", trigger_condition: "", message_template: "" });
    setOpen(true);
  };

  const openEdit = (a: any) => {
    setEditingId(a.id);
    setForm({ name: a.name, type: a.type, trigger_condition: a.trigger_condition, message_template: a.message_template });
    setOpen(true);
  };

  const filtered = automations.filter((a: any) => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.trigger_condition.toLowerCase().includes(search.toLowerCase())
  );

  const totalSent = automations.reduce((acc: number, a: any) => acc + (a.sent_count || 0), 0);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-secondary/30">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex flex-1 items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                <h1 className="font-display text-lg font-semibold tracking-tight">Automações (CRM)</h1>
              </div>
              <Button variant="hero" size="sm" className="gap-2" onClick={openNew}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova Regra</span>
              </Button>
            </div>
          </header>

          <div className="space-y-6 p-4 md:p-8 flex-1 overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Fluxos Automáticos</h2>
                <p className="text-sm text-muted-foreground">Regras e mensagens pré-configuradas reais do seu banco de dados.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Buscar automação..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="pl-10 bg-background" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="p-4 border-border/60 bg-background flex flex-col justify-center items-start shadow-sm border-l-4 border-l-primary">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold text-muted-foreground">Mensagens Disparadas</span>
                </div>
                <span className="text-3xl font-display font-bold">{totalSent}</span>
              </Card>
              <Card className="p-4 border-border/60 bg-background flex flex-col justify-center items-start shadow-sm border-l-4 border-l-emerald-500">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-sm font-semibold text-muted-foreground">Regras Ativas</span>
                </div>
                <span className="text-3xl font-display font-bold">{automations.filter((a: any) => a.is_active).length}</span>
              </Card>
              <Card className="p-4 border-border/60 bg-background flex flex-col justify-center items-start shadow-sm border-l-4 border-l-blue-500">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarClock className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-semibold text-muted-foreground">Status do Robô</span>
                </div>
                <span className="text-xl font-display font-bold text-blue-600">Aguardando Fase 3</span>
              </Card>
            </div>

            <Card className="border-border/60 shadow-sm overflow-hidden bg-background">
              {filtered.length === 0 && !isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">Nenhuma automação cadastrada</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Comece criando o seu primeiro lembrete de troca de óleo ou pesquisa de satisfação.
                  </p>
                  <Button onClick={openNew} variant="outline" className="mt-6 gap-2 border-primary/20 hover:bg-primary/5">
                    <Plus className="h-4 w-4" /> Criar Regra Real
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-secondary/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[300px]">Nome da Automação</TableHead>
                        <TableHead>Gatilho (Quando?)</TableHead>
                        <TableHead className="text-center">Enviados</TableHead>
                        <TableHead className="text-center w-[120px]">Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((a: any) => {
                        const Icon = typeConfig[a.type]?.icon || Bot;
                        const color = typeConfig[a.type]?.color || "text-slate-500 bg-slate-500/10";
                        return (
                          <TableRow key={a.id} className="group hover:bg-secondary/40">
                            <TableCell>
                              <div className="flex items-start gap-3">
                                <div className={cn("mt-0.5 shrink-0 p-2 rounded-md", color)}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-sm">{a.name}</span>
                                  <span className="text-xs text-muted-foreground line-clamp-1 mt-1 pr-4 bg-muted/40 p-1 rounded font-mono">
                                    "{a.message_template}"
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-medium">
                                {a.trigger_condition}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="font-mono">{a.sent_count || 0}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Switch 
                                  checked={a.is_active} 
                                  onCheckedChange={(v) => toggleMut.mutate({ id: a.id, is_active: v })}
                                />
                                {a.is_active ? (
                                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Ativo</span>
                                ) : (
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Pausado</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => openEdit(a)} className="cursor-pointer">
                                    <Settings2 className="h-4 w-4 mr-2" /> Editar Regra
                                  </DropdownMenuItem>
                                  {a.is_active ? (
                                    <DropdownMenuItem onClick={() => toggleMut.mutate({ id: a.id, is_active: false })} className="cursor-pointer">
                                      <PauseCircle className="h-4 w-4 mr-2 text-amber-500" /> Pausar
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => toggleMut.mutate({ id: a.id, is_active: true })} className="cursor-pointer">
                                      <PlayCircle className="h-4 w-4 mr-2 text-emerald-500" /> Ativar
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => { if(confirm("Excluir regra?")) delMut.mutate(a.id); }} className="cursor-pointer text-destructive focus:text-destructive">
                                    <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-xl w-full">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Regra" : "Nova Regra de Automação"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome da Automação</Label>
                  <Input placeholder="Ex: Lembrete de Óleo 6 meses" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Ação</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({...form, type: v as AutomationType})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="service_reminder">Lembrete de Serviço (Ex: Óleo)</SelectItem>
                      <SelectItem value="feedback">Pesquisa de Satisfação (Pós-Venda)</SelectItem>
                      <SelectItem value="birthday">Feliz Aniversário</SelectItem>
                      <SelectItem value="payment">Cobrança / Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Gatilho (Quando enviar?)</Label>
                  <Input placeholder="Ex: 180 dias após serviço de troca de óleo" value={form.trigger_condition} onChange={(e) => setForm({...form, trigger_condition: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Template da Mensagem (WhatsApp)</Label>
                  <Textarea rows={4} placeholder="Ex: Olá {cliente}, tudo bem? Já faz 6 meses da troca de óleo do {veiculo}..." value={form.message_template} onChange={(e) => setForm({...form, message_template: e.target.value})} />
                  <p className="text-xs text-muted-foreground mt-1">Variáveis disponíveis: {'{cliente}'}, {'{veiculo}'}, {'{oficina}'}</p>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button variant="hero" onClick={() => upsertMut.mutate()} disabled={!form.name || !form.trigger_condition || !form.message_template}>
                  {editingId ? "Salvar" : "Criar Regra"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
}