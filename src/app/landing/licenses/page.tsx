import LandingHeader from "../about/LandingHeader";
import AppearCard from "@/components/animation/AppearCard";

export default function LicensesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-readowl-purple-dark/10">
      <LandingHeader />
      <main className="container mx-auto px-6 py-10 text-readowl-purple-medium">
        <h1 className="text-3xl font-bold text-white mb-8">Licenças</h1>
        <AppearCard className="mb-8">
          <p className="text-readowl-purple-extralight">
            Informações sobre licenças e direitos de uso de conteúdos e softwares utilizados pelo Readowl.
          </p>
        </AppearCard>

        <section className="grid md:grid-cols-2 gap-6">
          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={0}>
            <h2 className="text-2xl font-semibold text-white mb-2">Conteúdo criado por usuários</h2>
            <p className="text-readowl-purple-extralight">Os direitos permanecem com os autores. A plataforma recebe uma licença não exclusiva para exibir o conteúdo.</p>
          </AppearCard>

          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={100}>
            <h2 className="text-2xl font-semibold text-white mb-2">Bibliotecas de terceiros</h2>
            <p className="text-readowl-purple-extralight">Respeitamos as licenças de softwares de terceiros utilizados. Créditos e licenças podem ser exibidos aqui ou no repositório.</p>
          </AppearCard>

          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={200}>
            <h2 className="text-2xl font-semibold text-white mb-2">Marca e identidade</h2>
            <p className="text-readowl-purple-extralight">A marca Readowl e seus elementos visuais são de uso exclusivo do projeto. Entre em contato para autorizações.</p>
          </AppearCard>
        </section>
      </main>
    </div>
  );
}
