import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Loader2, Car, User, Phone, Calendar, DollarSign, FileText, X } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";

type Period = "7" | "30" | "month" | "year" | "all" | "custom";

function periodRange(p: Period, from?: string, to?: string): { gte?: string; lte?: string } {
  const now = new Date();
  if (p === "all") return {};
  if (p === "custom") return { gte: from || undefined, lte: to || undefined };
  if (p === "month") return { gte: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10) };
  if (p === "year") return { gte: new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10) };
  const days = Number(p);
  return { gte: new Date(now.getTime() - days * 86400000).toISOString().slice(0, 10) };
}

const statusLabels: Record<string, string> = {
  aguardando: "Aguardando",
  em_andamento: "Em andamento",
  pronto: "Pronto",
  entregue: "Entregue",
};

type Suggestion = {
  id: string;
  brand: string;
  model: string;
  plate: string | null;
  year: number | null;
  client_id: string;
  last_service_at: string | null;
  clients: { name: string; phone: string | null } | null;
};

export default function PlateHistory() {
  const { workshopId } = useAuth();
  const [query, setQuery] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const debounced = useDebounce(query.trim(), 300);
  const normalized = debounced.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const showSuggestions = normalized.length >= 2 && !selectedVehicleId;

  // Suggestions: lightweight, top 20, indexed lookup
  const { data: suggestions, isFetching: loadingSuggestions } = useQuery({
    queryKey: ["plate-suggestions", workshopId, normalized],
    enabled: !!workshopId && showSuggestions,
    staleTime: 30_000,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id, brand, model, plate, year, client_id, last_service_at:created_at, clients(name, phone)")
        .eq("workshop_id", workshopId!)
        .ilike("plate", `%${normalized}%`)
        .order("created_at", { ascending: false })
        .limit(20)
        .abortSignal(signal);
      if (error) throw error;
      // Compute last service from orders in a single follow-up query (only when we have ids)
      const ids = (data ?? []).map((v) => v.id);
      let lastByVehicle = new Map<string, string>();
      if (ids.length) {
        const { data: lastOrders } = await supabase
          .from("orders")
          .select("vehicle_id, entry_date")
          .eq("workshop_id", workshopId!)
          .in("vehicle_id", ids)
          .order("entry_date", { ascending: false })
          .abortSignal(signal);
        for (const o of lastOrders ?? []) {
          if (!lastByVehicle.has(o.vehicle_id)) lastByVehicle.set(o.vehicle_id, o.entry_date);
        }
      }
      return (data ?? []).map((v) => ({
        ...v,
        last_service_at: lastByVehicle.get(v.id) ?? null,
      })) as unknown as Suggestion[];
    },
  });

  // Full detail load when a vehicle is picked
  const { data: detail, isFetching: loadingDetail } = useQuery({
    queryKey: ["plate-detail", workshopId, selectedVehicleId, period, from, to],
    enabled: !!workshopId && !!selectedVehicleId,
    queryFn: async ({ signal }) => {
      const { data: vehicle, error: vErr } = await supabase
        .from("vehicles")
        .select("id, brand, model, plate, color, year, client_id, clients(id, name, phone, email)")
        .eq("workshop_id", workshopId!)
        .eq("id", selectedVehicleId!)
        .abortSignal(signal)
        .maybeSingle();
      if (vErr) throw vErr;
      if (!vehicle) return null;

      const range = periodRange(period, from, to);
      let q = supabase
        .from("orders")
        .select("id, number, entry_date, status, amount, paid, paid_at, reported_problem, service_done")
        .eq("workshop_id", workshopId!)
        .eq("vehicle_id", selectedVehicleId!)
        .order("entry_date", { ascending: false })
        .limit(100);
      if (range.gte) q = q.gte("entry_date", range.gte);
      if (range.lte) q = q.lte("entry_date", range.lte);
      const { data: orders, error: oErr } = await q.abortSignal(signal);
      if (oErr) throw oErr;
      return { vehicle, orders: orders ?? [] };
    },
  });

  const totals = useMemo(() => {
    const orders = detail?.orders ?? [];
    const total = orders.reduce((s, o) => s + Number(o.amount || 0), 0);
    const paid = orders.filter((o) => o.paid).reduce((s, o) => s + Number(o.amount || 0), 0);
    return { total, paid, count: orders.length };
  }, [detail]);

  const clearSelection = () => {
    setSelectedVehicleId(null);
    setQuery("");
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <h1 className="font-display text-lg font-semibold tracking-tight">Histórico por placa</h1>
            </div>
          </header>

          <div className="space-y-5 p-4 md:p-6">
            <Card className="p-5 space-y-4">
              <div className="grid gap-3 md:grid-cols-[1fr_200px]">
                <div className="relative">
                  <Label>Placa do veículo</Label>
                  <div className="relative mt-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      autoFocus
                      placeholder="Digite parte da placa (ex: ABC1)"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value.toUpperCase());
                        setSelectedVehicleId(null);
                      }}
                      className="pl-10 pr-10 font-mono tracking-widest uppercase"
                    />
                    {(loadingSuggestions || loadingDetail) && (
                      <Loader2 className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                    {query && !loadingSuggestions && !loadingDetail && (
                      <button
                        type="button"
                        onClick={clearSelection}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="Limpar"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Autocomplete dropdown */}
                  {showSuggestions && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-auto rounded-md border border-border bg-popover shadow-lg">
                      {loadingSuggestions ? (
                        <div className="flex items-center justify-center p-6 text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : !suggestions?.length ? (
                        <p className="p-4 text-center text-sm text-muted-foreground">Nenhum veículo encontrado.</p>
                      ) : (
                        <ul className="divide-y">
                          {suggestions.map((s) => (
                            <li key={s.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedVehicleId(s.id);
                                  setQuery(s.plate ?? "");
                                }}
                                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-accent"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="rounded border border-border bg-background px-2 py-0.5 font-mono text-xs tracking-widest">
                                      {s.plate ?? "—"}
                                    </span>
                                    <span className="truncate text-sm font-medium">
                                      {s.brand} {s.model} {s.year ?? ""}
                                    </span>
                                  </div>
                                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                    {s.clients?.name ?? "Sem cliente"}
                                    {s.clients?.phone ? ` · ${s.clients.phone}` : ""}
                                  </p>
                                </div>
                                <span className="shrink-0 text-xs text-muted-foreground">
                                  {s.last_service_at
                                    ? `Última: ${new Date(s.last_service_at).toLocaleDateString("pt-BR")}`
                                    : "Sem OS"}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <Label>Período</Label>
                  <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo o histórico</SelectItem>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="month">Mês atual</SelectItem>
                      <SelectItem value="year">Ano atual</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {period === "custom" && (
                <div className="grid gap-3 md:grid-cols-2">
                  <div><Label>De</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
                  <div><Label>Até</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
                </div>
              )}
            </Card>

            {!selectedVehicleId ? (
              <Card className="border-dashed p-12 text-center text-muted-foreground">
                Digite ao menos 2 caracteres da placa e selecione um veículo.
              </Card>
            ) : loadingDetail ? (
              <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : !detail ? (
              <Card className="border-dashed p-12 text-center text-muted-foreground">
                Veículo não encontrado.
              </Card>
            ) : (
              <>
                <div className="flex justify-end">
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    <X className="mr-1 h-4 w-4" /> Nova busca
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <Card className="p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Visitas</p>
                    <p className="mt-1 font-display text-2xl font-bold">{totals.count}</p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Faturado</p>
                    <p className="mt-1 font-display text-2xl font-bold">
                      {totals.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Recebido</p>
                    <p className="mt-1 font-display text-2xl font-bold text-primary">
                      {totals.paid.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </Card>
                </div>

                {(() => {
                  const v = detail.vehicle;
                  const c = v.clients as { name?: string; phone?: string | null; email?: string | null } | null;
                  return (
                    <Card className="overflow-hidden">
                      <div className="border-b bg-muted/30 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                              <Car className="h-3.5 w-3.5" /> Veículo
                            </div>
                            <p className="mt-1 font-display text-lg font-bold">{v.brand} {v.model} {v.year ?? ""}</p>
                            {v.plate && <span className="mt-1 inline-block rounded border border-border bg-background px-2 py-1 font-mono text-xs tracking-widest">{v.plate}</span>}
                          </div>
                          <div className="text-right">
                            <div className="flex items-center justify-end gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                              <User className="h-3.5 w-3.5" /> Cliente
                            </div>
                            <p className="mt-1 font-medium">{c?.name ?? "—"}</p>
                            {c?.phone && (
                              <p className="flex items-center justify-end gap-1 text-sm text-muted-foreground">
                                <Phone className="h-3 w-3" /> {c.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {detail.orders.length === 0 ? (
                        <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma OS no período.</p>
                      ) : (
                        <div className="divide-y">
                          {detail.orders.map((o) => (
                            <div key={o.id} className="grid gap-3 p-5 md:grid-cols-[auto_1fr_auto]">
                              <div className="flex flex-col items-start gap-1">
                                <span className="font-mono text-xs text-muted-foreground">OS #{o.number}</span>
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(o.entry_date).toLocaleDateString("pt-BR")}
                                </span>
                                <Badge variant="outline">{statusLabels[o.status] ?? o.status}</Badge>
                              </div>
                              <div className="space-y-1 text-sm">
                                {o.reported_problem && (
                                  <p><span className="text-muted-foreground">Problema:</span> {o.reported_problem}</p>
                                )}
                                {o.service_done && (
                                  <p className="flex gap-1"><FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" /> {o.service_done}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-display text-lg font-bold flex items-center justify-end gap-1">
                                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                                  {Number(o.amount).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </p>
                                <Badge variant={o.paid ? "default" : "secondary"} className="mt-1">
                                  {o.paid ? "Pago" : "Em aberto"}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })()}
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
