import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Navbar from '@/components/ui/Navbar';
import CreateBookForm from '@/app/library/create/fragments/CreateBookForm';

export default async function CreateBookPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect('/login?callbackUrl=/library/create');

    return (
        <>
            <Navbar />
            <main className="min-h-screen pt-4 pb-20">
                <div className="flex justify-center items-start">
                    <CreateBookForm />
                </div>
            </main>
        </>
    );
}