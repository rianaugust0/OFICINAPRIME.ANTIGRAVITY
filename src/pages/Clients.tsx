import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Search, Phone, MoreHorizontal, MessageCircle, Loader2, Trash2, Edit2, Car } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { openWhatsApp } from "@/lib/whatsapp";
import { formatPhone, formatDocument } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/ImageUpload";

interface ClientRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  document: string | null;
  notes: string | null;
  photo_url: string | null;
  last_service_at: string | null;
  vehicles: { count: number }[];
  orders: { amount: number; paid: boolean }[];
}

const formatBRL = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
}

export default function Clients() {
  const { workshopId } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", document: "", notes: "", photo_url: "" as string | null });

  const { data, isLoading } = useQuery({
    queryKey: ["clients", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, phone, email, document, notes, photo_url, last_service_at, vehicles(count), orders(amount, paid)")
        .eq("workshop_id", workshopId!)
        .order("name");
      if (error) throw error;
      return data as unknown as ClientRow[];
    },
  });

  const upsertMut = useMutation({
    mutationFn: async () => {
      const payload = {
        workshop_id: workshopId!,
        name: form.name.trim(),
        phone: form.phone || null,
        email: form.email || null,
        document: form.document || null,
        notes: form.notes || null,
        photo_url: form.photo_url || null,
      };
      
      if (editingId) {
        const { error } = await supabase.from("clients").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("clients").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Cliente atualizado!" : "Cliente cadastrado!");
      qc.invalidateQueries({ queryKey: ["clients"] });
      setOpen(false);
      setEditingId(null);
      setForm({ name: "", phone: "", email: "", document: "", notes: "", photo_url: null });
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

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      document: c.document || "",
      notes: c.notes || "",
      photo_url: c.photo_url || null,
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ name: "", phone: "", email: "", document: "", notes: "", photo_url: null });
    setOpen(true);
  };

  const filtered = (data ?? []).filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? "").includes(search),
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-secondary/30">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex flex-1 items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h1 className="font-display text-lg font-semibold tracking-tight">Clientes</h1>
              </div>
              <Button variant="hero" size="sm" className="gap-2" onClick={openNew}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Cliente</span>
              </Button>
            </div>
          </header>

          <div className="space-y-6 p-4 md:p-8 flex-1 overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Base de Clientes</h2>
                <p className="text-sm text-muted-foreground">Gerencie todos os clientes da sua oficina.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Buscar cliente..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="pl-10 bg-background" 
                />
              </div>
            </div>

            <Card className="border-border/60 shadow-sm overflow-hidden bg-background">
              {isLoading ? (
                <div className="p-8 space-y-4">
                  {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <Users className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Nenhum cliente encontrado</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    {search ? "Tente buscar com outros termos." : "Sua base de clientes está vazia. Cadastre o primeiro cliente para começar."}
                  </p>
                  {!search && (
                    <Button onClick={openNew} variant="outline" className="mt-6 gap-2">
                      <Plus className="h-4 w-4" /> Cadastrar Cliente
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-secondary/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[300px]">Cliente</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead className="text-center">Veículos</TableHead>
                        <TableHead>Última Visita</TableHead>
                        <TableHead className="text-right">Total Gasto</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((c) => {
                        const spent = (c.orders || []).filter(o => o.paid).reduce((s, o) => s + Number(o.amount || 0), 0);
                        const vehiclesCount = c.vehicles?.[0]?.count ?? 0;
                        
                        return (
                          <TableRow key={c.id} className="group hover:bg-secondary/40">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {c.photo_url ? (
                                  <img src={c.photo_url} alt="Cliente" className="h-12 w-12 rounded-full object-cover border border-border/50" />
                                ) : (
                                  <Avatar className="h-12 w-12 border border-border/50">
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                      {getInitials(c.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div className="flex flex-col">
                                  <span className="font-semibold text-sm">{c.name}</span>
                                  {c.email && <span className="text-xs text-muted-foreground">{c.email}</span>}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {c.phone ? (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-sm">{c.phone}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="inline-flex items-center justify-center gap-1.5 bg-secondary px-2.5 py-0.5 rounded-full text-xs font-medium">
                                <Car className="h-3 w-3 text-muted-foreground" /> {vehiclesCount}
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {c.last_service_at ? format(new Date(c.last_service_at), "dd/MM/yyyy", { locale: ptBR }) : "Nunca"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-semibold tabular-nums text-sm">
                                {formatBRL(spent)}
                              </span>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  {c.phone && (
                                    <DropdownMenuItem onClick={() => openWhatsApp(c.phone!, `Olá ${c.name}!`)}>
                                      <MessageCircle className="h-4 w-4 mr-2 text-green-500" /> WhatsApp
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(c)}>
                                    <Edit2 className="h-4 w-4 mr-2" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { if (confirm("Excluir cliente e todo o seu histórico?")) delMut.mutate(c.id); }}>
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

          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditingId(null); }}>
            <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2 flex flex-col items-center justify-center mb-4">
                  <ImageUpload 
                    bucket="workshop_media" 
                    folder="clients"
                    value={form.photo_url} 
                    onChange={(url) => setForm({ ...form, photo_url: url })}
                    className="w-24 h-24 rounded-full"
                  />
                  <span className="text-xs text-muted-foreground">Foto do Perfil (Opcional)</span>
                </div>
                <div className="space-y-2">
                  <Label>Nome Completo *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="João da Silva" className="bg-secondary/20" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefone (WhatsApp)</Label>
                    <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })} placeholder="(11) 99999-0000" className="bg-secondary/20" />
                  </div>
                  <div className="space-y-2">
                    <Label>CPF / CNPJ</Label>
                    <Input value={form.document} onChange={(e) => setForm({ ...form, document: formatDocument(e.target.value) })} placeholder="000.000.000-00" className="bg-secondary/20" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="joao@exemplo.com" className="bg-secondary/20" />
                </div>
                <div className="space-y-2">
                  <Label>Observações Internas</Label>
                  <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Cliente VIP, prefere contato por WhatsApp..." className="bg-secondary/20 resize-none" />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button variant="hero" onClick={() => upsertMut.mutate()} disabled={!form.name.trim() || upsertMut.isPending} className="px-8">
                  {upsertMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? "Salvar Alterações" : "Salvar Cliente")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
}
