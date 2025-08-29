import App from './landing/page';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Readowl - Cultivando literatura em qualquer lugar",
  description: "Readowl é uma plataforma gratuita para publicação e leitura de livros brasileiros. Descubra novos autores, publique suas próprias obras e faça parte de uma comunidade apaixonada por literatura."
};

export default function Home() {
  return (
    <>
      <App />
    </>
  );
}