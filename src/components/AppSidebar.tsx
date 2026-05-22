import { NavLink, useLocation } from "react-router-dom";
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
  LogOut,
  Search,
  FileSpreadsheet,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Clientes", url: "/clientes", icon: Users },
  { title: "Veículos", url: "/veiculos", icon: Car },
  { title: "Histórico por placa", url: "/historico", icon: Search },
  { title: "Ordens", url: "/ordens", icon: ClipboardList },
  { title: "Agenda", url: "/agenda", icon: Calendar },
  { title: "Financeiro", url: "/financeiro", icon: Wallet },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Notificações", url: "/notificacoes", icon: Bell },
  { title: "Equipe", url: "/equipe", icon: UsersRound },
  { title: "Importar dados", url: "/importar", icon: FileSpreadsheet },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { workshop } = useAuth();
  const isActive = (path: string) => pathname === path;
  const logoUrl = workshop?.workshops?.logo_url;
  const wsName = workshop?.workshops?.name;

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
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
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
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
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
