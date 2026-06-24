import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Signup from "./pages/Signup.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Clients from "./pages/Clients.tsx";
import Vehicles from "./pages/Vehicles.tsx";
import Orders from "./pages/Orders";
import Schedule from "./pages/Schedule.tsx";
import Finance from "./pages/Finance";
import WorkshopSettings from "./pages/WorkshopSettings";
import Reports from "./pages/Reports.tsx";
import Notifications from "./pages/Notifications.tsx";
import Settings from "./pages/Settings.tsx";
import Team from "./pages/Team.tsx";
import PlateHistory from "./pages/PlateHistory.tsx";
import ImportData from "./pages/Import.tsx";
import NotFound from "./pages/NotFound.tsx";
import ClientPortal from "./pages/ClientPortal";
import Inventory from "./pages/Inventory";
import Quotes from "./pages/Quotes";
import Suppliers from "./pages/Suppliers";
import Automations from "./pages/Automations";
import Subscription from "./pages/Subscription";
import Debug from "./pages/Debug";
import PublicQuote from "./pages/PublicQuote";
import Invoices from "./pages/Invoices";
const queryClient = new QueryClient();

const protect = (el: React.ReactNode) => <ProtectedRoute>{el}</ProtectedRoute>;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/portal/os/:id" element={<ClientPortal />} />
            <Route path="/orcamento/:id" element={<PublicQuote />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/dashboard" element={protect(<Dashboard />)} />
            <Route path="/clientes" element={protect(<Clients />)} />
            <Route path="/veiculos" element={protect(<Vehicles />)} />
            <Route path="/financeiro" element={protect(<Finance />)} />
            <Route path="/ordens" element={protect(<Orders />)} />
            <Route path="/agenda" element={protect(<Schedule />)} />
            <Route path="/estoque" element={protect(<Inventory />)} />
            <Route path="/relatorios" element={protect(<Reports />)} />
            <Route path="/notificacoes" element={protect(<Notifications />)} />
            <Route path="/configuracoes" element={protect(<Settings />)} />
            <Route path="/equipe" element={protect(<Team />)} />
            <Route path="/historico" element={protect(<PlateHistory />)} />
            <Route path="/importar" element={protect(<ImportData />)} />
            <Route path="/orcamentos" element={protect(<Quotes />)} />
            <Route path="/fornecedores" element={protect(<Suppliers />)} />
            <Route path="/automacoes" element={protect(<Automations />)} />
            <Route path="/assinatura" element={protect(<Subscription />)} />
            <Route path="/notas-fiscais" element={protect(<Invoices />)} />
            <Route path="/debug" element={<Debug />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;



