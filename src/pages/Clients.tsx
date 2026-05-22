import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Search, Phone, Car, Calendar, MessageCircle, Loader2, Trash2, DollarSign } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { openWhatsApp } from "@/lib/whatsapp";
import { formatPhone, formatDocument } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface ClientRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  document: string | null;
  notes: string | null;
  last_service_at: string | null;
  vehicles: { count: number }[];
  orders: { amount: number; paid: boolean }[];
}

const formatBRL = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Clients() {
  const { workshopId } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", document: "", notes: "" });

  const { data, isLoading } = useQuery({
    queryKey: ["clients", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, phone, email, document, notes, last_service_at, vehicles(count), orders(amount, paid)")
        .eq("workshop_id", workshopId!)
        .order("name");
      if (error) throw error;
      return data as unknown as ClientRow[];
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("clients").insert({
        workshop_id: workshopId!,
        name: form.name.trim(),
        phone: form.phone || null,
        email: form.email || null,
        document: form.document || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente cadastrado!");
      qc.invalidateQueries({ queryKey: ["clients"] });
      setOpen(false);
      setForm({ name: "", phone: "", email: "", document: "", notes: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Cliente excluído.");
      qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = (data ?? []).filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search),
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex flex-1 items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h1 className="font-display text-lg font-semibold tracking-tight">Clientes</h1>
              </div>
              <Button variant="hero" size="sm" className="gap-2" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Cliente</span>
              </Button>
            </div>
          </header>

          <div className="space-y-4 p-4 md:p-6 flex-1 overflow-y-auto">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por nome ou telefone…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>

            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({length: 6}).map((_, i) => <Skeleton key={i} className="h-44 w-full rounded-xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <Card className="flex flex-col items-center justify-center border-dashed border-border/60 px-6 py-16 text-center shadow-sm">
                <Users className="h-8 w-8 text-muted-foreground" />
                <p className="mt-4 font-medium">{search ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}</p>
                <p className="mt-1 text-sm text-muted-foreground">Comece adicionando seu primeiro cliente.</p>
                <Button onClick={() => setOpen(true)} variant="outline" size="sm" className="mt-5 gap-2">
                  <Plus className="h-4 w-4" /> Novo Cliente
                </Button>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((c) => {
                  const spent = (c.orders || []).filter(o => o.paid).reduce((s, o) => s + Number(o.amount || 0), 0);
                  
                  return (
                    <Card key={c.id} className="group border-border/60 p-5 transition-all hover:border-primary/40 hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-display text-base font-bold">{c.name}</p>
                          {c.phone && <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><Phone className="h-3.5 w-3.5" /> {c.phone}</p>}
                        </div>
                        <button onClick={() => { if (confirm("Excluir cliente?")) delMut.mutate(c.id); }} className="text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100" aria-label="Excluir">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-4 text-xs">
                        <div>
                          <p className="text-muted-foreground mb-1 flex items-center gap-1"><Car className="h-3 w-3" /> Veículos</p>
                          <p className="font-semibold">{c.vehicles?.[0]?.count ?? 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1 flex items-center gap-1"><Calendar className="h-3 w-3" /> Última Visita</p>
                          <p className="font-semibold">{c.last_service_at ? format(new Date(c.last_service_at), "dd/MM/yy", { locale: ptBR }) : "—"}</p>
                        </div>
                        <div className="col-span-2 mt-2 bg-muted/50 p-2 rounded-md flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Total Gasto</span>
                          <span className="font-display font-bold text-foreground">{formatBRL(spent)}</span>
                        </div>
                      </div>

                      {c.phone && (
                        <Button variant="hero" size="sm" className="mt-4 w-full gap-2"
                          onClick={() => openWhatsApp(c.phone, `Olá ${c.name}!`)}>
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </Button>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md w-full">
              <DialogHeader>
                <DialogTitle>Novo cliente</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Nome *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Telefone</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} placeholder="(11) 99999-0000" />
                  </div>
                  <div>
                    <Label>CPF/CNPJ</Label>
                    <Input value={form.document} onChange={(e) => setForm({ ...form, document: formatDocument(e.target.value) })} placeholder="000.000.000-00" />
                  </div>
                </div>
                <div>
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@exemplo.com" />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Detalhes adicionais..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button variant="hero" onClick={() => createMut.mutate()} disabled={!form.name.trim() || createMut.isPending}>
                  {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cadastrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
}
