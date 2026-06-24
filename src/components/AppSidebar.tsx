import { useState } from "react";
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
  CreditCard,
  FileText,
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
      { title: "Notas Fiscais", url: "/notas-fiscais", icon: FileText },
      { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
    ]
  },
  {
    label: "Administração",
    items: [
      { title: "Notificações", url: "/notificacoes", icon: Bell },
      { title: "Equipe", url: "/equipe", icon: UsersRound },
      { title: "Configurações", url: "/configuracoes", icon: Settings },
      { title: "Assinatura", url: "/assinatura", icon: CreditCard },
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
  
  const trialEnds = workshop?.workshops?.trial_ends_at ? new Date(workshop.workshops.trial_ends_at) : addDays(new Date(), 7);
  const daysLeft = Math.max(0, differenceInDays(trialEnds, new Date()));
  const isTrial = workshop?.workshops?.subscription_status === 'trialing';

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
