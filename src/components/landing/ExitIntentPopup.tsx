import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";
import { Gift, ArrowRight } from "lucide-react";

export function ExitIntentPopup() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Verifica se já mostramos o popup para esse usuário (salvo no navegador)
    const hasSeenPopup = localStorage.getItem("hasSeenExitPopup");
    if (hasSeenPopup) return;

    const mouseEvent = (e: MouseEvent) => {
      // Se o mouse sair do topo da janela (indicando que vai fechar a aba ou digitar outra url)
      if (e.clientY < 10) {
        setIsOpen(true);
        localStorage.setItem("hasSeenExitPopup", "true");
        trackEvent("exit_intent_popup_shown", {});
      }
    };

    document.addEventListener("mouseleave", mouseEvent);

    return () => {
      document.removeEventListener("mouseleave", mouseEvent);
    };
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md border-gold/40 bg-background/95 backdrop-blur-xl p-0 overflow-hidden">
        <div className="bg-gradient-to-r from-gold to-amber-500 p-6 text-center text-primary-foreground">
          <Gift className="mx-auto h-12 w-12 mb-3" />
          <h2 className="text-2xl font-black uppercase tracking-tight">ESPERA AÍ!</h2>
          <p className="mt-2 font-medium">Sabemos que mudar de sistema dá preguiça.</p>
        </div>
        
        <div className="p-6 text-center">
          <p className="text-foreground/90 text-lg mb-6 leading-relaxed">
            Que tal <span className="font-bold text-gold">30 Dias Grátis</span> e <span className="font-bold text-emerald-500">Migração de Dados Inclusa</span> para você testar sem pressa?
          </p>

          <div className="flex flex-col gap-3">
            <Link
              to="/signup"
              onClick={() => {
                trackEvent("click_exit_popup_accept", {});
                setIsOpen(false);
              }}
              className="flex items-center justify-center gap-2 w-full bg-gold hover:bg-gold/90 text-primary-foreground font-bold h-12 rounded-xl transition-transform hover:scale-105 shadow-[0_0_20px_-5px_var(--gold-glow)]"
            >
              Eu Quero Meus 30 Dias Grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
            
            <button 
              onClick={() => {
                trackEvent("click_exit_popup_reject", {});
                setIsOpen(false);
              }}
              className="text-muted-foreground text-xs hover:text-foreground underline underline-offset-4"
            >
              Não, prefiro continuar perdendo dinheiro com meu sistema atual.
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
