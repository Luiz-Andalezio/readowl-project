import LandingHeader from "../about/LandingHeader";
import AppearCard from "@/components/animation/AppearCard";

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-readowl-purple-dark/10">
      <LandingHeader />
      <main className="container mx-auto px-6 py-10 text-readowl-purple-medium">
        <h1 className="text-3xl font-bold text-white mb-8">Ajuda</h1>
        <AppearCard className="mb-8">
          <p className="text-readowl-purple-extralight">
            Encontre respostas rápidas sobre como usar o Readowl, publicar livros e interagir com a comunidade.
          </p>
        </AppearCard>

        <section className="grid md:grid-cols-2 gap-6">
          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={0}>
            <h2 className="text-xl font-semibold text-white mb-2">Como publico um livro?</h2>
            <ol className="list-decimal pl-6 text-readowl-purple-extralight space-y-1">
              <li>Crie sua conta ou faça login.</li>
              <li>Acesse sua Biblioteca e clique em &quot;Criar livro&quot;.</li>
              <li>Preencha título, sinopse, capa, gêneros e status.</li>
              <li>Revise e publique.</li>
            </ol>
          </AppearCard>

          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={100}>
            <h2 className="text-xl font-semibold text-white mb-2">Como editar ou excluir?</h2>
            <p className="text-readowl-purple-extralight">
              Na página do livro, se você for o autor, verá os botões de editar e excluir. Para exclusão, podemos solicitar confirmação adicional por senha ou step-up do Google.
            </p>
          </AppearCard>

          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={200}>
            <h2 className="text-xl font-semibold text-white mb-2">Status do livro</h2>
            <ul className="list-disc pl-6 text-readowl-purple-extralight space-y-1">
              <li>Ativo — atualizações em andamento.</li>
              <li>Concluído — história finalizada.</li>
              <li>Pausado — temporariamente sem atualizações.</li>
              <li>Cancelado — descontinuado.</li>
            </ul>
          </AppearCard>

          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={300}>
            <h2 className="text-xl font-semibold text-white mb-2">Dicas rápidas</h2>
            <ul className="list-disc pl-6 text-readowl-purple-extralight space-y-1">
              <li>Use capas nítidas no tamanho recomendado.</li>
              <li>Capriche na sinopse para atrair leitores.</li>
              <li>Categorize bem os gêneros para melhorar descobertas.</li>
            </ul>
          </AppearCard>
        </section>
      </main>
    </div>
  );
}
