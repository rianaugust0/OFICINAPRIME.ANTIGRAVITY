import { Lock, Zap, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { openWhatsApp } from "@/lib/whatsapp";

interface UpgradeOverlayProps {
  requiredPlan: "profissional" | "premium";
  featureName: string;
}

export function UpgradeOverlay({ requiredPlan, featureName }: UpgradeOverlayProps) {
  const adminPhone = "5511999999999"; // TODO: Coloque aqui o seu número de WhatsApp de Vendas!
  
  const planName = requiredPlan === "premium" ? "Premium VIP" : "Profissional";
  const planColor = requiredPlan === "premium" ? "text-amber-500" : "text-blue-500";
  const bgGradient = requiredPlan === "premium" ? "from-amber-500 to-orange-600" : "from-blue-600 to-indigo-700";

  const handleUpgrade = () => {
    const text = `Olá! Quero fazer o upgrade do meu sistema OficinaPrime para o plano *${planName}* para liberar a funcionalidade de *${featureName}*. Como podemos proceder?`;
    openWhatsApp(adminPhone, text);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 min-h-[80vh]">
      <Card className="w-full max-w-md border-0 shadow-2xl overflow-hidden relative">
        <div className={`absolute top-0 w-full h-2 bg-gradient-to-r ${bgGradient}`}></div>
        
        <CardContent className="p-8 text-center flex flex-col items-center">
          <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center mb-6 relative">
            <Lock className={`h-10 w-10 ${planColor}`} />
            {requiredPlan === "premium" && (
              <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-bounce">
                VIP
              </div>
            )}
          </div>
          
          <h2 className="text-2xl font-black text-slate-800 mb-2">Funcionalidade Bloqueada</h2>
          <p className="text-slate-600 mb-8">
            O módulo de <strong className="text-slate-900">{featureName}</strong> é exclusivo para assinantes do plano <strong className={planColor}>{planName}</strong>.
          </p>

          <div className="bg-slate-50 w-full rounded-xl p-4 text-left mb-8 border border-slate-100">
            <h4 className="text-xs font-bold uppercase text-slate-500 mb-3 tracking-wider">Por que fazer o upgrade?</h4>
            <ul className="space-y-2">
              <li className="flex items-center text-sm text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-2" />
                Automatize processos manuais
              </li>
              <li className="flex items-center text-sm text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-2" />
                Aumente o faturamento da oficina
              </li>
              <li className="flex items-center text-sm text-slate-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 mr-2" />
                Passe mais credibilidade aos clientes
              </li>
            </ul>
          </div>

          <Button 
            onClick={handleUpgrade}
            className={`w-full h-12 text-md font-bold text-white shadow-lg bg-gradient-to-r hover:opacity-90 ${bgGradient} border-0 hover:scale-[1.02] transition-transform`}
          >
            <Zap className="mr-2 h-5 w-5 fill-white/20" />
            Falar com Consultor para Evoluir
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <p className="text-xs text-slate-400 mt-4">
            A ativação do novo plano é feita em menos de 5 minutos pela nossa equipe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
