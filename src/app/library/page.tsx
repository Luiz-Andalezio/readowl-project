import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import DevTools from "@/components/dev/DevTools";
import FloatingNavbar from "@/components/ui/FloatingNavbar";
import ButtonWithIcon from "@/components/ui/ButtonWithIcon";

export default async function Library() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login?callbackUrl=/home");

    return (
        <>
            <FloatingNavbar />
            <main className="min-h-screen bg-readowl-purple-extralight">
                <DevTools />
                <div className="flex justify-center items-start pt-8">
                    <ButtonWithIcon
                        variant="primary"
                        iconUrl="/img/svg/library/book1.svg"
                        iconAlt="Livro"
                    >
                        Registrar uma obra
                    </ButtonWithIcon>
                </div>
            </main>
        </>
    );
}
