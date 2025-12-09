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
                <div className="h-24 w-24 bg-green-500/10 rounded-full flex items-center justify-center text-green-500 border border-green-500/20 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                    <CheckCircle className="h-12 w-12" />
                </div>
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Success!
                    </h2>
                    <p className="text-gray-400 max-w-xs mx-auto">
                        {submitted}
                    </p>
                    <p className="text-xs text-gray-500 mt-4 bg-white/5 p-3 rounded-lg border border-white/5">
                        Your attendance request is pending admin approval.
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => { setSubmitted(null); setError(null); }}
                    className="mt-4 border-white/10 hover:bg-white/5"
                >
                    Submit Another
                </Button>
            </div>
        );
    }

    return (
        <Card className="w-full bg-black/40 border-white/10 backdrop-blur-md shadow-2xl">
            <CardHeader className="text-center pb-2">
                <div className="mx-auto h-12 w-12 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 mb-4 ring-1 ring-indigo-500/20">
                    <Send className="h-6 w-6 ml-0.5" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    Attendance Request
                </CardTitle>
                <CardDescription className="text-gray-400">
                    {sabaqName ? (
                        <>Marking for <span className="text-indigo-400 font-medium">{sabaqName}</span></>
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
                            className="bg-black/50 border-white/10 h-14 text-center text-xl tracking-[0.2em] font-mono focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all placeholder:tracking-normal placeholder:text-base"
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
                            <div className="flex items-center gap-2 text-red-400 text-sm justify-center bg-red-500/10 p-2 rounded border border-red-500/20 animate-in fade-in slide-in-from-top-1">
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]"
                        disabled={isSubmitting || its.length !== 8}
                    >
                        {isSubmitting ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            "Submit Request"
                        )}
                    </Button>

                    <p className="text-center text-xs text-gray-500">
                        Only for enrolled members who attended the session.
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
