import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/navbar/Navbar";
import { Breadcrumb } from "@/components/ui/navbar/Breadcrumb";


export default async function Home() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login?callbackUrl=/home");

    return (
        <>
            <Navbar />
            {/* Breadcrumb below navbar, centered (offset for fixed header) */}
            <div className="w-full flex justify-center mt-14 sm:mt-16">
                <Breadcrumb items={[]} showHome anchor="static" />
            </div>
            <main className="min-h-screen flex flex-col">
            </main>
        </>
    );
}
