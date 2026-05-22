import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Car, Plus, Search, Loader2, Trash2, User, DollarSign } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPlate } from "@/lib/formatters";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface VehicleRow {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  plate: string | null;
  color: string | null;
  mileage: number | null;
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
  const [form, setForm] = useState({ client_id: "", brand: "", model: "", year: "", plate: "", color: "", mileage: "" });

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, brand, model, year, plate, color, mileage, client_id, clients(name), orders(amount, paid)")
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

  // Unique list of brands/models for autocomplete
  const { brands, models } = useMemo(() => {
    const b = new Set<string>();
    const m = new Set<string>();
    vehicles?.forEach(v => {
      if (v.brand) b.add(v.brand);
      if (v.model) m.add(v.model);
    });
    return { brands: Array.from(b), models: Array.from(m) };
  }, [vehicles]);

  const createMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("vehicles").insert({
        workshop_id: workshopId!,
        client_id: form.client_id,
        brand: form.brand.trim(),
        model: form.model.trim(),
        year: form.year ? Number(form.year) : null,
        plate: form.plate || null,
        color: form.color || null,
        mileage: form.mileage ? Number(form.mileage) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Veículo cadastrado!");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      setOpen(false);
      setForm({ client_id: "", brand: "", model: "", year: "", plate: "", color: "", mileage: "" });
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
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex flex-1 items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                <h1 className="font-display text-lg font-semibold tracking-tight">Veículos</h1>
              </div>
              <Button variant="hero" size="sm" className="gap-2" onClick={() => setOpen(true)} disabled={!clients?.length}>
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Cadastrar veículo</span>
              </Button>
            </div>
          </header>

          <div className="space-y-4 p-4 md:p-6 flex-1 overflow-y-auto">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Buscar por placa, modelo ou cliente…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>

            {isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({length: 6}).map((_, i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
              </div>
            ) : filtered.length === 0 ? (
              <Card className="flex flex-col items-center justify-center border-dashed border-border/60 px-6 py-16 text-center shadow-sm">
                <Car className="h-8 w-8 text-muted-foreground" />
                <p className="mt-4 font-medium">Nenhum veículo</p>
                <p className="mt-1 text-sm text-muted-foreground">{clients?.length ? "Cadastre o primeiro veículo." : "Cadastre um cliente antes."}</p>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((v) => {
                  const spent = (v.orders || []).filter(o => o.paid).reduce((s, o) => s + Number(o.amount || 0), 0);
                  
                  return (
                    <Card key={v.id} className="group border-border/60 p-5 transition-all hover:border-primary/40 hover:shadow-md">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground">{v.brand}</p>
                          <p className="font-display text-lg font-bold">{v.model} {v.year && <span className="text-muted-foreground font-normal">{v.year}</span>}</p>
                        </div>
                        <button onClick={() => { if (confirm("Excluir veículo?")) delMut.mutate(v.id); }} className="text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      {v.plate && (
                        <span className="mt-2 inline-block rounded border border-border bg-muted px-2 py-1 font-mono text-xs tracking-widest">{v.plate}</span>
                      )}
                      
                      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/60 pt-4 text-xs">
                        <div className="col-span-2">
                          <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><User className="h-3.5 w-3.5" /> {v.clients?.name ?? "—"}</p>
                        </div>
                        {v.mileage != null && (
                          <div className="col-span-2 text-muted-foreground">
                            Quilometragem: <span className="text-foreground font-medium">{v.mileage.toLocaleString("pt-BR")} km</span>
                          </div>
                        )}
                        <div className="col-span-2 mt-2 bg-muted/50 p-2 rounded-md flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Total Gasto</span>
                          <span className="font-display font-bold text-foreground">{formatBRL(spent)}</span>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md w-full">
              <DialogHeader><DialogTitle>Cadastrar veículo</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>Cliente *</Label>
                  <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      {clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Marca *</Label>
                    <Input list="brands" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="Honda" />
                    <datalist id="brands">
                      {brands.map(b => <option key={b} value={b} />)}
                    </datalist>
                  </div>
                  <div>
                    <Label>Modelo *</Label>
                    <Input list="models" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} placeholder="Civic" />
                    <datalist id="models">
                      {models.map(m => <option key={m} value={m} />)}
                    </datalist>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Ano</Label><Input type="number" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} /></div>
                  <div><Label>Placa</Label><Input value={form.plate} onChange={(e) => setForm({ ...form, plate: formatPlate(e.target.value) })} placeholder="ABC-1D23" /></div>
                  <div><Label>Cor</Label><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
                </div>
                <div><Label>Quilometragem</Label><Input type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button variant="hero" onClick={() => createMut.mutate()}
                  disabled={!form.client_id || !form.brand || !form.model || createMut.isPending}>
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
