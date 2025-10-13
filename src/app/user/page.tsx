import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";
import { redirect } from "next/navigation";
import Navbar from "@/components/ui/navbar/Navbar";
import { BreadcrumbAuto } from "@/components/ui/Breadcrumb";


export default async function Account() {
    const session = await getServerSession(authOptions);
    if (!session) redirect("/login?callbackUrl=/home");

    return (
        <>
            <Navbar />
            <div className="w-full flex justify-center mt-14 sm:mt-16">
                <BreadcrumbAuto anchor="static" base="/home" labelMap={{ user: "Conta" }} />
            </div>
            <main className="min-h-screen flex flex-col">
            </main>
        </>
    );
}
