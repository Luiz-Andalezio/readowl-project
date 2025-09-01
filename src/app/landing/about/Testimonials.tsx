import React from 'react';

const Testimonials: React.FC = () => {
  return (
    <section className="bg-white py-20">
      <div className="container mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-readowl-purple-dark mb-4">
          Depoimentos
        </h2>
        
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Testimonial 1 */}
          <div className="bg-readowl-purple-extralight p-8 rounded-lg shadow-sm">
            <blockquote className="text-lg italic text-gray-800">
              <p>&quot;O Readowl me deu confiança para publicar minhas histórias. É fácil, rápido e a comunidade é incrível.&quot;</p>
              <cite className="mt-4 block not-italic font-semibold text-readowl-purple">
                – Autor iniciante.
              </cite>
            </blockquote>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-readowl-purple-extralight p-8 rounded-lg shadow-sm">
            <blockquote className="text-lg italic text-gray-800">
              <p>&quot;Descobri livros que jamais encontraria em livrarias. É como abrir uma porta para novos mundos.&quot;</p>
              <cite className="mt-4 block not-italic font-semibold text-readowl-purple">
                – Leitor.
              </cite>
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;