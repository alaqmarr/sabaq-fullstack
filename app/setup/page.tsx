import { redirect } from 'next/navigation';
import { checkSetupRequired } from '@/actions/setup';
import { SetupForm } from '@/components/setup/setup-form';

export default async function SetupPage() {
    const result = await checkSetupRequired();

    // If setup is not required (SuperAdmin exists), redirect to login
    if (result.success && !result.setupRequired) {
        redirect('/login');
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 p-4">
            <div className="w-full max-w-lg">
                <div className="text-center mb-8">
                    <h1 className="text-3xl sm:text-4xl font-bold mb-2">Sabaq System</h1>
                    <p className="text-muted-foreground">Welcome! Let's set up your account.</p>
                </div>
                <SetupForm />
            </div>
        </div>
    );
}
