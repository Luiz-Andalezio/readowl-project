"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Button from '../../../components/ui/button/Button';
import PolicyDropdown from '../../../components/sections/PolicyDropdown';

const Header: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-readowl-purple-medium shadow-sm">
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Image src="/icon.png" alt="Readowl Logo" width={50} height={50} className="h-10 w-auto" />
          <span className="text-2xl font-bold text-readowl-purple-extralight">Readowl</span>
        </div>
        {/* Desktop menu */}
        <div className="hidden md:flex items-center space-x-6 text-readowl-purple-extralight">
          <Link href="/landing" className="hover:text-white">Sobre</Link>
          <Link href="/landing/help" className="hover:text-white">Ajuda</Link>
          <Link href="/landing/contact" className="hover:text-white">Contato</Link>
          <PolicyDropdown />
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <Link href="/login">
            <Button variant="primary">Logar</Button>
          </Link>
          <Link href="/register">
            <Button variant="secondary">Cadastrar</Button>
          </Link>
        </div>
        {/* Mobile menu button */}
        <div className="md:hidden flex items-center">
          <button
            aria-label="Abrir menu"
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-readowl-purple-extralight focus:outline-none"
          >
            <svg width="28" height="28" fill="none" viewBox="0 0 24 24">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </nav>
      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="md:hidden bg-readowl-purple-medium shadow-lg px-6 py-4">
          <div className="flex flex-col space-y-2 mb-4">
            <Link href="/login">
              <Button variant="primary" className="w-full">Logar</Button>
            </Link>
            <Link href="/register">
              <Button variant="secondary" className="w-full">Cadastrar</Button>
            </Link>
          </div>
          <div className="flex flex-col space-y-2 text-readowl-purple-extralight">
            <Link href="/landing" className="hover:text-white">Sobre</Link>
            {/* Mobile: show simple links instead of dropdown for accessibility */}
            <Link href="/landing/terms" className="hover:text-white">Termos</Link>
            <Link href="/landing/privacy" className="hover:text-white">Privacidade</Link>
            <Link href="/landing/licenses" className="hover:text-white">Licenças</Link>
            <Link href="/landing/help" className="hover:text-white">Ajuda</Link>
            <Link href="/landing/contact" className="hover:text-white">Contato</Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;