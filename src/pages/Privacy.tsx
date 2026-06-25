import { Header } from "@/components/landing/Header";
import { Footer } from "@/components/landing/Footer";

export default function Privacy() {
  return (
    <div className="dark landing-theme min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-32 sm:px-6 lg:px-8">
        <h1 className="mb-8 text-4xl font-bold tracking-tight text-foreground">Política de Privacidade</h1>
        <div className="prose prose-invert max-w-none text-muted-foreground">
          <p className="mb-4">Última atualização: {new Date().toLocaleDateString("pt-BR")}</p>
          
          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">1. Coleta de Informações</h2>
          <p className="mb-4">
            Coletamos informações que você nos fornece diretamente ao se cadastrar, como nome, e-mail, telefone 
            e dados da sua oficina. Também coletamos os dados inseridos por você na plataforma (clientes, veículos, OS).
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">2. Uso das Informações</h2>
          <p className="mb-4">
            Suas informações são utilizadas exclusivamente para o funcionamento do sistema OficinaPrime, para processar 
            suas transações financeiras e para enviar comunicações importantes sobre a sua conta.
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">3. Proteção e Segurança (LGPD)</h2>
          <p className="mb-4">
            Em conformidade com a Lei Geral de Proteção de Dados (LGPD), garantimos que todos os dados inseridos 
            na plataforma são criptografados e armazenados em servidores seguros. O OficinaPrime NÃO vende, 
            aluga ou compartilha seus dados com terceiros para fins de marketing.
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">4. Cookies e Rastreamento</h2>
          <p className="mb-4">
            Utilizamos cookies para melhorar a sua experiência em nosso site, manter sua sessão ativa e analisar 
            o tráfego (via Google Analytics). Você pode desativar os cookies nas configurações do seu navegador.
          </p>

          <h2 className="mb-4 mt-8 text-2xl font-semibold text-foreground">5. Seus Direitos</h2>
          <p className="mb-4">
            Você tem o direito de acessar, corrigir ou excluir seus dados pessoais a qualquer momento diretamente 
            pelo painel do sistema ou entrando em contato com nosso suporte.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
