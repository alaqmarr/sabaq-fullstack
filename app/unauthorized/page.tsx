import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default async function UnauthorizedPage({
    searchParams,
}: {
    searchParams: Promise<{ reason?: string; flagged?: string }>;
}) {
    const { reason, flagged } = await searchParams;

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
            <div className="glass p-8 rounded-2xl max-w-md w-full space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center">
                    <div className="p-4 bg-destructive/10 rounded-full">
                        <ShieldAlert className="h-12 w-12 text-destructive" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-bold tracking-tight">Access Denied</h1>
                    <p className="text-muted-foreground">
                        {reason ||
                            'You do not have permission to view this page. Please contact an administrator if you believe this is an error.'}
                    </p>
                </div>

                {flagged === 'true' && (
                    <Alert variant="destructive" className="text-left">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Security Alert</AlertTitle>
                        <AlertDescription>
                            Your account has been flagged for unauthorized access attempts. This incident has been logged.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                    <Button asChild variant="default" className="w-full sm:w-auto">
                        <Link href="/dashboard">Return to Dashboard</Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full sm:w-auto">
                        <Link href="/login">Sign In as Different User</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
