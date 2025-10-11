import React from 'react';
import AppearCard from '@/components/animation/AppearCard';

const CheckIcon = () => (
  <svg className="w-6 h-6 text-readowl-purple-light mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
  </svg>
);

const HowItHelps: React.FC = () => {
  return (
    <section className="bg-readowl-purple-dark/10 py-20">
      <div className="container mx-auto px-6">
        <AppearCard>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
            Como ajudamos leitores e escritores
          </h2>
        </AppearCard>
        <div className="flex flex-col md:flex-row gap-12">
          {/* Readers */}
          <AppearCard className="md:w-1/2 bg-readowl-purple-medium/30 p-8" delayMs={0}>
            <h3 className="text-2xl font-semibold text-white mb-6">
              Para leitores:
            </h3>
            <ul className="space-y-4 text-readowl-purple-extralight">
              <li className="flex items-start"><CheckIcon /><span>Descubra novos autores e gêneros.</span></li>
              <li className="flex items-start"><CheckIcon /><span>Salve suas obras favoritas na biblioteca pessoal.</span></li>
              <li className="flex items-start"><CheckIcon /><span>Receba notificações de novos capítulos.</span></li>
              <li className="flex items-start"><CheckIcon /><span>Interaja com autores e outros leitores.</span></li>
            </ul>
          </AppearCard>

          {/* Writers */}
          <AppearCard className="md:w-1/2 bg-readowl-purple-medium/30 p-8" delayMs={150}>
            <h3 className="text-2xl font-semibold text-white mb-6">
              Para escritores:
            </h3>
            <ul className="space-y-4 text-readowl-purple-extralight">
              <li className="flex items-start"><CheckIcon /><span>Publique seus livros, volumes e capítulos de forma simples.</span></li>
              <li className="flex items-start"><CheckIcon /><span>Personalize suas histórias com imagens e formatação.</span></li>
              <li className="flex items-start"><CheckIcon /><span>Alcance leitores com destaque nas vitrines automáticas.</span></li>
              <li className="flex items-start"><CheckIcon /><span>Receba avaliações, curtidas e comentários para evoluir na escrita.</span></li>
            </ul>
          </AppearCard>
        </div>
      </div>
    </section>
  );
};

export default HowItHelps;