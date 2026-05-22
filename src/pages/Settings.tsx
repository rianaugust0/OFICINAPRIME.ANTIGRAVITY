import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2, Phone, MessageSquare, Users as UsersIcon, CreditCard,
  Upload, Plus, Check, Crown, Loader2, Sparkles,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type Plan = "essencial" | "profissional" | "premium";

type AutoMessage = { id: string; title: string; trigger: string; message: string; enabled: boolean };

const defaultMessages: AutoMessage[] = [
  { id: "veiculo_recebido", title: "Veículo recebido", trigger: "Ao abrir uma OS", message: "Olá {cliente}! Recebemos seu veículo {modelo} ({placa}). Em breve te enviamos o diagnóstico.", enabled: true },
  { id: "servico_pronto", title: "Serviço pronto", trigger: "Quando OS = pronto", message: "Oi {cliente}, seu {modelo} já está pronto para retirada! 🚗", enabled: true },
  { id: "lembrete_revisao", title: "Lembrete de revisão", trigger: "90 dias após entrega", message: "Olá {cliente}! Já se passaram 3 meses da última revisão do seu {modelo}. Que tal agendar um check-up?", enabled: false },
];

const plans: { id: Plan; name: string; price: number; description: string; features: string[] }[] = [
  { id: "essencial", name: "Essencial", price: 97, description: "Para oficinas começando", features: ["Até 100 OS/mês", "1 usuário", "Suporte por e-mail"] },
  { id: "profissional", name: "Profissional", price: 197, description: "Para oficinas em crescimento", features: ["OS ilimitadas", "Até 5 usuários", "Agenda completa", "Relatórios financeiros"] },
  { id: "premium", name: "Premium", price: 397, description: "Para grandes operações", features: ["Tudo do Profissional", "Usuários ilimitados", "API & integrações", "Gerente de conta"] },
];

