import React from 'react';
import Image from 'next/image';
import Button from './ui/Button';

const Header: React.FC = () => {
  return (
    <header className="bg-readowl-purple-medium shadow-sm">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <img src="/img/mascot/logo.png" alt="Readowl Logo" className="h-10 w-auto" />
          <span className="text-2xl font-bold text-readowl-purple-extralight">Readowl</span>
        </div>
        <div className="hidden md:flex items-center space-x-6 text-readowl-purple-extralight">
          <a href="#" className="hover:text-white">Sobre</a>
          <a href="#" className="hover:text-white">Termos de uso</a>
          <a href="#" className="hover:text-white">Política de Privacidade</a>
          <a href="#" className="hover:text-white">Ajuda</a>
          <a href="#" className="hover:text-white">Contato</a>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="primary">Logar</Button>
          <Button variant="secondary">Cadastrar</Button>
        </div>
      </nav>
    </header>
  );
};

export default Header;