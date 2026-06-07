import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Wrench, Menu, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { label: "Módulos", href: "#recursos" },
    { label: "Comparativo", href: "#comparativo" },
    { label: "Depoimentos", href: "#depoimentos" },
    { label: "Planos", href: "#planos" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all ${
        scrolled
          ? "border-b border-white/10 bg-background/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-primary-foreground shadow-[0_0_20px_-4px_var(--gold-glow)]">
            <Wrench className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            Oficina<span className="text-gold">Prime</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-bold text-white transition-colors hover:text-gold"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/login"
            onClick={() => trackEvent("click_entrar", { source: "header" })}
            className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-bold text-white transition-colors hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          >
            Entrar
          </Link>
          <Link
            to="/signup"
            onClick={() => trackEvent("click_testar_gratis", { source: "header" })}
            className="inline-flex h-9 items-center justify-center rounded-md bg-gold px-4 text-sm font-semibold text-primary-foreground shadow-[0_0_20px_-4px_var(--gold-glow)] transition-all hover:shadow-[0_0_30px_-4px_var(--gold-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
          >
            Teste grátis
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="h-5 w-5 text-foreground" />
          ) : (
            <Menu className="h-5 w-5 text-foreground" />
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-background/95 px-4 py-4 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => { trackEvent("click_entrar", { source: "header_mobile" }); setMobileOpen(false); }}
                className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 px-4 text-sm font-medium text-foreground"
              >
                Entrar
              </Link>
              <Link
                to="/signup"
                onClick={() => { trackEvent("click_testar_gratis", { source: "header_mobile" }); setMobileOpen(false); }}
                className="inline-flex h-10 items-center justify-center rounded-md bg-gold px-4 text-sm font-semibold text-primary-foreground"
              >
                Teste grátis
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
