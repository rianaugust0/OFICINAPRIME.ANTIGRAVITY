import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Truck, Plus, Search, Phone, MoreHorizontal, Edit2, Trash2, Mail, MapPin } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Suppliers() {
  const { workshopId } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  
  const [form, setForm] = useState({
    name: "",
    document: "",
    phone: "",
    email: "",
    notes: "", // used for category/city here as simple text
  });

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("workshop_id", workshopId!)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("suppliers").insert({
        workshop_id: workshopId!,
        name: form.name.trim(),
        document: form.document || null,
        phone: form.phone || null,
        email: form.email || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Fornecedor cadastrado!");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      setOpen(false);
      setForm({ name: "", document: "", phone: "", email: "", notes: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Fornecedor excluído.");
      qc.invalidateQueries({ queryKey: ["suppliers"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const filtered = suppliers.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase())
  );

  function getInitials(name: string) {
    if (!name) return "F";
    return name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-secondary/30">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex flex-1 items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                <h1 className="font-display text-lg font-semibold tracking-tight">Fornecedores</h1>
              </div>
              <Button variant="hero" size="sm" className="gap-2" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Novo Fornecedor</span>
              </Button>
            </div>
          </header>

          <div className="space-y-6 p-4 md:p-8 flex-1 overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Rede de Fornecedores</h2>
                <p className="text-sm text-muted-foreground">Gerencie distribuidores e parceiros de peças.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Buscar fornecedor..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                  className="pl-10 bg-background" 
                />
              </div>
            </div>

            <Card className="border-border/60 shadow-sm overflow-hidden bg-background min-h-[400px]">
              {isLoading ? (
                 <div className="flex justify-center p-12">Carregando fornecedores...</div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                    <Truck className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Nenhum fornecedor encontrado</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    Cadastre novos fornecedores para gerenciar compras e orçamentos de peças.
                  </p>
                  <Button onClick={() => setOpen(true)} variant="outline" className="mt-6 gap-2">
                    <Plus className="h-4 w-4" /> Cadastrar
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-secondary/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[300px]">Empresa</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Info / Notas</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((s) => (
                        <TableRow key={s.id} className="group hover:bg-secondary/40">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border border-border/50">
                                <AvatarFallback className="bg-primary/10 text-primary font-medium text-xs">
                                  {getInitials(s.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm">{s.name}</span>
                                <span className="text-xs text-muted-foreground font-mono mt-0.5">{s.document || "-"}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1 text-sm">
                              <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-muted-foreground" /> {s.phone || "-"}</span>
                              <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-muted-foreground" /> {s.email || "-"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              {s.notes || "-"}
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
                                <DropdownMenuItem>
                                  <Edit2 className="h-4 w-4 mr-2" /> Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { if(confirm("Excluir fornecedor?")) delMut.mutate(s.id); }}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md w-full">
              <DialogHeader>
                <DialogTitle>Novo Fornecedor</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nome da Empresa / Fantasia *</Label>
                  <Input 
                    placeholder="Auto Peças..." 
                    className="bg-secondary/20"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input 
                    placeholder="00.000.000/0000-00" 
                    className="bg-secondary/20"
                    value={form.document}
                    onChange={(e) => setForm({...form, document: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefone / WhatsApp</Label>
                    <Input 
                      placeholder="(00) 0000-0000" 
                      className="bg-secondary/20"
                      value={form.phone}
                      onChange={(e) => setForm({...form, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>E-mail</Label>
                    <Input 
                      placeholder="contato@empresa.com" 
                      className="bg-secondary/20"
                      value={form.email}
                      onChange={(e) => setForm({...form, email: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notas (Categoria/Local)</Label>
                  <Input 
                    placeholder="Ex: Peças Originais - São Paulo" 
                    className="bg-secondary/20"
                    value={form.notes}
                    onChange={(e) => setForm({...form, notes: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button variant="hero" onClick={() => createMut.mutate()} disabled={!form.name || createMut.isPending} className="px-8">
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
}
