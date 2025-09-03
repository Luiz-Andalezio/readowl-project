import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import FloatingNavbar from "@/components/ui/FloatingNavbar";


export default async function Home() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login?callbackUrl=/home");

    return (
        <>
            <FloatingNavbar />
            <main className="min-h-screen flex flex-col bg-readowl-purple-extralight">
            </main>
        </>
    );
}
