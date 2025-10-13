import React from 'react';
import AppearCard from '@/components/animation/AppearCard';

const FeatureIcon = () => (
  <svg className="w-6 h-6 text-readowl-purple-light mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);

const Features: React.FC = () => {
  const featuresList = [
    "Editor de texto avançado com negrito, itálico, imagens e cabeçalhos.",
    "Filtros e busca inteligente para encontrar ou divulgar histórias.",
    "Biblioteca pessoal para guardar suas leituras.",
    "Sistema de avaliação justo, por notas e comentários.",
    "Artigos e tutoriais para aprimorar sua escrita.",
    "Suporte e moderação ativa para manter o ambiente saudável."
  ];

  return (
    <section className="bg-readowl-purple-dark/10 py-20">
      <div className="container mx-auto px-6">
        <AppearCard>
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
            Recursos em Destaque
          </h2>
        </AppearCard>
        <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
          {featuresList.map((feature, index) => (
            <AppearCard key={index} className="flex items-start bg-readowl-purple-medium/30 p-4" delayMs={index * 75}>
              <FeatureIcon />
              <span className="text-readowl-purple-extralight">{feature}</span>
            </AppearCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;