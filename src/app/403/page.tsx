import Navbar from "@/components/ui/navbar/Navbar";
import LandingHeader from "@/app/landing/about/LandingHeader";
import ErrorView from "@/components/ui/error/ErrorView";
import { Breadcrumb } from "@/components/ui/navbar/Breadcrumb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export default async function Error403Page() {
  const session = await getServerSession(authOptions);
  const beforeLogin = !session; // If not logged in, show landing header/footer only
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
          message="Você não tem permissão para acessar esta página."
          imgSrc="/img/errors/403.png"
          offsetUnderNavbar={false}
        />
      </main>
    </div>
  );
}
