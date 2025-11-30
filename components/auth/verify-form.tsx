'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { generateAdminOTP, verifyAdminOTP } from '@/actions/auth-otp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ShieldCheck } from 'lucide-react';

export function VerifyForm() {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Auto-send OTP on mount
        const sendOTP = async () => {
            setSending(true);
            try {
                const result = await generateAdminOTP();
                if (result.success) {
                    toast.success('Verification code sent to your email');
                } else {
                    toast.error(result.error || 'Failed to send verification code');
                }
            } catch (error) {
                toast.error('Failed to send verification code');
            } finally {
                setSending(false);
            }
        };

        sendOTP();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length !== 6) {
            toast.error('Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        try {
            const result = await verifyAdminOTP(otp);
            if (result.success) {
                toast.success('Verification successful');
                router.push('/dashboard');
                router.refresh();
            } else {
                toast.error(result.error || 'Verification failed');
            }
        } catch (error) {
            toast.error('Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setSending(true);
        try {
            const result = await generateAdminOTP();
            if (result.success) {
                toast.success('Verification code sent');
            } else {
                toast.error(result.error || 'Failed to send code');
            }
        } catch (error) {
            toast.error('Failed to send code');
        } finally {
            setSending(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto glass-card">
            <CardHeader className="text-center">
                <div className="mx-auto mb-4 bg-primary/10 p-3 rounded-full w-fit">
                    <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Admin Verification</CardTitle>
                <CardDescription>
                    Please enter the 6-digit code sent to your email to access the dashboard.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Input
                            type="text"
                            placeholder="Enter 6-digit code"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="text-center text-2xl tracking-widest"
                            maxLength={6}
                            disabled={loading}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify Access'}
                    </Button>
                    <div className="text-center">
                        <Button
                            type="button"
                            variant="link"
                            className="text-sm text-muted-foreground"
                            onClick={handleResend}
                            disabled={sending || loading}
                        >
                            {sending ? 'Sending...' : 'Resend Code'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
