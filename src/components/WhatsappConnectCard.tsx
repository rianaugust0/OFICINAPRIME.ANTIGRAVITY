import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QrCode, Smartphone, Wifi, WifiOff, Loader2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function WhatsappConnectCard({ workshopId }: { workshopId: string }) {
  const qc = useQueryClient();
  const [loadingQr, setLoadingQr] = useState(false);

  const { data: wpp, isLoading } = useQuery({
    queryKey: ["whatsapp-config", workshopId],
    queryFn: async () => {
      const { data, error } = await supabase.from("workshop_whatsapp_config").select("*").eq("workshop_id", workshopId).maybeSingle();
      if (error) throw error;
      return data || { status: 'disconnected', qr_code_base64: null };
    },
  });

  const generateQrMut = useMutation({
    mutationFn: async () => {
      setLoadingQr(true);
      // SIMULAÇÃO: Na vida real aqui chamaria a Evolution API para criar a instância e retornar o QR Code em base64
      await new Promise(resolve => setTimeout(resolve, 2000));
      const fakeQr = "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=simulate_whatsapp_connection_" + Date.now();
      
      const { data: existing, error: errSelect } = await supabase.from("workshop_whatsapp_config").select("workshop_id").eq("workshop_id", workshopId).maybeSingle();
      
      if (existing) {
        const { error } = await supabase.from("workshop_whatsapp_config").update({ status: 'qrcode', qr_code_base64: fakeQr }).eq("workshop_id", workshopId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("workshop_whatsapp_config").insert({ workshop_id: workshopId, status: 'qrcode', qr_code_base64: fakeQr });
        if (error) throw error;
      }
      setLoadingQr(false);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsapp-config"] }),
    onError: (e: any) => {
      setLoadingQr(false);
      toast.error("Erro: " + (e.message || "Não foi possível gerar QR. Verifique se o banco de dados foi atualizado."));
    }
  });

  const connectMockMut = useMutation({
    mutationFn: async () => {
      // Simula o mecânico lendo o QRCode
      await new Promise(resolve => setTimeout(resolve, 1000));
      await supabase.from("workshop_whatsapp_config").update({ status: 'connected', last_connected_at: new Date().toISOString() }).eq("workshop_id", workshopId);
    },
    onSuccess: () => {
      toast.success("WhatsApp Conectado com Sucesso!");
      qc.invalidateQueries({ queryKey: ["whatsapp-config"] });
    }
  });

  const disconnectMut = useMutation({
    mutationFn: async () => {
      await supabase.from("workshop_whatsapp_config").update({ status: 'disconnected', qr_code_base64: null }).eq("workshop_id", workshopId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsapp-config"] })
  });

  if (isLoading) return <Card className="p-4 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></Card>;

  const status = wpp?.status || 'disconnected';

  return (
    <Card className="p-6 border-emerald-500/20 bg-emerald-500/5 shadow-sm relative overflow-hidden">
      {status === 'connected' && (
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
      )}
      
      <div className="flex flex-col md:flex-row gap-6 items-center justify-between relative z-10">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${status === 'connected' ? 'bg-emerald-500 text-white' : 'bg-background text-muted-foreground'}`}>
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold tracking-tight">Conexão WhatsApp</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Vincule o WhatsApp da sua oficina para que o sistema dispare mensagens automaticamente para os seus clientes.
            </p>
            
            <div className="flex items-center gap-2 mt-3">
              {status === 'connected' ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 px-2.5 py-1 rounded-full">
                  <Wifi className="h-3 w-3" /> Conectado e Operante
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-100 dark:bg-amber-500/20 px-2.5 py-1 rounded-full">
                  <WifiOff className="h-3 w-3" /> Desconectado
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="bg-background rounded-xl p-4 shadow-sm border border-border/50 min-w-[200px] flex flex-col items-center justify-center text-center">
          {status === 'disconnected' && (
            <>
              <QrCode className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <Button onClick={() => generateQrMut.mutate()} disabled={loadingQr} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                {loadingQr ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Gerar QR Code"}
              </Button>
            </>
          )}

          {status === 'qrcode' && (
            <div className="flex flex-col items-center">
              {wpp.qr_code_base64 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={wpp.qr_code_base64} alt="QR Code WhatsApp" className="w-32 h-32 mb-3 rounded-lg border p-1 bg-white cursor-pointer" onClick={() => connectMockMut.mutate()} title="Clique para simular a leitura do QR Code" />
              ) : (
                <div className="w-32 h-32 mb-3 bg-muted animate-pulse rounded-lg" />
              )}
              <p className="text-xs text-muted-foreground font-medium mb-3">Abra o WhatsApp e escaneie (Clique no QR para simular)</p>
              <Button variant="ghost" size="sm" onClick={() => generateQrMut.mutate()} disabled={loadingQr} className="text-xs">
                <RefreshCw className="h-3 w-3 mr-1" /> Atualizar QR
              </Button>
            </div>
          )}

          {status === 'connected' && (
            <div className="flex flex-col items-center">
              <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mb-3">
                <Wifi className="h-8 w-8" />
              </div>
              <Button variant="outline" size="sm" onClick={() => disconnectMut.mutate()} className="text-destructive hover:bg-destructive/10 hover:text-destructive border-transparent">
                Desconectar Aparelho
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
