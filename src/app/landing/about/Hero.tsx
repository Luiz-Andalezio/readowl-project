"use client";
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import Button from '@/components/ui/button/Button';

const Hero: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <section className="relative bg-readowl-purple-extralight min-h-[100svh] flex items-center overflow-hidden pb-20">
      <div className="container mx-auto px-6 py-10 md:py-16 flex flex-col md:flex-row items-center gap-6 md:gap-10">
        <div className={`md:w-1/2 flex justify-center mb-6 md:mb-0 transform transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Image
            src="/img/mascot/body.png"
            alt="Mascote Readowl"
            width={420}
            height={420}
            className="w-52 sm:w-64 md:w-[20rem] lg:w-[22rem] xl:w-[24rem] h-auto"
            priority
          />
        </div>

        <div className={`md:w-1/2 text-center md:text-left transform transition-all duration-700 delay-150 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h5 className="text-3xl sm:text-4xl md:text-5xl font-medium text-readowl-purple-dark">
            Seja bem-vindo ao <br />
          </h5>
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-8xl font-black text-readowl-purple-dark"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            <strong>Readowl</strong>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-readowl-purple-dark italic">
            “Cultivando literatura em qualquer lugar.”
          </p>
          <p className="mt-6 text-base sm:text-lg md:text-lg text-readowl-purple-dark/90 max-w-2xl">
            Democratizando a cultura, o Readowl torna a leitura e a escrita acessíveis a todos: autores podem publicar gratuitamente suas obras e leitores têm a chance de explorar novos universos. Junte-se a uma comunidade dedicada a valorizar a literatura do Brasil!
          </p>
          <div className="mt-8 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            <Link href="/home">
              <Button variant="primary" className="text-base sm:text-lg md:text-xl px-7 py-4">Iniciar Leitura</Button>
            </Link>
            <Link href="/library/create">
              <Button variant="primary" className="text-base sm:text-lg md:text-xl px-7 py-4">Criar uma nova obra</Button>
            </Link>
          </div>
        </div>
      </div>
      {/* Decorative gradient background behind content */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_rgba(255,255,255,0.06),_transparent_50%),radial-gradient(ellipse_at_bottom,_rgba(0,0,0,0.25),_transparent_60%)]" />
    </section>
  );
};

export default Hero;