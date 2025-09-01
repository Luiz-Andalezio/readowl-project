import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import DevTools from "@/components/dev/DevTools";
import FloatingNavbar from "@/components/ui/FloatingNavbar";


export default async function Notifications() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login?callbackUrl=/home");

    return (
        <>
            <FloatingNavbar />
            <main className="min-h-screen flex flex-col bg-readowl-purple-extralight">
                <DevTools />
            </main>
        </>
    );
}