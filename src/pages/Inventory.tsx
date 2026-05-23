import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Package, Plus, Search, MoreHorizontal, Pencil, Trash2, ArrowUpRight, ArrowDownRight, PackageOpen } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const formatBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Inventory() {
  const { workshopId } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "", brand: "", category: "", sku: "", 
    cost_price: "0", sale_price: "0", 
    current_stock: "0", min_stock: "0", supplier_name: ""
  });

  const { data: inventory, isLoading, error } = useQuery({
    queryKey: ["inventory", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("workshop_id", workshopId!)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const upsertMut = useMutation({
    mutationFn: async () => {
      const payload: any = {
        workshop_id: workshopId!,
        name: form.name,
        brand: form.brand || null,
        category: form.category || null,
        sku: form.sku || null,
        cost_price: Number(form.cost_price),
        sale_price: Number(form.sale_price),
        current_stock: Number(form.current_stock),
        min_stock: Number(form.min_stock),
        supplier_name: form.supplier_name || null,
      };

      if (!editingId) {
        const { error } = await supabase.from("inventory").insert(payload);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("inventory").update(payload).eq("id", editingId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Peça atualizada!" : "Peça adicionada ao estoque!");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("inventory").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Peça removida do estoque.");
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [stockOpen, setStockOpen] = useState(false);
  const [stockForm, setStockForm] = useState({ id: "", quantity: "1", type: "add" });

  const stockMut = useMutation({
    mutationFn: async () => {
      const item = inventory?.find(i => i.id === stockForm.id);
      if (!item) throw new Error("Item não encontrado");
      
      const qty = Number(stockForm.quantity);
      const newStock = stockForm.type === "add" ? item.current_stock + qty : item.current_stock - qty;
      
      const { error } = await supabase.from("inventory").update({ current_stock: newStock }).eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Estoque atualizado com sucesso!");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      setStockOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openNew = () => {
    setEditingId(null);
    setForm({ name: "", brand: "", category: "", sku: "", cost_price: "", sale_price: "", current_stock: "1", min_stock: "0", supplier_name: "" });
    setOpen(true);
  };

  const openEdit = (i: any) => {
    setEditingId(i.id);
    setForm({ 
      name: i.name, brand: i.brand || "", category: i.category || "", sku: i.sku || "", 
      cost_price: String(i.cost_price), sale_price: String(i.sale_price), 
      current_stock: String(i.current_stock), min_stock: String(i.min_stock), supplier_name: i.supplier_name || "" 
    });
    setOpen(true);
  };

  const openStock = (i: any, type: "add"|"remove") => {
    setStockForm({ id: i.id, quantity: "1", type });
    setStockOpen(true);
  };

  const filtered = inventory?.filter((i: any) => i.name.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-slate-50 font-sans">
        <AppSidebar />
        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="h-16 px-6 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 shadow-sm z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-800">Controle de Estoque</h1>
                  <p className="text-xs text-slate-500 font-medium">Gerencie peças e produtos</p>
                </div>
              </div>
            </div>
            
            <Button onClick={() => openNew()} variant="hero" className="shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Adicionar Item
            </Button>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex justify-between items-center shrink-0">
              <div className="relative w-full sm:w-80">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Buscar por peça, marca ou SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-background" />
              </div>
            </div>

            {error ? (
              <Card className="p-6 text-center text-destructive border-destructive/20 bg-destructive/10">
                <p className="font-semibold">Erro ao carregar estoque.</p>
                <p className="text-sm mt-2 opacity-80">{error.message}</p>
              </Card>
            ) : isLoading ? (
              <div className="space-y-4 pt-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : !inventory || inventory.length === 0 ? (
              <Card className="flex flex-col items-center justify-center border-dashed border-border/60 px-6 py-16 text-center shadow-sm bg-background flex-1">
                <PackageOpen className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 font-semibold text-lg">Seu estoque está vazio</p>
                <p className="mt-1 text-sm text-muted-foreground">Cadastre as peças para começar a gerenciar.</p>
                <Button variant="outline" className="mt-6" onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Cadastrar Primeira Peça</Button>
              </Card>
            ) : (
              <div className="bg-background border border-border/50 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 border-b border-border/50">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Produto</th>
                        <th className="px-4 py-3 font-semibold">SKU / Cód</th>
                        <th className="px-4 py-3 font-semibold">Marca</th>
                        <th className="px-4 py-3 font-semibold text-right">Custo</th>
                        <th className="px-4 py-3 font-semibold text-right">Venda</th>
                        <th className="px-4 py-3 font-semibold text-center">Em Estoque</th>
                        <th className="px-4 py-3 font-semibold text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filtered.map(i => (
                        <tr key={i.id} className="hover:bg-secondary/20 transition-colors group">
                          <td className="px-4 py-3 font-medium text-foreground">{i.name}</td>
                          <td className="px-4 py-3 text-muted-foreground">{i.sku || '-'}</td>
                          <td className="px-4 py-3 text-muted-foreground">{i.brand || '-'}</td>
                          <td className="px-4 py-3 text-right">{formatBRL(Number(i.cost_price))}</td>
                          <td className="px-4 py-3 text-right font-medium text-primary">{formatBRL(Number(i.sale_price))}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${i.current_stock <= i.min_stock ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                              {i.current_stock}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openStock(i, "add")} className="cursor-pointer"><ArrowUpRight className="h-4 w-4 mr-2 text-emerald-500" /> Dar Entrada (+)</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openStock(i, "remove")} className="cursor-pointer"><ArrowDownRight className="h-4 w-4 mr-2 text-red-500" /> Dar Baixa (-)</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEdit(i)} className="cursor-pointer"><Pencil className="h-4 w-4 mr-2" /> Editar Peça</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={() => { if (confirm("Excluir esta peça do estoque?")) delMut.mutate(i.id); }}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                     <div className="p-8 text-center text-muted-foreground">Nenhuma peça encontrada na busca.</div>
                  )}
                </div>
              </div>
            )}
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Peça" : "Cadastrar Nova Peça"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="col-span-2 space-y-2">
              <Label>Nome da Peça *</Label>
              <Input placeholder="Ex: Filtro de Óleo" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Marca</Label>
              <Input placeholder="Ex: Bosch" value={form.brand} onChange={(e) => setForm({...form, brand: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>SKU / Código</Label>
              <Input placeholder="Ex: FLT-001" value={form.sku} onChange={(e) => setForm({...form, sku: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Preço de Custo (R$)</Label>
              <Input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({...form, cost_price: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Preço de Venda (R$) *</Label>
              <Input type="number" step="0.01" value={form.sale_price} onChange={(e) => setForm({...form, sale_price: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Estoque Atual</Label>
              <Input type="number" disabled={!!editingId} value={form.current_stock} onChange={(e) => setForm({...form, current_stock: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Estoque Mínimo (Alerta)</Label>
              <Input type="number" value={form.min_stock} onChange={(e) => setForm({...form, min_stock: e.target.value})} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Fornecedor (Opcional)</Label>
              <Input placeholder="Nome do fornecedor" value={form.supplier_name} onChange={(e) => setForm({...form, supplier_name: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={() => upsertMut.mutate()} disabled={!form.name || !form.sale_price}>
              {editingId ? "Salvar" : "Cadastrar Peça"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={stockOpen} onOpenChange={setStockOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{stockForm.type === "add" ? "Dar Entrada de Estoque" : "Dar Baixa no Estoque"}</DialogTitle>
          </DialogHeader>
          <div className="py-6 space-y-4 text-center">
            <p className="text-sm text-muted-foreground">Quantas unidades você deseja {stockForm.type === "add" ? "adicionar" : "remover"}?</p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" size="icon" onClick={() => setStockForm({...stockForm, quantity: String(Math.max(1, Number(stockForm.quantity) - 1))})}>-</Button>
              <Input type="number" min="1" className="w-20 text-center font-bold text-lg" value={stockForm.quantity} onChange={(e) => setStockForm({...stockForm, quantity: e.target.value})} />
              <Button variant="outline" size="icon" onClick={() => setStockForm({...stockForm, quantity: String(Number(stockForm.quantity) + 1)})}>+</Button>
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button variant="hero" className="w-full" onClick={() => stockMut.mutate()}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </main>
      </div>
    </SidebarProvider>
  );
}
