import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/Navbar";


export default async function Notifications() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login?callbackUrl=/home");

    return (
        <>
            <Navbar />
            <main className="min-h-screen flex flex-col">
            </main>
        </>
    );
}