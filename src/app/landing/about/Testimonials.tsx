import React from 'react';
import AppearCard from '@/components/animation/AppearCard';

const Testimonials: React.FC = () => {
  return (
    <section className="bg-readowl-purple-dark/10 py-20">
      <div className="container mx-auto px-6 text-center">
        <AppearCard>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Depoimentos
          </h2>
        </AppearCard>
        
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Testimonial 1 */}
          <AppearCard className="bg-readowl-purple-medium/30 p-8" delayMs={0}>
            <blockquote className="text-lg italic text-readowl-purple-extralight">
              <p>&quot;O Readowl me deu confiança para publicar minhas histórias. É fácil, rápido e a comunidade é incrível.&quot;</p>
              <cite className="mt-4 block not-italic font-semibold text-white">
                – Autor iniciante.
              </cite>
            </blockquote>
          </AppearCard>

          {/* Testimonial 2 */}
          <AppearCard className="bg-readowl-purple-medium/30 p-8" delayMs={150}>
            <blockquote className="text-lg italic text-readowl-purple-extralight">
              <p>&quot;Descobri livros que jamais encontraria em livrarias. É como abrir uma porta para novos mundos.&quot;</p>
              <cite className="mt-4 block not-italic font-semibold text-white">
                – Leitor.
              </cite>
            </blockquote>
          </AppearCard>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;