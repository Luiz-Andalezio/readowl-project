import React from 'react';
import AppearCard from '@/components/animation/AppearCard';

const Purpose: React.FC = () => {
  return (
    <section className="bg-readowl-purple-dark/10 py-20">
      <div className="container mx-auto px-6 text-center">
        <AppearCard>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">
            Nosso Propósito
          </h2>
        </AppearCard>
        <div className="flex flex-col md:flex-row gap-12">
          {/* Column "Why does Readowl exist?" */}
          <AppearCard className="md:w-1/2 text-left bg-readowl-purple-medium/30 p-6">
            <h3 className="text-2xl font-semibold text-white mb-4">
              Por que o Readowl existe?
            </h3>
            <p className="text-readowl-purple-extralight mb-4">
              <strong>O Brasil lê pouco.</strong> Menos da metade da população tem o hábito da leitura, e quando falamos de histórias fictícias, esse número é ainda menor. Isso significa menos leitores, menos escritores e menos incentivo para criar.
            </p>
            <p className="text-readowl-purple-extralight font-semibold">
              O Readowl nasceu para mudar esse cenário!
            </p>
            <p className="text-readowl-purple-extralight mt-2">
              Nosso objetivo é oferecer uma plataforma intuitiva gratuita para incentivar escritores amadores, atrair novos leitores e fortalecer a cultura literária brasileira.
            </p>
          </AppearCard>

          {/* Column "Who are we?" */}
          <AppearCard className="md:w-1/2 text-left bg-readowl-purple-medium/30 p-6" delayMs={150}>
            <h3 className="text-2xl font-semibold text-white mb-4">
              Quem somos?
            </h3>
            <p className="text-readowl-purple-extralight mb-4">
              Somos um grupo de cinco estudantes de ADS no IFTM Uberaba que decidiu ir além de um simples projeto acadêmico: queremos oferecer um palco para quem escreve e um aconchego para quem lê.
            </p>
            <p className="text-readowl-purple-extralight">
              Mais do que um site, o Readowl é um movimento para fortalecer a literatura amadora no Brasil... e este é apenas o começo.
            </p>
          </AppearCard>
        </div>
      </div>
    </section>
  );
};

export default Purpose;