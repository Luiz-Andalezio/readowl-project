import Navbar from "@/components/ui/navbar/Navbar";
import LandingHeader from "@/app/landing/about/LandingHeader";
import ErrorView from "@/components/ui/error/ErrorView";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export default async function GenericErrorPage() {
  const session = await getServerSession(authOptions);
  const beforeLogin = !session;
  return (
    <div className="min-h-screen flex flex-col bg-readowl-purple-dark/10">
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
          message="Um erro inesperado ocorreu, caso persista, favor contate a administração"
          imgSrc="/img/errors/erro.png"
          offsetUnderNavbar={false}
        />
      </main>
    </div>
  );
}
