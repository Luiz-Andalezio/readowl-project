import LandingHeader from "../about/LandingHeader";
import AppearCard from "@/components/animation/AppearCard";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-readowl-purple-dark/10">
      <LandingHeader />
      <main className="container mx-auto px-6 py-10 text-readowl-purple-medium">
        <h1 className="text-3xl font-bold text-white mb-8">Política de Privacidade</h1>
        <AppearCard className="mb-8">
          <p className="text-readowl-purple-extralight">
            Sua privacidade é importante para nós. Este documento descreve como coletamos, usamos e protegemos seus dados no Readowl.
          </p>
        </AppearCard>

        <section className="grid md:grid-cols-2 gap-6">
          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={0}>
            <h2 className="text-2xl font-semibold text-white mb-2">1. Dados coletados</h2>
            <ul className="list-disc pl-6 text-readowl-purple-extralight space-y-1">
              <li>Cadastro: nome, e-mail e credenciais de login.</li>
              <li>Uso: páginas visitadas, filtros, buscas e interações.</li>
              <li>Conteúdo: livros publicados, comentários e avaliações.</li>
            </ul>
          </AppearCard>

          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={100}>
            <h2 className="text-2xl font-semibold text-white mb-2">2. Uso dos dados</h2>
            <p className="text-readowl-purple-extralight">
              Autenticação, personalização da experiência, moderação de conteúdo e melhoria contínua da plataforma. Não vendemos seus dados.
            </p>
          </AppearCard>

          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={200}>
            <h2 className="text-2xl font-semibold text-white mb-2">3. Compartilhamento</h2>
            <p className="text-readowl-purple-extralight">
              Compartilhamos dados somente com provedores estritamente necessários (hospedagem, e-mail, analytics), seguindo medidas contratuais e técnicas de segurança.
            </p>
          </AppearCard>

          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={300}>
            <h2 className="text-2xl font-semibold text-white mb-2">4. Segurança</h2>
            <ul className="list-disc pl-6 text-readowl-purple-extralight space-y-1">
              <li>Criptografia de senhas e boas práticas de segurança.</li>
              <li>Controles de acesso e monitoramento.</li>
              <li>Recomendação: use senhas fortes e exclusivas.</li>
            </ul>
          </AppearCard>

          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={400}>
            <h2 className="text-2xl font-semibold text-white mb-2">5. Seus direitos</h2>
            <p className="text-readowl-purple-extralight">
              Você pode solicitar acesso, correção ou exclusão dos seus dados. Entre em contato caso tenha dúvidas ou solicitações.
            </p>
          </AppearCard>
        </section>
      </main>
    </div>
  );
}
