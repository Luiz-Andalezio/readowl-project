import React from 'react';

const HowToPost: React.FC = () => {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-readowl-purple-dark mb-12">
          Como postar uma história
        </h2>
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Passo 1 */}
          <div className="flex-1">
            <div className="flex items-center justify-center h-16 w-16 mx-auto mb-4 rounded-full bg-readowl-purple-light text-white text-2xl font-bold">
              1
            </div>
            <h3 className="text-xl font-semibold text-readowl-purple mb-2">
              Passo 1 – Criar
            </h3>
            <p className="text-gray-600">
              Publique sua história de graça, sem burocracia. Use nosso editor intuitivo para deixar tudo com a sua cara.
            </p>
          </div>

          {/* Passo 2 */}
          <div className="flex-1">
            <div className="flex items-center justify-center h-16 w-16 mx-auto mb-4 rounded-full bg-readowl-purple-light text-white text-2xl font-bold">
              2
            </div>
            <h3 className="text-xl font-semibold text-readowl-purple mb-2">
              Passo 2 – Conectar
            </h3>
            <p className="text-gray-600">
              Mantenha sua frequência de postagem, ganhe leitores e faça parte de uma comunidade que apoia escritores independentes.
            </p>
          </div>

          {/* Passo 3 */}
          <div className="flex-1">
            <div className="flex items-center justify-center h-16 w-16 mx-auto mb-4 rounded-full bg-readowl-purple-light text-white text-2xl font-bold">
              3
            </div>
            <h3 className="text-xl font-semibold text-readowl-purple mb-2">
              Passo 3 – Crescer
            </h3>
            <p className="text-gray-600">
              Veja suas histórias ganharem destaque, e quem sabe, conquistar publicações físicas, adaptações e oportunidades únicas.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowToPost;