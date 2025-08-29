"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Button from './ui/Button';

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-readowl-purple-medium shadow-sm">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Image src="/img/mascot/logo.png" alt="Readowl Logo" width={50} height={50} className="h-10 w-auto" />
          <span className="text-2xl font-bold text-readowl-purple-extralight">Readowl</span>
        </div>
        {/* Desktop menu */}
        <div className="hidden md:flex items-center space-x-6 text-readowl-purple-extralight">
          <a href="#" className="hover:text-white">Sobre</a>
          <a href="#" className="hover:text-white">Termos de uso</a>
          <a href="#" className="hover:text-white">Política de Privacidade</a>
          <a href="#" className="hover:text-white">Ajuda</a>
          <a href="#" className="hover:text-white">Contato</a>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <Button variant="primary">Logar</Button>
          <Button variant="secondary">Cadastrar</Button>
        </div>
        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-readowl-purple-extralight focus:outline-none"
          >
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
        </div>
      </nav>
      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-readowl-purple-medium shadow-lg px-6 py-4">
          <div className="flex flex-col space-y-2 mb-4">
            <Button variant="primary" className="w-full">Logar</Button>
            <Button variant="secondary" className="w-full">Cadastrar</Button>
          </div>
          <div className="flex flex-col space-y-2 text-readowl-purple-extralight">
            <a href="#" className="hover:text-white">Sobre</a>
            <a href="#" className="hover:text-white">Termos de uso</a>
            <a href="#" className="hover:text-white">Política de Privacidade</a>
            <a href="#" className="hover:text-white">Ajuda</a>
            <a href="#" className="hover:text-white">Contato</a>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;