import { Wrench, Instagram, Facebook, Youtube, Mail, LogIn } from "lucide-react";
import { Link } from "react-router-dom";
import { trackEvent } from "@/lib/analytics";

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-surface/50 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold text-primary-foreground">
                <Wrench className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">
                Oficina<span className="text-gold">Prime</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              O sistema definitivo para gestão de oficinas mecânicas. Feito por
              quem entende do dia a dia da oficina.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {[Instagram, Facebook, Youtube, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-muted-foreground transition-colors hover:border-gold/30 hover:text-gold"
                  aria-label="Social"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              Produto
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#recursos" className="hover:text-foreground">Módulos</a></li>
              <li><a href="#fluxo" className="hover:text-foreground">Como funciona</a></li>
              <li><a href="#planos" className="hover:text-foreground">Preços</a></li>
              <li><Link to="/signup" className="hover:text-foreground">Teste grátis</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              Empresa
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Sobre nós</a></li>
              <li><a href="#" className="hover:text-foreground">Blog</a></li>
              <li><a href="#" className="hover:text-foreground">Contato</a></li>
              <li><a href="#" className="hover:text-foreground">Carreiras</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold text-foreground">
              Legal
            </h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground">Termos de uso</a></li>
              <li><a href="#" className="hover:text-foreground">Política de privacidade</a></li>
              <li><a href="#" className="hover:text-foreground">LGPD</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} OficinaPrime. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              onClick={() => trackEvent("click_entrar", { source: "footer" })}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-gold"
            >
              <LogIn className="h-3.5 w-3.5" /> Entrar
            </Link>
            <p className="text-xs text-muted-foreground">Feito com ♥ no Brasil</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
