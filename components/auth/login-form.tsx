'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { authenticate } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GlassCard } from '@/components/ui/glass-card';
import { CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

function LoginButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full rounded-full shadow-lg shadow-primary/25" disabled={pending}>
            {pending ? 'Logging in...' : 'Login'}
        </Button>
    );
}

export function LoginForm({ setupComplete }: { setupComplete?: boolean }) {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined);

    useEffect(() => {
        if (errorMessage) {
            toast.error(errorMessage);
        }
    }, [errorMessage]);

    useEffect(() => {
        if (setupComplete) {
            toast.success('Setup complete! Please log in with your new account.');
        }
    }, [setupComplete]);

    return (
        <GlassCard className="w-full max-w-md border-white/20 dark:border-white/10">
            <CardHeader>
                <CardTitle className="text-2xl text-center">Sabaq Login</CardTitle>
                <CardDescription className="text-center">
                    Enter your ITS Number and password to access the system.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {setupComplete && (
                    <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-600 dark:text-green-400">
                            Initial setup completed successfully! You can now log in.
                        </AlertDescription>
                    </Alert>
                )}
                <form action={dispatch} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="itsNumber">ITS Number</Label>
                        <Input
                            id="itsNumber"
                            name="itsNumber"
                            type="text"
                            placeholder="12345678"
                            required
                            minLength={8}
                            maxLength={8}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            required
                            minLength={6}
                        />
                    </div>
                    <LoginButton />
                </form>
            </CardContent>
            <CardFooter className="justify-center">
                <p className="text-sm text-muted-foreground">
                    Default password is your ITS Number.
                </p>
            </CardFooter>
        </GlassCard>
    );
}
