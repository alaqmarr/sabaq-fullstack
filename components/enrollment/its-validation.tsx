'use client';

import { useState, useEffect } from 'react';
import { validateITSNumber } from '@/actions/public-enrollment';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, UserCheck, AlertTriangle, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface ITSValidationProps {
    onValidated?: (user: any) => void;
    initialIts?: string;
    initialError?: string;
}

export function ITSValidation({ onValidated, initialIts, initialError }: ITSValidationProps) {
    const [itsNumber, setItsNumber] = useState(initialIts || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(initialError || '');
    const [notFound, setNotFound] = useState(false);

    // Auto-validate if initialIts is provided
    useEffect(() => {
        if (initialIts && initialIts.length === 8) {
            validate(initialIts);
        }
    }, [initialIts]);

    const validate = async (its: string) => {
        setError('');
        setNotFound(false);
        setLoading(true);

        const result = await validateITSNumber(its);

        if (result.success && result.user) {
            if (onValidated) {
                onValidated(result.user);
            } else {
                // If no callback, we assume this is the guest flow and set the cookie
                // Import dynamically to avoid circular deps if any
                const { loginAsGuest } = await import('@/actions/auth');
                await loginAsGuest(its);
            }
        } else {
            setError(result.error || 'Validation failed');
            if (result.notFound) {
                setNotFound(true);
            }
        }

        setLoading(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await validate(itsNumber);
    };

    const whatsappMessage = encodeURIComponent(
        `Hello, I'm trying to enroll for Sabaq but my ITS Number (${itsNumber}) is not found in the system. Error: ${error}. Please help me register.`
    );
    const whatsappLink = `https://wa.me/919618443558?text=${whatsappMessage}`;

    if (notFound) {
        return (
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <div className="flex items-center justify-center mb-4">
                        <div className="p-3 bg-red-100 dark:bg-red-900 rounded-full">
                            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                    <CardTitle className="text-center text-2xl">ITS Number Not Found</CardTitle>
                    <CardDescription className="text-center">
                        We couldn't find your ITS Number in our system
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Alert variant="destructive">
                        <AlertDescription>
                            <strong>Error:</strong> {error}
                            <br />
                            <strong>ITS Number:</strong> {itsNumber}
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                        <p className="text-center text-muted-foreground">
                            This could mean:
                        </p>
                        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                            <li>Your ITS Number hasn't been added to the system yet</li>
                            <li>There might be a typo in the ITS Number you entered</li>
                            <li>Your account hasn't been created by an administrator</li>
                        </ul>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={() => {
                                setNotFound(false);
                                setError('');
                                setItsNumber('');
                            }}
                            variant="outline"
                            className="w-full"
                        >
                            Try Again
                        </Button>

                        <Button
                            asChild
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="mr-2 h-4 w-4" />
                                Contact Admin on WhatsApp
                            </a>
                        </Button>
                    </div>

                    <p className="text-xs text-center text-muted-foreground">
                        The admin will receive your ITS Number and error details automatically
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-md mx-auto">
            <CardHeader>
                <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <UserCheck className="h-8 w-8 text-primary" />
                    </div>
                </div>
                <CardTitle className="text-center text-2xl">Welcome to Sabaq Enrollment</CardTitle>
                <CardDescription className="text-center">
                    Enter your ITS Number to view available sabaqs
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && !notFound && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="itsNumber">ITS Number</Label>
                        <Input
                            id="itsNumber"
                            type="text"
                            placeholder="Enter 8-digit ITS number"
                            value={itsNumber}
                            onChange={(e) => setItsNumber(e.target.value.replace(/\D/g, '').slice(0, 8))}
                            maxLength={8}
                            required
                            disabled={loading}
                            autoFocus
                            className="text-center text-lg"
                        />
                    </div>

                    <Button type="submit" className="w-full" disabled={loading || itsNumber.length !== 8}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Validating...
                            </>
                        ) : (
                            'Continue'
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="text-primary hover:underline">
                            Login here
                        </Link>
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
