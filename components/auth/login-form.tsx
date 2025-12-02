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
import { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import Image from 'next/image';

function LoginButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant="frosted-blue" className="w-full" disabled={pending}>
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    logging in...
                </>
            ) : (
                'login'
            )}
        </Button>
    );
}

export function LoginForm({ setupComplete }: { setupComplete?: boolean }) {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined);
    const [guestIts, setGuestIts] = useState('');
    const [isGuestLoading, setIsGuestLoading] = useState(false);
    const router = useRouter();

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

    const handleGuestContinue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (guestIts.length !== 8) {
            toast.error('Please enter a valid 8-digit ITS number');
            return;
        }
        setIsGuestLoading(true);

        // Import dynamically to avoid circular deps if any, or just use the imported action
        const { loginAsGuest } = await import('@/actions/auth');
        const result = await loginAsGuest(guestIts);

        if (result && !result.success) {
            toast.error(result.error);
            setIsGuestLoading(false);
        }
    };

    return (
        <GlassCard className="w-full max-w-md border-white/20 dark:border-white/10 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            <CardHeader className="text-center space-y-2 pb-2">
                <div className="relative mx-auto h-16 w-16 rounded-xl bg-white/10 flex items-center justify-center overflow-hidden mb-2 shadow-lg shadow-black/5 ring-1 ring-white/20">
                    <Image src="/logo.jpg" alt="Logo" fill className="object-contain" sizes="64px" />
                </div>
                <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 lowercase">
                    salaams
                </CardTitle>
                <CardDescription className="text-base font-medium text-foreground/80">
                    Umoor Taalimiyah Secunderabad
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                {setupComplete && (
                    <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950/30">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-600 dark:text-green-400">
                            Initial setup completed successfully! You can now log in.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Guest Flow */}
                <div className="space-y-3">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Continue as Guest
                    </Label>
                    <form onSubmit={handleGuestContinue} className="flex gap-2">
                        <Input
                            placeholder="Enter ITS Number"
                            value={guestIts}
                            onChange={(e) => setGuestIts(e.target.value.replace(/\D/g, '').slice(0, 8))}
                            className="flex-1 text-center tracking-widest"
                            maxLength={8}
                        />
                        <Button
                            type="submit"
                            variant="frosted-green"
                            size="icon"
                            disabled={guestIts.length !== 8 || isGuestLoading}
                            title="Continue"
                        >
                            {isGuestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                        </Button>
                    </form>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t border-border/50" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background/50 backdrop-blur-sm px-2 text-muted-foreground">
                            or login
                        </span>
                    </div>
                </div>

                {/* Login Form */}
                <form action={dispatch} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="itsNumber" className="lowercase">its number</Label>
                        <Input
                            id="itsNumber"
                            name="itsNumber"
                            type="text"
                            placeholder="12345678"
                            required
                            minLength={8}
                            maxLength={8}
                            className="tracking-widest"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password" className="lowercase">password</Label>
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
            <CardFooter className="justify-center pt-2 pb-6">
                <p className="text-xs text-center text-muted-foreground max-w-[200px]">
                    For login issues, please contact your administrator.
                </p>
            </CardFooter>
        </GlassCard>
    );
}
