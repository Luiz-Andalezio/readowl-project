import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { redirect } from 'next/navigation';
import Navbar from '@/components/ui/navbar/Navbar';
import CreateBookForm from '@/app/library/create/ui/CreateBookForm';
import { BreadcrumbAuto } from '@/components/ui/navbar/Breadcrumb';

export default async function CreateBookPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect('/login?callbackUrl=/library/create');

    return (
        <>
            <Navbar />
            <main className="min-h-screen pb-6">
                <div className="w-full flex justify-center mt-14 sm:mt-16">
                    <BreadcrumbAuto anchor="static" base="/home" labelMap={{ library: 'Biblioteca', create: 'Criar' }} />
                </div>
                <div className="flex justify-center items-start">
                    <CreateBookForm />
                </div>
            </main>
        </>
    );
}