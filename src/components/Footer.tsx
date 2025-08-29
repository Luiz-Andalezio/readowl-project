import React from 'react';

const GithubIcon = () => (
  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.203 2.398.1 2.65.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
  </svg>
);

const MailIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.5" fill="none"/>
  </svg>
);

const Footer: React.FC = () => {
  return (
    <footer className="bg-readowl-purple-medium text-readowl-purple-extralight py-10">
      <div className="container mx-auto px-6 text-center">
        <div className="flex justify-center space-x-6 mb-6">
          <a href="#" className="hover:text-white">Sobre</a>
          <a href="#" className="hover:text-white">Termos de uso</a>
          <a href="#" className="hover:text-white">Política de Privacidade</a>
          <a href="#" className="hover:text-white">Ajuda</a>
          <a href="#" className="hover:text-white">Contato</a>
        </div>

        <div className="flex justify-center mb-4">
          {/* Use uma versão do logo que contraste bem com o fundo, como uma branca */}
          <img src="/img/mascot/logo.png" alt="Readowl Logo" className="h-16 w-auto" />
        </div>

        <div className="flex justify-center space-x-6 mb-6">
          <a href="https://github.com/seu-usuario/readowl-project" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            <GithubIcon />
          </a>
          <a href="mailto:contato@readowl.com" className="hover:text-white">
            <MailIcon />
          </a>
        </div>

        <p className="text-sm text-readowl-purple-extralight/80">
          © 2025 Readowl – Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
};

export default Footer;