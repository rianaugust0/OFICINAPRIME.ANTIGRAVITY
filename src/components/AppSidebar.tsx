import { NavLink, useLocation, Link } from "react-router-dom";
import { differenceInDays, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Car,
  ClipboardList,
  Calendar,
  Wallet,
  BarChart3,
  Bell,
  Settings,
  UsersRound,
  Wrench,
  Search,
  FileSpreadsheet,
  Package,
  FileSignature,
  Truck,
  LogOut,
  Bot,
  Lock,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const groups = [
  {
    label: "Visão Geral",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    label: "Oficina",
    items: [
      { title: "Ordens de Serviço", url: "/ordens", icon: ClipboardList },
      { title: "Agenda", url: "/agenda", icon: Calendar },
      { title: "Estoque", url: "/estoque", icon: Package },
    ]
  },
  {
    label: "Vendas",
    items: [
      { title: "Orçamentos", url: "/orcamentos", icon: FileSignature },
    ]
  },
  {
    label: "Relacionamento",
    items: [
      { title: "Clientes", url: "/clientes", icon: Users },
      { title: "Veículos", url: "/veiculos", icon: Car },
      { title: "Fornecedores", url: "/fornecedores", icon: Truck },
      { title: "Histórico por Placa", url: "/historico", icon: Search },
    ]
  },
  {
    label: "Marketing",
    items: [
      { title: "Automações", url: "/automacoes", icon: Bot },
    ]
  },
  {
    label: "Financeiro",
    items: [
      { title: "Financeiro", url: "/financeiro", icon: Wallet },
      { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
    ]
  },
  {
    label: "Administração",
    items: [
      { title: "Notificações", url: "/notificacoes", icon: Bell },
      { title: "Equipe", url: "/equipe", icon: UsersRound },
      { title: "Configurações", url: "/configuracoes", icon: Settings },
    ]
  }
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { workshop } = useAuth();
  const isActive = (path: string) => pathname === path;
  const logoUrl = workshop?.workshops?.logo_url;
  const wsName = workshop?.workshops?.name;
  
  const createdAt = workshop?.workshops?.created_at ? new Date(workshop.workshops.created_at) : new Date();
  const trialEnd = addDays(createdAt, 30);
  const daysLeft = Math.max(0, differenceInDays(trialEnd, new Date()));
  // Constants for trial banner
  const isTrial = workshop?.workshops?.plan !== "vitalicio";
  const isExpired = isTrial && daysLeft <= 0;

  if (isExpired) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 animate-in fade-in duration-700">
         <div className="bg-zinc-950/80 backdrop-blur-3xl rounded-3xl p-8 max-w-lg w-full shadow-[0_0_80px_rgba(212,175,55,0.15)] border border-white/10 relative overflow-hidden z-10 animate-in zoom-in-95 duration-500">
            {/* Elegant gradient mesh background */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-[80px]"></div>
            
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-500/20 to-amber-700/5 text-amber-500 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/20 shadow-[0_0_30px_rgba(217,119,6,0.15)]">
               <Lock className="w-10 h-10" strokeWidth={1.5} />
            </div>
            
            <div className="text-center mb-8 relative z-10">
              <h2 className="text-3xl font-display font-semibold text-white mb-2 tracking-tight">Tempo Esgotado</h2>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">
                Seu período de experiência chegou ao fim. Para garantir que sua oficina continue operando sem interrupções e para preservar todos os seus dados e histórico, faça o upgrade para a <strong className="text-amber-500 font-medium">Licença Vitalícia</strong>.
              </p>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <button className="relative w-full overflow-hidden group bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-4 rounded-xl transition-all active:scale-95 mb-4 text-base border border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_20px_rgba(217,119,6,0.1)] hover:shadow-[0_0_30px_rgba(217,119,6,0.2)]">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Garantir Acesso Vitalício <span className="text-amber-500 font-semibold">(R$ 347)</span>
                  </span>
                </button>
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
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-center">Valor: <span className="text-foreground font-black">R$ 347,00</span></p>
                    <div className="bg-white p-2 rounded-xl shadow-sm">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent("00020126330014BR.GOV.BCB.PIX0111703414381115204000053039865406347.005802BR5925Rian Augusto Alves da Sil6009SAO PAULO62140510hZKXEgwLe963045381")}`} alt="PIX QR Code" className="w-40 h-40" />
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">Escaneie pelo app do banco</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Ou use o PIX Copia e Cola</Label>
                    <div className="flex gap-2">
                      <Input readOnly value="00020126330014BR.GOV.BCB.PIX0111703414381115204000053039865406347.005802BR5925Rian Augusto Alves da Sil6009SAO PAULO62140510hZKXEgwLe963045381" className="font-mono text-[10px] bg-secondary/30 text-muted-foreground" />
                      <button className="px-3 rounded-md border border-input hover:bg-accent text-sm font-medium" onClick={() => {
                        navigator.clipboard.writeText("00020126330014BR.GOV.BCB.PIX0111703414381115204000053039865406347.005802BR5925Rian Augusto Alves da Sil6009SAO PAULO62140510hZKXEgwLe963045381");
                        toast.success("Código PIX copiado!");
                      }}>Copiar</button>
                    </div>
                  </div>
                  
                  <div className="pt-4 space-y-3">
                    <p className="text-xs text-muted-foreground text-center">
                      Após o pagamento, clique no botão abaixo para enviar o comprovante no WhatsApp do suporte. Sua licença será ativada em poucos minutos.
                    </p>
                    <button 
                      className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white gap-2 font-bold rounded-md py-2" 
                      onClick={() => window.open('https://wa.me/5562985658094?text=Olá! Acabei de fazer o PIX da minha Licença Vitalícia da OficinaPrime. Segue o comprovante:', '_blank')}
                    >
                      Enviar Comprovante no WhatsApp
                    </button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest">Liberação Imediata Pós-Pagamento</p>
         </div>
      </div>
    );
  }

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-2 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary">
            {logoUrl ? (
              <img src={logoUrl} alt={wsName ?? "Logo"} className="h-full w-full object-cover" />
            ) : (
              <Wrench className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            )}
          </div>
          {!collapsed && (
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-display text-sm font-bold tracking-tight text-sidebar-foreground">
                {wsName ?? <>Oficina<span className="text-primary">Prime</span></>}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40">
                Painel
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label} className="mt-2">
            {!collapsed && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                      className="data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:font-semibold hover:bg-sidebar-accent"
                    >
                      <NavLink to={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        {!collapsed && isTrial && (
          <div className="mx-3 mb-4 mt-2 rounded-2xl bg-gradient-to-b from-zinc-900 to-black border border-white/10 p-4 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.4)] group">
            {/* Subtle background glow */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 blur-[40px] rounded-full pointer-events-none group-hover:bg-amber-500/20 transition-colors duration-700" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/5 blur-[40px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex flex-col gap-3">
              {/* Badge */}
              <div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5">
                <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                  <span className="animate-pulse">⚡</span> Teste Premium
                </span>
              </div>
              
              {/* Headline */}
              <h4 className="text-sm font-semibold text-zinc-100 leading-tight">
                Seu acesso completo <br/>
                expira em <span className="text-amber-400 font-bold">{daysLeft} dias</span>
              </h4>
              
              {/* Subheadline */}
              <p className="text-[10px] text-zinc-400 leading-relaxed">
                Continue utilizando todos os recursos premium da OficinaPrime sem limitações.
              </p>
              
              {/* Button */}
              <Link to="/configuracoes?tab=plan" className="mt-1">
                <button className="w-full rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-[11px] font-bold text-amber-950 transition-all duration-300 hover:from-amber-300 hover:to-amber-400 hover:shadow-[0_0_15px_rgba(251,191,36,0.3)] active:scale-[0.98]">
                  Ativar Plano Premium
                </button>
              </Link>
            </div>
          </div>
        )}
        <UserFooter collapsed={collapsed} />
      </SidebarFooter>
    </Sidebar>
  );
}


function UserFooter({ collapsed }: { collapsed: boolean }) {
  const { user, workshop, signOut } = useAuth();
  const navigate = useNavigate();
  const name = (user?.user_metadata?.full_name as string) || user?.email || "Usuário";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = async () => {
    await signOut();
    toast.success("Sessão encerrada.");
    navigate("/login");
  };

  return (
    <div className="flex items-center gap-3 p-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-sm font-semibold text-primary">
        {initials || "U"}
      </div>
      {!collapsed && (
        <>
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            <span className="truncate text-sm font-medium text-sidebar-foreground">{name}</span>
            <span className="truncate text-xs text-sidebar-foreground/50">
              {workshop?.workshops?.name ?? "Carregando…"}
            </span>
          </div>
          <button onClick={handleLogout} className="text-sidebar-foreground/50 hover:text-primary transition-colors" aria-label="Sair">
            <LogOut className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
}
