import LandingHeader from "../about/LandingHeader";
import AppearCard from "@/components/animation/AppearCard";

export default function SecurityPage() {
  return (
    <div className="min-h-screen flex flex-col bg-readowl-purple-dark/10">
      <LandingHeader />
      <main className="container mx-auto px-6 py-10 text-readowl-purple-medium">
        <h1 className="text-3xl font-bold text-white mb-8">Política de Segurança</h1>

        <AppearCard className="mb-8">
          <p className="text-readowl-purple-extralight">
            A segurança do Readowl é uma prioridade. Agradecemos relatos responsáveis de vulnerabilidades e nos comprometemos a responder com agilidade e transparência.
          </p>
        </AppearCard>

        <section className="grid md:grid-cols-2 gap-6">
          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={0}>
            <h2 className="text-2xl font-semibold text-white mb-2">Versões Suportadas</h2>
            <p className="text-readowl-purple-extralight">
              Atualmente, apenas a versão mais recente no branch <span className="font-mono">main</span> recebe atualizações de segurança.
            </p>
          </AppearCard>

          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={100}>
            <h2 className="text-2xl font-semibold text-white mb-2">Como reportar vulnerabilidades</h2>
            <ul className="list-disc pl-6 text-readowl-purple-extralight space-y-1">
              <li>Não abra issues públicas sobre segurança.</li>
              <li>Envie um e-mail para <a href="mailto:readowl25@gmail.com" className="underline hover:text-white">readowl25@gmail.com</a>.</li>
            </ul>
          </AppearCard>

          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={200}>
            <h2 className="text-2xl font-semibold text-white mb-2">O que incluir no relatório</h2>
            <ul className="list-disc pl-6 text-readowl-purple-extralight space-y-1">
              <li>Tipo de vulnerabilidade (ex.: XSS, SQL Injection, etc.).</li>
              <li>Descrição detalhada do problema.</li>
              <li>Passos para reprodução.</li>
              <li>Impacto potencial.</li>
            </ul>
          </AppearCard>

          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={300}>
            <h2 className="text-2xl font-semibold text-white mb-2">Tempo de resposta</h2>
            <p className="text-readowl-purple-extralight">
              Você receberá uma confirmação em até 48 horas após o envio do relatório. Trabalharemos para corrigir o problema o mais rápido possível e manteremos você informado.
            </p>
          </AppearCard>
        </section>
      </main>
    </div>
  );
}
