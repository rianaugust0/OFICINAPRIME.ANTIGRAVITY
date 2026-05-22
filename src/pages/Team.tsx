import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UsersRound, Plus, Loader2, Trash2, Mail, Copy, Check, Crown, Wrench as WrenchIcon, Headset,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Role = "dono" | "mecanico" | "atendente";

const roleConfig: Record<Role, { label: string; icon: typeof Crown; color: string }> = {
  dono: { label: "Dono", icon: Crown, color: "bg-primary/15 text-primary border-primary/30" },
  mecanico: { label: "Mecânico", icon: WrenchIcon, color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  atendente: { label: "Atendente", icon: Headset, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
};

export default function Team() {
  const { workshopId, workshop, user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("mecanico");
  const [lastLink, setLastLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const isOwner = workshop?.role === "dono";

  const { data: members, isLoading: loadingMembers } = useQuery({
    queryKey: ["workshop-members", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workshop_members")
        .select("id, role, user_id, created_at, profiles(full_name)")
        .eq("workshop_id", workshopId!)
        .order("created_at");
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: invites } = useQuery({
    queryKey: ["workshop-invites", workshopId],
    enabled: !!workshopId,
    queryFn: async () => {
      const { data } = await supabase
        .from("workshop_invites")
        .select("id, email, role, expires_at, accepted_at, token, created_at")
        .eq("workshop_id", workshopId!)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const inviteMut = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("send-invite", {
        body: { email, role },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      return data as { signupUrl: string; workshopName: string };
    },
    onSuccess: (data) => {
      toast.success("Convite criado!");
      setLastLink(data.signupUrl);
      setEmail("");
      qc.invalidateQueries({ queryKey: ["workshop-invites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workshop_invites").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Convite removido.");
      qc.invalidateQueries({ queryKey: ["workshop-invites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMemberMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workshop_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Membro removido.");
      qc.invalidateQueries({ queryKey: ["workshop-members"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const copyLink = async () => {
    if (!lastLink) return;
    await navigator.clipboard.writeText(lastLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1">
          <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex flex-1 items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-primary" />
                <h1 className="font-display text-lg font-semibold tracking-tight">Equipe</h1>
              </div>
              {isOwner && (
                <Button variant="hero" size="sm" className="gap-2" onClick={() => { setOpen(true); setLastLink(null); }}>
                  <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Convidar membro</span>
                </Button>
              )}
            </div>
          </header>

          <div className="space-y-6 p-4 md:p-6">
            <Card className="border-border/60 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-display text-base font-semibold">Membros ativos</h2>
                  <p className="text-xs text-muted-foreground">Pessoas com acesso à oficina</p>
                </div>
              </div>
              {loadingMembers ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : (
                <div className="divide-y divide-border/60">
                  {(members ?? []).map((m: any) => {
                    const cfg = roleConfig[m.role as Role];
                    const Icon = cfg.icon;
                    const isMe = m.user_id === user?.id;
                    return (
                      <div key={m.id} className="flex items-center gap-4 py-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                          {(m.profiles?.full_name ?? "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{m.profiles?.full_name ?? "Sem nome"} {isMe && <span className="text-xs text-muted-foreground">(você)</span>}</p>
                          <p className="text-xs text-muted-foreground">Entrou em {format(new Date(m.created_at), "dd/MM/yyyy", { locale: ptBR })}</p>
                        </div>
                        <Badge variant="outline" className={cn("gap-1.5", cfg.color)}>
                          <Icon className="h-3 w-3" /> {cfg.label}
                        </Badge>
                        {isOwner && !isMe && m.role !== "dono" && (
                          <button onClick={() => { if (confirm("Remover membro?")) removeMemberMut.mutate(m.id); }} className="rounded-md p-2 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {isOwner && (invites?.length ?? 0) > 0 && (
              <Card className="border-border/60 p-5">
                <h2 className="font-display text-base font-semibold mb-1">Convites pendentes</h2>
                <p className="text-xs text-muted-foreground mb-4">Enviados e aguardando cadastro</p>
                <div className="divide-y divide-border/60">
                  {(invites ?? []).map((i: any) => {
                    const cfg = roleConfig[i.role as Role];
                    const accepted = !!i.accepted_at;
                    const expired = new Date(i.expires_at) < new Date();
                    return (
                      <div key={i.id} className="flex items-center gap-4 py-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{i.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {accepted ? `Aceito em ${format(new Date(i.accepted_at), "dd/MM", { locale: ptBR })}` : expired ? "Expirado" : `Expira em ${format(new Date(i.expires_at), "dd/MM", { locale: ptBR })}`}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn(cfg.color)}>{cfg.label}</Badge>
                        {accepted ? (
                          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Aceito</Badge>
                        ) : (
                          <button onClick={() => revokeMut.mutate(i.id)} className="rounded-md p-2 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Convidar membro</DialogTitle></DialogHeader>
              {!lastLink ? (
                <div className="space-y-3">
                  <div>
                    <Label>E-mail *</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="mecanico@oficina.com" />
                  </div>
                  <div>
                    <Label>Função *</Label>
                    <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mecanico">Mecânico</SelectItem>
                        <SelectItem value="atendente">Atendente</SelectItem>
                        <SelectItem value="dono">Dono (acesso total)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">Geramos um link de convite para você compartilhar via WhatsApp ou e-mail.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm">Convite criado! Compartilhe este link:</p>
                  <div className="flex gap-2">
                    <Input readOnly value={lastLink} className="font-mono text-xs" />
                    <Button variant="outline" size="icon" onClick={copyLink}>
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Ao se cadastrar com este e-mail, a pessoa entra automaticamente na sua oficina.</p>
                </div>
              )}
              <DialogFooter>
                {!lastLink ? (
                  <>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button variant="hero" onClick={() => inviteMut.mutate()} disabled={!email || inviteMut.isPending}>
                      {inviteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gerar convite"}
                    </Button>
                  </>
                ) : (
                  <Button variant="hero" onClick={() => setOpen(false)}>Fechar</Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </SidebarProvider>
  );
}
