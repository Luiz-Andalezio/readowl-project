import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import TopBar from "@/components/test/TopBar";

export default async function Home() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login?callbackUrl=/home");

    return (
        <main className="min-h-screen flex flex-col bg-readowl-purple-extralight">
            {/* TopBar with user data */}
            <TopBar />
        </main>
    );
}
