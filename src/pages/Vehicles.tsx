import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Car, Plus, Search, Loader2, Trash2, User, DollarSign, MoreHorizontal, Edit2, Check, ChevronsUpDown } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPlate } from "@/lib/formatters";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/ImageUpload";

interface VehicleRow {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  plate: string | null;
  color: string | null;
  mileage: number | null;
  photo_url: string | null;
  client_id: string;
  clients: { name: string } | null;
  orders: { amount: number; paid: boolean }[];
}

const formatBRL = (n: number) => Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Vehicles() {
  const { workshopId } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ client_id: "", brand: "", model: "", year: "", plate: "", color: "", mileage: "", photo_url: "" as string | null });

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, brand, model, year, plate, color, mileage, photo_url, client_id, clients(name), orders(amount, paid)")
        .eq("workshop_id", workshopId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as VehicleRow[];
    },
  });

  const { data: clients } = useQuery({
    queryKey: ["clients-min", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").eq("workshop_id", workshopId!).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { brands, models } = useMemo(() => {
    const b = new Set<string>();
    const m = new Set<string>();
    vehicles?.forEach(v => {
      if (v.brand) b.add(v.brand);
      if (v.model) m.add(v.model);
    });
    return { brands: Array.from(b).sort(), models: Array.from(m).sort() };
  }, [vehicles]);

  const upsertMut = useMutation({
    mutationFn: async () => {
      const payload = {
        workshop_id: workshopId!,
        client_id: form.client_id,
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: form.year ? Number(form.year) : null,
        plate: form.plate || null,
        color: form.color || null,
        mileage: form.mileage ? Number(form.mileage) : null,
        photo_url: form.photo_url || null,
      };

      if (editingId) {
        const { error } = await supabase.from("vehicles").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("vehicles").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? "Veículo atualizado!" : "Veículo cadastrado!");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      setOpen(false);
      setEditingId(null);
      setForm({ client_id: "", brand: "", model: "", year: "", plate: "", color: "", mileage: "", photo_url: null });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      toast.success("Veículo excluído.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openEdit = (v: any) => {
    setEditingId(v.id);
    setForm({
      client_id: v.client_id,
      brand: v.brand || "",
      model: v.model || "",
      year: v.year ? String(v.year) : "",
      plate: v.plate || "",
      color: v.color || "",
      mileage: v.mileage ? String(v.mileage) : "",
      photo_url: v.photo_url || null,
    });
    setOpen(true);
  };

  const openNew = () => {
    setEditingId(null);
    setForm({ client_id: "", brand: "", model: "", year: "", plate: "", color: "", mileage: "", photo_url: null });
    setOpen(true);
  };

  const filtered = (vehicles ?? []).filter((v) => {
    const q = search.toLowerCase();
    return (
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      (v.plate ?? "").toLowerCase().includes(q) ||
      (v.clients?.name ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-secondary/30">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex flex-1 items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                <h1 className="font-display text-lg font-semibold tracking-tight">Veículos</h1>
              </div>
              <Button variant="hero" size="sm" className="gap-2" onClick={openNew} disabled={!clients?.length}>
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Cadastrar Veículo</span>
              </Button>
            </div>
          </header>

          <div className="space-y-6 p-4 md:p-8 flex-1 overflow-y-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Frota de Clientes</h2>
                <p className="text-sm text-muted-foreground">Gerencie os veículos atendidos na oficina.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Buscar veículo ou cliente..." 
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
                    <Car className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Nenhum veículo encontrado</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                    {search ? "Tente buscar com outros termos." : clients?.length ? "Cadastre o primeiro veículo de um cliente." : "Cadastre um cliente antes de adicionar um veículo."}
                  </p>
                  {!search && (
                    <Button onClick={openNew} variant="outline" className="mt-6 gap-2" disabled={!clients?.length}>
                      <Plus className="h-4 w-4" /> Cadastrar Veículo
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-secondary/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-[300px]">Veículo</TableHead>
                        <TableHead>Placa</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-center">KM Registrada</TableHead>
                        <TableHead className="text-right">Receita Gerada</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((v) => {
                        const spent = (v.orders || []).filter(o => o.paid).reduce((s, o) => s + Number(o.amount || 0), 0);
                        
                        return (
                          <TableRow key={v.id} className="group hover:bg-secondary/40">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {v.photo_url ? (
                                  <img src={v.photo_url} alt="Veículo" className="h-12 w-12 rounded-full object-cover border border-border" />
                                ) : (
                                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center border border-border">
                                    <Car className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="font-semibold text-sm">{v.brand} {v.model}</span>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                    {v.year && <span>{v.year}</span>}
                                    {v.year && v.color && <span>•</span>}
                                    {v.color && <span>{v.color}</span>}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {v.plate ? (
                                <span className="inline-block rounded border border-border bg-muted/50 px-2.5 py-1 font-mono text-xs tracking-widest font-semibold">
                                  {v.plate}
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm font-medium">{v.clients?.name ?? "—"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="text-sm">
                                {v.mileage ? `${v.mileage.toLocaleString("pt-BR")} km` : "—"}
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
                                  <DropdownMenuItem className="cursor-pointer" onClick={() => openEdit(v)}>
                                    <Edit2 className="h-4 w-4 mr-2" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { if (confirm("Excluir veículo?")) delMut.mutate(v.id); }}>
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
            <DialogContent className="max-w-md w-full">
              <DialogHeader><DialogTitle>{editingId ? "Editar Veículo" : "Cadastrar Veículo"}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Cliente Proprietário *</Label>
                  <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                    <SelectTrigger className="bg-secondary/20"><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                    <SelectContent>
                      {clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Foto do Veículo (Opcional)</Label>
                  <ImageUpload 
                    bucket="workshop_media" 
                    folder="vehicles"
                    value={form.photo_url} 
                    onChange={(url) => setForm({ ...form, photo_url: url })}
                    className="w-full h-32"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Marca *</Label>
                    <Input list="brands" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Ex: Honda" className="bg-secondary/20" />
                    <datalist id="brands">
                      {brands.map(b => <option key={b} value={b} />)}
                    </datalist>
                  </div>
                  <div className="space-y-2">
                    <Label>Modelo *</Label>
                    <Input list="models" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Ex: Civic" className="bg-secondary/20" />
                    <datalist id="models">
                      {models.map(m => <option key={m} value={m} />)}
                    </datalist>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2"><Label>Ano</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="bg-secondary/20" /></div>
                  <div className="space-y-2"><Label>Placa</Label><Input value={form.plate} onChange={(e) => setForm({ ...form, plate: formatPlate(e.target.value) })} placeholder="ABC-1D23" className="bg-secondary/20" /></div>
                  <div className="space-y-2"><Label>Cor</Label><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Preto" className="bg-secondary/20" /></div>
                </div>
                <div className="space-y-2">
                  <Label>Quilometragem Inicial (km)</Label>
                  <Input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} placeholder="50000" className="bg-secondary/20" />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button variant="hero" onClick={() => upsertMut.mutate()}
                  disabled={!form.client_id || !form.brand || !form.model || upsertMut.isPending} className="px-8">
                  {upsertMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? "Salvar Alterações" : "Salvar Veículo")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
}
