import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Clock, Car, User, Plus, LogIn, LogOut, ClipboardCheck, Loader2, Trash2 } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type AppointmentType = "entrada" | "entrega" | "revisao";

interface AppointmentRow {
  id: string;
  scheduled_at: string;
  type: AppointmentType;
  service: string | null;
  notes: string | null;
  client_id: string | null;
  vehicle_id: string | null;
  clients: { name: string } | null;
  vehicles: { brand: string; model: string; plate: string | null } | null;
}

const typeConfig: Record<AppointmentType, { label: string; icon: typeof LogIn; dot: string; badge: string }> = {
  entrada: { label: "Entrada", icon: LogIn, dot: "bg-blue-500", badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" },
  entrega: { label: "Entrega", icon: LogOut, dot: "bg-primary", badge: "bg-primary/15 text-primary border-primary/30" },
  revisao: { label: "Revisão", icon: ClipboardCheck, dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
};

export default function Schedule() {
  const { workshopId } = useAuth();
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    client_id: "", vehicle_id: "", date: format(new Date(), "yyyy-MM-dd"),
    time: "09:00", type: "entrada" as AppointmentType, service: "", notes: "",
  });

  const { data: appointments, isLoading } = useQuery({
    queryKey: ["appointments", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*, clients(name), vehicles(brand, model, plate)")
        .eq("workshop_id", workshopId!)
        .order("scheduled_at");
      if (error) throw error;
      return data as unknown as AppointmentRow[];
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

  const createMut = useMutation({
    mutationFn: async () => {
      const scheduled = new Date(`${form.date}T${form.time}:00`).toISOString();
      const { error } = await supabase.from("appointments").insert({
        workshop_id: workshopId!,
        client_id: form.client_id || null,
        vehicle_id: form.vehicle_id || null,
        scheduled_at: scheduled,
        type: form.type,
        service: form.service || null,
        notes: form.notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Agendamento criado!");
      qc.invalidateQueries({ queryKey: ["appointments"] });
      setOpen(false);
      setForm({ ...form, client_id: "", vehicle_id: "", service: "", notes: "" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Agendamento removido.");
    },
  });

  const dayAppointments = useMemo(
    () => (appointments ?? []).filter((a) => isSameDay(new Date(a.scheduled_at), selectedDate)),
    [appointments, selectedDate],
  );

  const datesWithAppointments = useMemo(
    () => (appointments ?? []).map((a) => new Date(a.scheduled_at)),
    [appointments],
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex flex-1 items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                <h1 className="font-display text-lg font-semibold tracking-tight">Agenda</h1>
              </div>
              <Button variant="hero" size="sm" className="gap-2" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Novo Agendamento</span>
              </Button>
            </div>
          </header>

          <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[380px_1fr]">
            <Card className="overflow-hidden border-border/60 p-0 h-fit">
              <div className="border-b border-border/60 bg-muted/30 px-5 py-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Selecione um dia</p>
                <p className="mt-1 font-display text-base font-semibold capitalize">{format(selectedDate, "MMMM yyyy", { locale: ptBR })}</p>
              </div>
              <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} locale={ptBR}
                modifiers={{ hasAppointment: datesWithAppointments }}
                modifiersClassNames={{ hasAppointment: "relative after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary" }}
                className="p-3 pointer-events-auto w-full" />
            </Card>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{isSameDay(selectedDate, new Date()) ? "Hoje" : "Dia selecionado"}</p>
                <h2 className="font-display text-2xl font-bold capitalize tracking-tight">{format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</h2>
              </div>

              {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
              ) : dayAppointments.length === 0 ? (
                <Card className="flex flex-col items-center justify-center border-dashed border-border/60 px-6 py-16 text-center">
                  <CalendarIcon className="h-8 w-8 text-muted-foreground" />
                  <p className="mt-4 font-medium">Nenhum agendamento</p>
                  <Button onClick={() => setOpen(true)} variant="outline" size="sm" className="mt-5 gap-2"><Plus className="h-4 w-4" /> Criar agendamento</Button>
                </Card>
              ) : (
                <div className="space-y-3">
                  {dayAppointments.map((apt) => {
                    const cfg = typeConfig[apt.type];
                    const Icon = cfg.icon;
                    return (
                      <Card key={apt.id} className="group relative overflow-hidden border-border/60">
                        <div className={cn("absolute inset-y-0 left-0 w-1", cfg.dot)} />
                        <div className="flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-center">
                          <div className="flex shrink-0 items-center gap-2 sm:w-20 sm:flex-col sm:items-start sm:gap-0">
                            <Clock className="h-4 w-4 text-muted-foreground sm:hidden" />
                            <span className="font-display text-2xl font-bold leading-none">{format(new Date(apt.scheduled_at), "HH:mm")}</span>
                          </div>
                          <div className="hidden h-12 w-px bg-border sm:block" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant="outline" className={cn("gap-1 font-medium", cfg.badge)}>
                                <Icon className="h-3 w-3" /> {cfg.label}
                              </Badge>
                              {apt.service && <span className="text-sm font-medium">{apt.service}</span>}
                            </div>
                            <div className="mt-2 flex flex-col gap-1.5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
                              {apt.clients && <span className="flex items-center gap-1.5"><User className="h-3.5 w-3.5" /><span className="text-foreground">{apt.clients.name}</span></span>}
                              {apt.vehicles && <span className="flex items-center gap-1.5"><Car className="h-3.5 w-3.5" /> {apt.vehicles.brand} {apt.vehicles.model}</span>}
                              {apt.vehicles?.plate && <span className="rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-xs">{apt.vehicles.plate}</span>}
                            </div>
                          </div>
                          <button onClick={() => { if (confirm("Remover agendamento?")) delMut.mutate(apt.id); }}
                            className="rounded-md p-2 text-muted-foreground opacity-0 transition hover:text-destructive group-hover:opacity-100">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo agendamento</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Data *</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
                  <div><Label>Horário *</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as AppointmentType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="revisao">Revisão</SelectItem>
                      <SelectItem value="entrega">Entrega</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Cliente</Label>
                  <Select value={form.client_id} onValueChange={(v) => setForm({ ...form, client_id: v, vehicle_id: "" })}>
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>{clients?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {form.client_id && (
                  <div>
                    <Label>Veículo</Label>
                    <Select value={form.vehicle_id} onValueChange={(v) => setForm({ ...form, vehicle_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                      <SelectContent>{vehicles?.map((v) => <SelectItem key={v.id} value={v.id}>{v.brand} {v.model}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
                <div><Label>Serviço</Label><Input value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} placeholder="Ex.: Revisão 40.000 km" /></div>
                <div><Label>Observações</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button variant="hero" onClick={() => createMut.mutate()} disabled={createMut.isPending}>
                  {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agendar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
}
