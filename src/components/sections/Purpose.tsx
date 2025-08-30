import React from 'react';

const Purpose: React.FC = () => {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-readowl-purple-dark mb-12">
          Nosso Propósito
        </h2>
        <div className="flex flex-col md:flex-row gap-12">
          {/* Coluna "Por que o Readowl existe?" */}
          <div className="md:w-1/2 text-left">
            <h3 className="text-2xl font-semibold text-readowl-purple mb-4">
              Por que o Readowl existe?
            </h3>
            <p className="text-gray-600 mb-4">
              <strong>O Brasil lê pouco.</strong> Menos da metade da população tem o hábito da leitura, e quando falamos de histórias fictícias, esse número é ainda menor. Isso significa menos leitores, menos escritores e menos incentivo para criar.
            </p>
            <p className="text-gray-700 font-semibold">
              O Readowl nasceu para mudar esse cenário!
            </p>
            <p className="text-gray-600 mt-2">
              Nosso objetivo é oferecer uma plataforma intuitiva gratuita para incentivar escritores amadores, atrair novos leitores e fortalecer a cultura literária brasileira.
            </p>
          </div>

          {/* Coluna "Quem somos?" */}
          <div className="md:w-1/2 text-left">
            <h3 className="text-2xl font-semibold text-readowl-purple mb-4">
              Quem somos?
            </h3>
            <p className="text-gray-600 mb-4">
              Somos um grupo de cinco estudantes de ADS no IFTM Uberaba que decidiu ir além de um simples projeto acadêmico: queremos oferecer um palco para quem escreve e um aconchego para quem lê.
            </p>
            <p className="text-gray-600">
              Mais do que um site, o Readowl é um movimento para fortalecer a literatura amadora no Brasil... e este é apenas o começo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Purpose;