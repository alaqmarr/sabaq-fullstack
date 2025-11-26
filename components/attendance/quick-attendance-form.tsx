'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { markAttendanceManual } from '@/actions/attendance';
import { prisma } from '@/lib/prisma';
import { toast } from 'sonner';
import { CheckCircle, Clock, User, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface QuickAttendanceFormProps {
    sessionId: string;
    sessionStartTime: Date;
    onSuccess?: () => void;
}

export function QuickAttendanceForm({ sessionId, sessionStartTime, onSuccess }: QuickAttendanceFormProps) {
    const [itsInput, setItsInput] = useState('');
    const [userName, setUserName] = useState('');
    const [isLate, setIsLate] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lookingUp, setLookingUp] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    // Auto-lookup user when 8 digits entered
    useEffect(() => {
        const lookupUser = async () => {
            if (itsInput.length === 8 && /^\d{8}$/.test(itsInput)) {
                setLookingUp(true);
                try {
                    const response = await fetch(`/api/users/lookup?itsNumber=${itsInput}`);
                    const data = await response.json();

                    if (data.success && data.user) {
                        setUserName(data.user.name);

                        // Auto-detect late (more than 15 mins after start)
                        const now = new Date();
                        const startTime = new Date(sessionStartTime);
                        const diffMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
                        setIsLate(diffMinutes > 15);
                    } else {
                        setUserName('');
                        toast.error('User not found');
                    }
                } catch (error) {
                    console.error('Lookup failed:', error);
                    setUserName('');
                } finally {
                    setLookingUp(false);
                }
            } else {
                setUserName('');
                setIsLate(false);
            }
        };

        lookupUser();
    }, [itsInput, sessionStartTime]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!itsInput || itsInput.length !== 8) {
            toast.error('Please enter a valid 8-digit ITS number');
            return;
        }

        if (!userName) {
            toast.error('User not found');
            return;
        }

        setLoading(true);

        try {
            const result = await markAttendanceManual(sessionId, itsInput);

            if (result.success) {
                const status = isLate ? 'LATE' : 'ON_TIME';
                toast.success(
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        <div>
                            <div className="font-semibold">{userName}</div>
                            <div className="text-xs">{status === 'LATE' ? 'Marked as Late' : 'Marked On Time'}</div>
                        </div>
                    </div>
                );

                // Auto-reset form
                setItsInput('');
                setUserName('');
                setIsLate(false);

                // Focus input for next entry
                inputRef.current?.focus();

                // Refresh data
                router.refresh();
                onSuccess?.();
            } else {
                toast.error(result.error || 'Failed to mark attendance');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="glass">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Quick Attendance Entry
                </CardTitle>
                <CardDescription>Enter ITS number - System auto-detects late/on-time status</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="its-input">ITS Number</Label>
                        <Input
                            ref={inputRef}
                            id="its-input"
                            type="text"
                            inputMode="numeric"
                            pattern="\d{8}"
                            maxLength={8}
                            value={itsInput}
                            onChange={(e) => setItsInput(e.target.value.replace(/\D/g, ''))}
                            placeholder="Enter 8 digits"
                            className="text-2xl font-mono text-center tracking-widest"
                            autoFocus
                            disabled={loading}
                        />

                        {/* User Info Display */}
                        {lookingUp && (
                            <div className="flex items-center justify-center gap-2 py-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span className="text-sm">Looking up...</span>
                            </div>
                        )}

                        {userName && !lookingUp && (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <User className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-semibold">{userName}</div>
                                        <div className="text-xs text-muted-foreground">{itsInput}</div>
                                    </div>
                                </div>
                                <Badge variant={isLate ? 'destructive' : 'default'} className="shrink-0">
                                    {isLate ? (
                                        <>
                                            <Clock className="h-3 w-3 mr-1" />
                                            Late
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-3 w-3 mr-1" />
                                            On Time
                                        </>
                                    )}
                                </Badge>
                            </div>
                        )}
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={loading || !userName || itsInput.length !== 8}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Marking...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Mark Attendance
                            </>
                        )}
                    </Button>

                    <p className="text-xs text-center text-muted-foreground">
                        Form will auto-reset after submission for quick successive entries
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
