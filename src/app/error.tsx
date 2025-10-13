"use client";
import React from "react";
import Navbar from "@/components/ui/navbar/Navbar";
import LandingHeader from "@/app/landing/about/LandingHeader";
import Footer from "@/components/sections/Footer";
import ErrorView from "@/components/ui/error/ErrorView";
import { useSession } from "next-auth/react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { data: session } = useSession();
  const beforeLogin = !session;
  return (
    <html>
      <body className="min-h-screen flex flex-col bg-readowl-purple-dark/10">
        {beforeLogin ? <LandingHeader /> : <Navbar />}
        <main>
          {!beforeLogin && (
            <div className="mt-14 sm:mt-16">
              <div className="container mx-auto px-4">
                <div className="flex justify-center">
                  <Breadcrumb items={[{ label: "Erro" }]} showHome anchor="static" />
                </div>
              </div>
            </div>
          )}
          <ErrorView
            message="Um erro inesperado ocorreu, caso persista, favor contate a administração."
            imgSrc="/img/errors/erro.png"
            offsetUnderNavbar={false}
          />
          {error?.digest ? (
            <p className="sr-only">Digest: {error.digest}</p>
          ) : null}
          <div className="text-center mt-4">
            <button onClick={reset} className="px-4 py-2 text-sm mb-6 font-medium bg-white/10 hover:bg-white/20 text-white transition">Tentar novamente</button>
          </div>
        </main>
        {beforeLogin ? <Footer /> : null}
      </body>
    </html>
  );
}
