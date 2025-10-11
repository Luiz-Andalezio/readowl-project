import LandingHeader from "../about/LandingHeader";
import Link from "next/link";
import AppearCard from "@/components/animation/AppearCard";

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col bg-readowl-purple-dark/10">
      <LandingHeader />
      <main className="container mx-auto px-6 py-10 text-readowl-purple-medium">
        <h1 className="text-3xl font-bold text-white mb-8">Contato</h1>
        <AppearCard className="mb-8">
          <p className="text-readowl-purple-extralight">
            Fale com a equipe do Readowl para suporte, sugestões e parcerias.
          </p>
        </AppearCard>

        <section className="grid md:grid-cols-2 gap-6">
          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={0}>
            <h2 className="text-xl font-semibold text-white mb-2">E-mail</h2>
            <p className="text-readowl-purple-extralight">Escreva para <a href="mailto:readowl25@gmail.com" className="underline hover:text-white">readowl25@gmail.com</a>.</p>
          </AppearCard>

          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={100}>
            <h2 className="text-xl font-semibold text-white mb-2">Quando usar</h2>
            <ul className="list-disc pl-6 text-readowl-purple-extralight space-y-1">
              <li>Relatar bugs ou problemas técnicos</li>
              <li>Enviar sugestões de melhorias e novas funcionalidades</li>
              <li>Consultas sobre parcerias e colaboração</li>
              <li>Dúvidas gerais sobre o uso da plataforma</li>
            </ul>
          </AppearCard>

          <AppearCard className="bg-readowl-purple-medium/30 p-6" delayMs={200}>
            <h2 className="text-xl font-semibold text-white mb-2">Segurança</h2>
            <p className="text-readowl-purple-extralight">Para reportar vulnerabilidades de segurança, siga nossa <Link href="/landing/security" className="underline hover:text-white">política de segurança</Link>.</p>
          </AppearCard>
        </section>
      </main>
    </div>
  );
}
