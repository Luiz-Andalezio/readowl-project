import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import FloatingNavbar from '@/components/ui/FloatingNavbar';
import DevTools from '@/components/dev/DevTools';
import CreateBookForm from '@/components/ui/CreateBookForm';

export default async function CreateBookPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user) redirect('/login?callbackUrl=/library/create');

    return (
        <>
            <FloatingNavbar />
            <main className="min-h-screen bg-readowl-purple-extralight pt-4 pb-20">
                <DevTools />
                <div className="flex justify-center items-start">
                    <CreateBookForm />
                </div>
            </main>
        </>
    );
}