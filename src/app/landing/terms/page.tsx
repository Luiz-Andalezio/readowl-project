import LandingHeader from "../about/LandingHeader";
import AppearCard from "@/components/animation/AppearCard";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-readowl-purple-dark/10">
      <LandingHeader />
      <main className="container mx-auto px-6 py-10 text-readowl-purple-medium">
        <h1 className="text-3xl font-bold text-white mb-8">Termos de Uso</h1>
        <AppearCard className="mb-8">
          <p className="text-readowl-purple-extralight">
            Bem-vindo ao Readowl. Ao utilizar nossa plataforma, você concorda com estes termos. Eles garantem uma convivência saudável entre leitores, autores e a comunidade.
          </p>
        </AppearCard>

        <section className="grid md:grid-cols-2 gap-6">
          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={0}>
            <h2 className="text-2xl font-semibold text-white mb-2">1. Publicação de conteúdo</h2>
            <ul className="list-disc pl-6 text-readowl-purple-extralight space-y-1">
              <li>Você é responsável pelo conteúdo que publica (livros, capítulos, comentários).</li>
              <li>É proibido material ilegal, plagiado ou que infrinja direitos autorais.</li>
              <li>Conteúdos poderão ser moderados para garantir segurança e qualidade.</li>
            </ul>
          </AppearCard>

          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={100}>
            <h2 className="text-2xl font-semibold text-white mb-2">2. Direitos e licenças</h2>
            <p className="text-readowl-purple-extralight">
              O conteúdo é seu. Ao publicar, você concede ao Readowl uma licença não exclusiva para exibir o conteúdo na plataforma, com objetivo de distribuição e visualização pelos usuários.
            </p>
          </AppearCard>

          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={200}>
            <h2 className="text-2xl font-semibold text-white mb-2">3. Conduta</h2>
            <ul className="list-disc pl-6 text-readowl-purple-extralight space-y-1">
              <li>Mantenha o respeito: assédio, discurso de ódio e spam não são permitidos.</li>
              <li>Uso indevido pode resultar em suspensão ou banimento da conta.</li>
              <li>Reportes podem ser enviados pelo canal de contato.</li>
            </ul>
          </AppearCard>

          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={300}>
            <h2 className="text-2xl font-semibold text-white mb-2">4. Modificações</h2>
            <p className="text-readowl-purple-extralight">
              Estes termos podem ser atualizados para refletir melhorias e mudanças na plataforma. Notificaremos mudanças relevantes quando apropriado.
            </p>
          </AppearCard>
        </section>
      </main>
    </div>
  );
}
