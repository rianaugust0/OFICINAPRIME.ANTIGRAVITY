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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Link, useSearchParams } from "react-router-dom";

type Plan = "essencial" | "profissional" | "premium";

type AutoMessage = { id: string; title: string; trigger: string; message: string; enabled: boolean };

const defaultMessages: AutoMessage[] = [
  { id: "veiculo_recebido", title: "Veículo recebido", trigger: "Ao abrir uma OS", message: "Olá {cliente}! Recebemos seu veículo {modelo} ({placa}). Em breve te enviamos o diagnóstico.", enabled: true },
  { id: "servico_pronto", title: "Serviço pronto", trigger: "Quando OS = pronto", message: "Oi {cliente}, seu {modelo} já está pronto para retirada! 🚗", enabled: true },
  { id: "lembrete_revisao", title: "Lembrete de revisão", trigger: "90 dias após entrega", message: "Olá {cliente}! Já se passaram 3 meses da última revisão do seu {modelo}. Que tal agendar um check-up?", enabled: false },
];

// Single lifetime plan hardcoded in UI

export default function Settings() {
  const { workshopId, workshop, refreshWorkshop } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "workshop";
  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    if (searchParams.get("tab")) {
      setActiveTab(searchParams.get("tab")!);
    }
  }, [searchParams]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setSearchParams({ tab: val });
  };
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
      const { error: upErr } = await supabase.storage.from("workshop-assets").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("workshop-assets").getPublicUrl(path);
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



  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-6 backdrop-blur">
            <SidebarTrigger />
            <div className="flex flex-1 items-center justify-between">
              <div className="mb-4">
                <h1 className="font-display text-2xl font-bold tracking-tight">Configurações</h1>
                <p className="text-sm text-muted-foreground">Gerencie as preferências da sua oficina e conta.</p>
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
            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
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
                <Card className="overflow-hidden relative border-primary/20 shadow-xl">
                  {/* Decorative background blur */}
                  <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-[80px] pointer-events-none" />
                  
                  <div className="bg-slate-900 p-8 sm:p-10 relative z-10 text-white overflow-hidden">
                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                      <div className="space-y-5">
                        <div className={cn("inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest border", 
                          ws?.plan === 'vitalicio' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-amber-500/20 text-amber-500 border-amber-500/30"
                        )}>
                          <Crown className="h-4 w-4" /> {ws?.plan === 'vitalicio' ? "Licença Ativa" : "Período de Teste"}
                        </div>
                        <div>
                          <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tight mb-3">Licença Única <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Prime</span></h2>
                          <p className="text-slate-300 max-w-lg text-lg leading-relaxed">
                            Você possui acesso vitalício e ilimitado ao melhor sistema de gestão para oficinas. Sem taxas ocultas, sem limites de cadastro.
                          </p>
                        </div>
                      </div>
                      
                      <div className="md:text-right shrink-0">
                        <div className="inline-block bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 text-center">
                          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Investimento Único</p>
                          <p className="text-5xl sm:text-6xl font-black text-white flex items-start justify-center md:justify-end gap-1">
                            <span className="text-2xl font-bold text-slate-400 mt-1">R$</span>150
                          </p>
                          {ws?.plan === 'vitalicio' ? (
                            <p className="text-emerald-400 text-sm font-semibold mt-3 flex items-center justify-center md:justify-end gap-1.5">
                              <Check className="h-4 w-4" /> Pago e Liberado
                            </p>
                          ) : (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="hero" className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90">
                                  Garantir Acesso Vitalício
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Pagamento via PIX</DialogTitle>
                                  <DialogDescription>
                                    Transfira o valor exato para a chave abaixo e envie o comprovante para liberação do sistema.
                                  </DialogDescription>
                                </DialogHeader>
                                
                                <div className="space-y-4 py-4">
                                  <div className="flex flex-col items-center justify-center space-y-3 bg-secondary/50 p-4 rounded-xl border border-border">
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-center">Valor: <span className="text-foreground font-black">R$ 150,00</span></p>
                                    <div className="bg-white p-2 rounded-xl shadow-sm">
                                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent("00020126330014BR.GOV.BCB.PIX0111703414381115204000053039865406150.005802BR5925Rian Augusto Alves da Sil6009SAO PAULO62140510hZKXEgwLe963048500")}`} alt="PIX QR Code" className="w-40 h-40" />
                                    </div>
                                    <p className="text-xs font-medium text-muted-foreground">Escaneie pelo app do banco</p>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label>Ou use o PIX Copia e Cola</Label>
                                    <div className="flex gap-2">
                                      <Input readOnly value="00020126330014BR.GOV.BCB.PIX0111703414381115204000053039865406150.005802BR5925Rian Augusto Alves da Sil6009SAO PAULO62140510hZKXEgwLe963048500" className="font-mono text-[10px] bg-secondary/30 text-muted-foreground" />
                                      <Button variant="outline" onClick={() => {
                                        navigator.clipboard.writeText("00020126330014BR.GOV.BCB.PIX0111703414381115204000053039865406150.005802BR5925Rian Augusto Alves da Sil6009SAO PAULO62140510hZKXEgwLe963048500");
                                        toast.success("Código PIX copiado!");
                                      }}>Copiar</Button>
                                    </div>
                                  </div>
                                  
                                  <div className="pt-4 space-y-3">
                                    <p className="text-xs text-muted-foreground text-center">
                                      Após o pagamento, clique no botão abaixo para enviar o comprovante no WhatsApp do suporte. Sua licença será ativada em poucos minutos.
                                    </p>
                                    <Button 
                                      className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 font-bold" 
                                      onClick={() => window.open('https://wa.me/5562985658094?text=Olá! Acabei de fazer o PIX da minha Licença Vitalícia da OficinaPrime. Segue o comprovante:', '_blank')}
                                    >
                                      Enviar Comprovante no WhatsApp
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-background p-8 sm:p-10 relative z-10 border-t border-border/50">
                    <h3 className="mb-6 font-display text-sm font-bold uppercase tracking-widest text-muted-foreground">Todos os benefícios liberados</h3>
                    <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"><Check className="h-3.5 w-3.5" /></div>
                        <p className="font-medium text-foreground">Ordens de Serviço <span className="font-bold text-emerald-600 dark:text-emerald-400">ilimitadas</span></p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"><Check className="h-3.5 w-3.5" /></div>
                        <p className="font-medium text-foreground">Gestão completa de Clientes e Veículos</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"><Check className="h-3.5 w-3.5" /></div>
                        <p className="font-medium text-foreground">Controle de Estoque Inteligente</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"><Check className="h-3.5 w-3.5" /></div>
                        <p className="font-medium text-foreground">Portal Central do Cliente VIP integrado</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"><Check className="h-3.5 w-3.5" /></div>
                        <p className="font-medium text-foreground">Usuários e mecânicos ilimitados na equipe</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500"><Check className="h-3.5 w-3.5" /></div>
                        <p className="font-medium text-foreground">Atualizações e novas funções sem custo adicional</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
