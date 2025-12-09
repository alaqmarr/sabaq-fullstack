'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, AlertTriangle, Send, LogIn, Check, X, Clock, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { submitAttendanceRequest } from '@/actions/attendance-request';
import { approveAttendanceRequest, rejectAttendanceRequest, getSessionAttendanceRequests } from '@/actions/attendance-request-admin';
import { checkUserRoleForQuickLogin } from '@/actions/users';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { formatTime } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UserDirectClientProps {
    sessionId: string;
    sessionName?: string;
    sabaqName?: string;
    user?: any;
    isAdmin?: boolean;
    initialRequests?: any[];
}

export function UserDirectClient({
    sessionId,
    sessionName,
    sabaqName,
    user,
    isAdmin = false,
    initialRequests = []
}: UserDirectClientProps) {
    const router = useRouter();
    // State for Request Submission
    const [its, setIts] = useState(user?.itsNumber || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // State for Admin Handling
    const [requests, setRequests] = useState(initialRequests);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // State for Quick Login
    const [showQuickLogin, setShowQuickLogin] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleItsChange = useCallback(async (val: string) => {
        setIts(val);
        setError(null);
        if (val.length === 8) {
            // Check if Mumin for quick login
            const result = await checkUserRoleForQuickLogin(val);
            if (result.success && result.isMumin) {
                setShowQuickLogin(true);
            } else {
                setShowQuickLogin(false);
            }
        } else {
            setShowQuickLogin(false);
        }
    }, []);

    const handleQuickLogin = async () => {
        setIsLoggingIn(true);
        try {
            const result = await signIn('credentials', {
                itsNumber: its,
                password: its,
                redirect: false
            });

            if (result?.error) {
                toast.error("Quick login failed. Please use standard login.");
                router.push('/login');
            } else {
                toast.success("Welcome back!");
                router.refresh();
            }
        } catch (error) {
            toast.error("Login Error");
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (its.length !== 8) {
            toast.error("ITS must be 8 digits");
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSubmitted(null);

        const formData = new FormData();
        formData.append('its', its);
        formData.append('sessionId', sessionId);

        try {
            const result = await submitAttendanceRequest(formData);
            if (result.success) {
                setSubmitted(result.message || "Request Submitted");
                toast.success("Request sent successfully!");
                if (!user) {
                    setIts('');
                    setShowQuickLogin(false);
                }
            } else {
                setError(result.error || "Submission failed");
                toast.error(result.error || "Submission failed");
            }
        } catch (e) {
            setError("Network or system error");
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleApprove = async (req: any) => {
        setProcessingId(req.id);
        try {
            const result = await approveAttendanceRequest(req.id, sessionId, req.itsNumber);
            if (result.success) {
                toast.success("Request Approved");
                setRequests(prev => prev.filter(r => r.id !== req.id));
            } else {
                toast.error(result.error);
            }
        } catch (err) {
            toast.error("Failed to approve");
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (reqId: string) => {
        setProcessingId(reqId);
        try {
            const result = await rejectAttendanceRequest(reqId);
            if (result.success) {
                toast.success("Request Rejected");
                setRequests(prev => prev.filter(r => r.id !== reqId));
            } else {
                toast.error(result.error);
            }
        } catch (err) {
            toast.error("Failed to reject");
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-8 w-full">
            {/* 1. Request Submission Card */}
            {!submitted ? (
                <Card className="w-full bg-white border-zinc-200 shadow-xl ring-1 ring-zinc-900/5 transition-all duration-300">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 mb-4 shadow-sm ring-1 ring-indigo-100">
                            <Send className="h-6 w-6 ml-0.5" />
                        </div>
                        <CardTitle className="text-xl sm:text-2xl font-bold text-zinc-900">
                            Attendance Request
                        </CardTitle>
                        <CardDescription className="text-zinc-500">
                            {sabaqName ? (
                                <>Marking for <span className="text-indigo-600 font-semibold">{sabaqName}</span></>
                            ) : (
                                "Forgot to mark attendance?"
                            )}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                {user ? (
                                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-center">
                                        <p className="text-xs text-indigo-400 font-medium mb-1">LOGGED IN AS</p>
                                        <p className="text-lg font-bold text-indigo-700">{user.name}</p>
                                        <p className="text-sm font-mono text-indigo-500">{user.itsNumber}</p>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <Input
                                            placeholder="Enter 8-digit ITS"
                                            className="bg-zinc-50 border-zinc-200 h-14 text-center text-xl tracking-[0.2em] font-mono text-zinc-900 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:tracking-normal placeholder:text-zinc-400 shadow-inner"
                                            value={its}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                handleItsChange(val);
                                            }}
                                            inputMode="numeric"
                                            disabled={isSubmitting || isLoggingIn}
                                            autoFocus
                                        />
                                        {/* Quick Login Button Override */}
                                        {showQuickLogin && (
                                            <div className="absolute right-2 top-2 bottom-2">
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-full bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-medium px-3 animate-in fade-in slide-in-from-right-2"
                                                    onClick={handleQuickLogin}
                                                    disabled={isLoggingIn}
                                                >
                                                    {isLoggingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : "Quick Login"}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {error && (
                                    <div className="flex items-center gap-2 text-red-600 text-sm justify-center bg-red-50 p-2 rounded border border-red-100 animate-in fade-in slide-in-from-top-1">
                                        <AlertTriangle className="h-4 w-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200 transition-all hover:shadow-xl hover:shadow-indigo-300"
                                disabled={isSubmitting || its.length !== 8 || isLoggingIn}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    "Submit Request"
                                )}
                            </Button>

                            {!user && (
                                <p className="text-center text-xs text-zinc-400">
                                    Only for enrolled members who attended the session.
                                </p>
                            )}
                        </form>
                    </CardContent>

                    {/* Login Prompt for Guest Users */}
                    {!user && !showQuickLogin && (
                        <CardFooter className="bg-zinc-50/50 border-t border-zinc-100 p-4 flex flex-col gap-3">
                            <div className="flex items-start gap-3 w-full">
                                <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                    <LogIn className="h-4 w-4" />
                                </div>
                                <div className="space-y-1 text-sm flex-1">
                                    <p className="font-medium text-zinc-700">Not logged in?</p>
                                    <p className="text-zinc-500 leading-snug">
                                        Log in to view your history. Default credentials:
                                    </p>
                                    <div className="bg-white border border-zinc-200 rounded p-2 text-xs font-mono text-zinc-600 mt-1 inline-block">
                                        User: {its || 'YOUR_ITS'} <br />
                                        Pass: {its || 'YOUR_ITS'}
                                    </div>
                                    <div className="pt-2">
                                        <Button variant="link" asChild className="p-0 h-auto text-blue-600 font-medium">
                                            <Link href="/login">Go to Login &rarr;</Link>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardFooter>
                    )}
                </Card>
            ) : (
                <div className="w-full bg-white border-zinc-200 shadow-xl ring-1 ring-zinc-900/5 rounded-xl p-8 flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-300">
                    <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center text-green-600 border border-green-200 shadow-xl">
                        <CheckCircle className="h-12 w-12" />
                    </div>
                    <div className="text-center space-y-2">
                        <h2 className="text-2xl font-bold text-zinc-800">
                            Success!
                        </h2>
                        <p className="text-zinc-600 max-w-xs mx-auto font-medium">
                            {submitted}
                        </p>
                        <p className="text-xs text-zinc-500 mt-4 bg-zinc-50 p-3 rounded-lg border border-zinc-200 shadow-sm">
                            Your attendance request is pending admin approval.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => { setSubmitted(null); setError(null); }}
                        className="mt-4 border-zinc-300 hover:bg-zinc-50 text-zinc-700"
                    >
                        Submit Another
                    </Button>
                </div>
            )}

            {/* 2. Admin Request Management Table */}
            {isAdmin && requests.length > 0 && (
                <Card className="w-full bg-white border-zinc-200 shadow-xl ring-1 ring-zinc-900/5 overflow-hidden animate-in slide-in-from-bottom-5">
                    <CardHeader className="bg-zinc-50/80 border-b border-zinc-100 pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-indigo-600" />
                                <CardTitle className="text-lg font-bold text-zinc-900">
                                    Pending Requests
                                </CardTitle>
                            </div>
                            <Badge variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                                {requests.length} Pending
                            </Badge>
                        </div>
                    </CardHeader>
                    <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto">
                        {requests.map((req) => (
                            <div key={req.id} className="p-4 flex items-center justify-between gap-3 hover:bg-zinc-50/50 transition-colors">
                                <div className="min-w-0">
                                    <p className="font-semibold text-zinc-900 truncate">{req.user.name}</p>
                                    <div className="flex items-center gap-3 text-xs text-zinc-500 mt-0.5">
                                        <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200">{req.itsNumber}</span>
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {formatTime(new Date(req.requestedAt))}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-9 w-9 border-green-200 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                                        onClick={() => handleApprove(req)}
                                        disabled={!!processingId}
                                    >
                                        {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-9 w-9 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                        onClick={() => handleReject(req.id)}
                                        disabled={!!processingId}
                                    >
                                        {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            )}
        </div>
    );
}
