import { useEffect } from "react";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { SocialProofSection } from "@/components/landing/SocialProofSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { FlowSection } from "@/components/landing/FlowSection";
import { ComparisonSection } from "@/components/landing/ComparisonSection";
import { DifferentialsSection } from "@/components/landing/DifferentialsSection";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import { FAQSection } from "@/components/landing/FAQSection";
import { Footer } from "@/components/landing/Footer";

export default function Index() {
  useEffect(() => {
    document.title = "OficinaPrime - O sistema definitivo para oficinas mecânicas";
    
    // Configurar meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'OS, estoque, CRM, financeiro e WhatsApp automático em um só lugar. Tudo ilimitado por R$ 150/mês — cancele quando quiser.');
  }, []);

  return (
    <div className="dark landing-theme min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <HeroSection />
        <SocialProofSection />
        <FeaturesSection />
        <FlowSection />
        <ComparisonSection />
        <section id="diferenciais">
          <DifferentialsSection />
        </section>
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
      </main>
      <Footer />
    </div>
  );
}
