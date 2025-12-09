'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { submitAttendanceRequest } from '@/actions/attendance-request';
import { cn } from '@/lib/utils'; // Assuming you have a cn utility

interface UserDirectClientProps {
    sessionId: string;
    sessionName?: string; // Optional context
    sabaqName?: string;   // Optional context
}

export function UserDirectClient({ sessionId, sessionName, sabaqName }: UserDirectClientProps) {
    const [its, setIts] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState<string | null>(null); // Stores name if successful
    const [error, setError] = useState<string | null>(null);

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
                setIts(''); // Clear input
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

    if (submitted) {
        return (
            <div className="flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in duration-300">
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
                    <p className="text-xs text-zinc-500 mt-4 bg-white p-3 rounded-lg border border-zinc-200 shadow-sm">
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
        );
    }

    return (
        <Card className="w-full bg-white border-zinc-200 shadow-xl ring-1 ring-zinc-900/5">
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
                        <Input
                            placeholder="Enter 8-digit ITS"
                            className="bg-zinc-50 border-zinc-200 h-14 text-center text-xl tracking-[0.2em] font-mono text-zinc-900 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:tracking-normal placeholder:text-zinc-400 shadow-inner"
                            value={its}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                setIts(val);
                                setError(null);
                            }}
                            inputMode="numeric"
                            disabled={isSubmitting}
                        />
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
                        disabled={isSubmitting || its.length !== 8}
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            "Submit Request"
                        )}
                    </Button>

                    <p className="text-center text-xs text-zinc-400">
                        Only for enrolled members who attended the session.
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
