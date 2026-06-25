import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export default function Terms() {
  return (
    <div className="dark landing-theme min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-32 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold tracking-tight text-foreground">Termos de Uso</h1>
        <div className="prose prose-invert max-w-none text-muted-foreground">
          <p className="mb-4">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
          
          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">1. Aceitação dos Termos</h2>
          <p className="mb-4">
            Ao acessar e usar o sistema OficinaPrime, você concorda em cumprir e ficar vinculado a estes Termos de Uso.
            Se você não concordar com qualquer parte destes termos, não deverá usar nossos serviços.
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">2. Descrição do Serviço</h2>
          <p className="mb-4">
            O OficinaPrime é um software como serviço (SaaS) voltado para a gestão de oficinas mecânicas e auto centers. 
            Disponibilizamos recursos para gestão de ordens de serviço, clientes, estoque, financeiro e integrações de comunicação.
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">3. Contas de Usuário</h2>
          <p className="mb-4">
            Você é responsável por manter a confidencialidade de sua conta e senha. O OficinaPrime não se responsabiliza 
            por qualquer perda ou dano resultante da sua falha em proteger suas credenciais de acesso.
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">4. Assinatura e Pagamentos</h2>
          <p className="mb-4">
            Oferecemos um período de teste gratuito de 7 dias. Após este período, a continuação do uso requer uma assinatura 
            paga. Os pagamentos são processados de forma segura através do Stripe. Você pode cancelar sua assinatura a qualquer 
            momento, sem multas, sendo a cobrança interrompida no ciclo seguinte.
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">5. Propriedade Intelectual</h2>
          <p className="mb-4">
            Todo o conteúdo presente na plataforma OficinaPrime, incluindo códigos, logotipos, designs e textos, é de 
            propriedade exclusiva do OficinaPrime e protegido por leis de direitos autorais.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