export default function Settings() {
  const { workshopId, workshop, refreshWorkshop } = useAuth();
  const qc = useQueryClient();
  const isOwner = workshop?.role === "dono";

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [messages, setMessages] = useState<AutoMessage[]>(defaultMessages);

  // Load workshop data
  const { data: ws, isLoading } = useQuery({
    queryKey: ["workshop-settings", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data, error } = await supabase.from("workshops").select("*").eq("id", workshopId!).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (ws) {
      setName(ws.name ?? "");
      setWhatsapp(ws.whatsapp ?? "");
      setEmail(ws.email ?? "");
      setAddress(ws.address ?? "");
      setLogoUrl(ws.logo_url ?? null);
    }
  }, [ws]);

  // Auto-messages persist per workshop in localStorage
  useEffect(() => {
    if (!workshopId) return;
    const raw = localStorage.getItem(`auto-msgs:${workshopId}`);
    if (raw) {
      try { setMessages(JSON.parse(raw)); } catch { /* noop */ }
    }
  }, [workshopId]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("workshops").update({
        name: name.trim(),
        whatsapp: whatsapp || null,
        email: email || null,
        address: address || null,
      }).eq("id", workshopId!);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Configurações salvas!");
      await refreshWorkshop();
      qc.invalidateQueries({ queryKey: ["workshop-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !workshopId) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Logo deve ter até 2MB"); return; }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `${workshopId}/logo-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("workshop-logos").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("workshop-logos").getPublicUrl(path);
      const { error: dbErr } = await supabase.from("workshops").update({ logo_url: data.publicUrl }).eq("id", workshopId);
      if (dbErr) throw dbErr;
      setLogoUrl(data.publicUrl);
      await refreshWorkshop();
      toast.success("Logo atualizada!");
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao enviar logo");
    } finally {
      setUploading(false);
    }
  };

  const persistMessages = (next: AutoMessage[]) => {
    setMessages(next);
    if (workshopId) localStorage.setItem(`auto-msgs:${workshopId}`, JSON.stringify(next));
  };

  const updatePlanMut = useMutation({
    mutationFn: async (plan: Plan) => {
      const { error } = await supabase.from("workshops").update({ plan }).eq("id", workshopId!);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Plano atualizado!");
      await refreshWorkshop();
      qc.invalidateQueries({ queryKey: ["workshop-settings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const currentPlan = (ws?.plan ?? "essencial") as Plan;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-6 backdrop-blur">
            <SidebarTrigger />
            <div className="flex flex-1 items-center justify-between">
              <div>
                <h1 className="font-display text-xl font-bold tracking-tight">Configurações</h1>
                <p className="text-xs text-muted-foreground">Personalize sua oficina</p>
              </div>
              <Button onClick={() => saveMut.mutate()} variant="hero" disabled={!isOwner || saveMut.isPending || !name.trim()}>
                {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar alterações"}
              </Button>
            </div>
          </header>

          {isLoading ? (
            <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
          <div className="mx-auto max-w-6xl space-y-6 p-6">
            <Tabs defaultValue="workshop" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 lg:w-auto lg:inline-grid">
                <TabsTrigger value="workshop" className="gap-2"><Building2 className="h-4 w-4" /> Oficina</TabsTrigger>
                <TabsTrigger value="messages" className="gap-2"><MessageSquare className="h-4 w-4" /> Mensagens</TabsTrigger>
                <TabsTrigger value="users" className="gap-2"><UsersIcon className="h-4 w-4" /> Usuários</TabsTrigger>
                <TabsTrigger value="plan" className="gap-2"><CreditCard className="h-4 w-4" /> Plano</TabsTrigger>
              </TabsList>

              <TabsContent value="workshop" className="space-y-6">
                <Card className="p-6">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-semibold">Identidade da oficina</h2>
                      <p className="text-sm text-muted-foreground">Esses dados aparecem para seus clientes</p>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-[200px_1fr]">
                    <div className="space-y-2">
                      <Label>Logo</Label>
                      <label className={cn(
                        "group flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/30 transition hover:border-primary hover:bg-primary/5",
                        !isOwner && "cursor-not-allowed opacity-60"
                      )}>
                        {uploading ? (
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        ) : logoUrl ? (
                          <img src={logoUrl} alt="Logo" className="h-full w-full rounded-xl object-cover" />
                        ) : (
                          <>
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm group-hover:bg-primary group-hover:text-primary-foreground transition">
                              <Upload className="h-5 w-5" />
                            </div>
                            <span className="mt-2 px-2 text-center text-xs text-muted-foreground">PNG, JPG até 2MB</span>
                          </>
                        )}
                        <input type="file" accept="image/*" className="hidden" onChange={handleLogo} disabled={!isOwner || uploading} />
                      </label>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Nome da oficina *</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} disabled={!isOwner} />
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="whats" className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> WhatsApp</Label>
                          <Input id="whats" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="(11) 99999-9999" maxLength={20} disabled={!isOwner} />
                          <p className="text-xs text-muted-foreground">Usado nas mensagens automáticas</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">E-mail</Label>
                          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={!isOwner} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="addr">Endereço</Label>
                        <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} disabled={!isOwner} />
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="messages" className="space-y-4">
                <Card className="p-6">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-display text-lg font-semibold">Mensagens automáticas</h2>
                        <p className="text-sm text-muted-foreground">Templates que aparecem nos botões de WhatsApp</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <div key={msg.id} className={cn("rounded-xl border border-border bg-background p-4 transition", msg.enabled && "border-primary/30 shadow-sm")}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{msg.title}</h3>
                              <Badge variant="outline" className="text-[10px] font-normal">{msg.trigger}</Badge>
                            </div>
                            <Textarea
                              value={msg.message}
                              onChange={(e) => persistMessages(messages.map((m) => m.id === msg.id ? { ...m, message: e.target.value } : m))}
                              rows={2} maxLength={500} className="resize-none bg-muted/30 text-sm"
                            />
                          </div>
                          <Switch checked={msg.enabled} onCheckedChange={() => persistMessages(messages.map((m) => m.id === msg.id ? { ...m, enabled: !m.enabled } : m))} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
                    Variáveis disponíveis: <code className="rounded bg-background px-1">{"{cliente}"}</code>{" "}
                    <code className="rounded bg-background px-1">{"{modelo}"}</code>{" "}
                    <code className="rounded bg-background px-1">{"{placa}"}</code>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <Card className="p-6 text-center">
                  <UsersIcon className="mx-auto h-10 w-10 text-muted-foreground" />
                  <p className="mt-4 font-medium">Gerencie sua equipe</p>
                  <p className="mt-1 text-sm text-muted-foreground">Convide mecânicos e atendentes na página dedicada</p>
                  <Link to="/equipe"><Button variant="hero" className="mt-4 gap-2"><Plus className="h-4 w-4" /> Abrir página da equipe</Button></Link>
                </Card>
              </TabsContent>

              <TabsContent value="plan" className="space-y-6">
                <Card className="overflow-hidden">
                  <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                          <Crown className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Plano atual</p>
                          <h2 className="font-display text-2xl font-bold capitalize">{currentPlan}</h2>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold">
                          R$ {plans.find(p => p.id === currentPlan)?.price ?? 97}
                          <span className="text-sm font-normal text-muted-foreground">/mês</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <p className="text-sm text-muted-foreground">Cobrança simulada — pagamentos serão integrados em breve.</p>
                  </div>
                </Card>

                <div>
                  <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Outros planos</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    {plans.map((plan) => {
                      const isCurrent = plan.id === currentPlan;
                      return (
                        <Card key={plan.id} className={cn("relative flex flex-col p-6 transition", isCurrent ? "border-primary shadow-lg ring-1 ring-primary/30" : "hover:border-primary/40 hover:shadow-md")}>
                          {isCurrent && <Badge className="absolute -top-2 right-4 bg-primary text-primary-foreground">Atual</Badge>}
                          <h4 className="font-display text-lg font-bold">{plan.name}</h4>
                          <p className="text-xs text-muted-foreground">{plan.description}</p>
                          <p className="my-4 text-3xl font-bold">R$ {plan.price}<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                          <ul className="mb-6 flex-1 space-y-2 text-sm">
                            {plan.features.map((f) => (
                              <li key={f} className="flex items-start gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{f}</span></li>
                            ))}
                          </ul>
                          <Button variant={isCurrent ? "outline" : "hero"} disabled={isCurrent || !isOwner || updatePlanMut.isPending} className="w-full"
                            onClick={() => updatePlanMut.mutate(plan.id)}>
                            {isCurrent ? "Plano atual" : "Mudar para este"}
                          </Button>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
