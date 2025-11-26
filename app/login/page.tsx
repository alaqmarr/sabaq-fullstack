import { redirect } from 'next/navigation';
import { checkSetupRequired } from '@/actions/setup';
import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ setup?: string }>;
}) {
    // Check if initial setup is required
    const setupCheck = await checkSetupRequired();

    if (setupCheck.success && setupCheck.setupRequired) {
        // No SuperAdmin exists, redirect to setup
        redirect('/setup');
    }

    // Await searchParams as it's a Promise in Next.js 15+
    const params = await searchParams;

    return (
        <div className="flex items-center justify-center min-h-screen p-4 animate-fade-in">
            <LoginForm setupComplete={params.setup === 'complete'} />
        </div>
    );
}
