import React from 'react';
import AppearCard from '@/components/animation/AppearCard';

const HowToPost: React.FC = () => {
  return (
    <section className="bg-readowl-purple-dark/10 py-20">
      <div className="container mx-auto px-6 text-center">
        <AppearCard>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">
            Como postar uma história
          </h2>
        </AppearCard>
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Step 1 */}
          <AppearCard className="flex-1 bg-readowl-purple-medium/30 p-6" delayMs={0}>
            <div className="flex items-center justify-center h-16 w-16 mx-auto mb-4 bg-readowl-purple-light text-white text-2xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Passo 1 – Criar
            </h3>
            <p className="text-readowl-purple-extralight">
              Publique sua história de graça, sem burocracia. Use nosso editor intuitivo para deixar tudo com a sua cara.
            </p>
          </AppearCard>

          {/* Step 2 */}
          <AppearCard className="flex-1 bg-readowl-purple-medium/30 p-6" delayMs={150}>
            <div className="flex items-center justify-center h-16 w-16 mx-auto mb-4 bg-readowl-purple-light text-white text-2xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Passo 2 – Conectar
            </h3>
            <p className="text-readowl-purple-extralight">
              Mantenha sua frequência de postagem, ganhe leitores e faça parte de uma comunidade que apoia escritores independentes.
            </p>
          </AppearCard>

          {/* Step 3 */}
          <AppearCard className="flex-1 bg-readowl-purple-medium/30 p-6" delayMs={300}>
            <div className="flex items-center justify-center h-16 w-16 mx-auto mb-4 bg-readowl-purple-light text-white text-2xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Passo 3 – Crescer
            </h3>
            <p className="text-readowl-purple-extralight">
              Veja suas histórias ganharem destaque, e quem sabe, conquistar publicações físicas, adaptações e oportunidades únicas.
            </p>
          </AppearCard>
        </div>
      </div>
    </section>
  );
};

export default HowToPost;