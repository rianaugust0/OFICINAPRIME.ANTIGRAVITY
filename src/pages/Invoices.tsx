import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { FileText, Settings, FileSearch } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Invoices() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-secondary/30">
        <AppSidebar />
        <main className="flex-1 overflow-x-hidden flex flex-col">
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl md:px-6">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h1 className="font-display text-lg font-semibold tracking-tight">Notas Fiscais</h1>
            </div>
          </header>

          <div className="p-4 md:p-8 flex-1 overflow-y-auto max-w-6xl mx-auto w-full space-y-6">
            <Card className="border-emerald-500/20 bg-emerald-500/5 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-emerald-700 flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Módulo Fiscal Ativado
                </CardTitle>
                <CardDescription className="text-emerald-700/80">
                  Para emitir Notas Fiscais (NF-e/NFS-e) através das Ordens de Serviço, certifique-se de preencher seus dados de faturamento.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/configuracoes?tab=fiscal">
                  <Button variant="outline" className="border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/10">
                    <Settings className="h-4 w-4 mr-2" /> Configurar Dados Fiscais
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <div className="h-20 w-20 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-6">
                <FileSearch className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold font-display tracking-tight mb-2">Nenhuma nota emitida ainda</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                As notas fiscais geradas a partir das suas Ordens de Serviço aparecerão aqui para fácil acesso do seu contador.
              </p>
              <Link to="/ordens">
                <Button variant="hero" className="shadow-md">
                  Ir para Ordens de Serviço
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
