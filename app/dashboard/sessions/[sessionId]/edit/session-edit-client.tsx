'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, AlertTriangle, Clock } from 'lucide-react';
import { updateSession } from '@/actions/sessions';
import { toast } from 'sonner';
import { formatISODate, formatISOTime } from '@/lib/date-utils';

interface SessionEditClientProps {
    sessionId: string;
    sabaqName: string;
    sabaqId: string;
    currentScheduledAt: string;
    currentCutoffTime: string;
    isActive: boolean;
    isEnded: boolean;
}

export function SessionEditClient({
    sessionId,
    sabaqName,
    sabaqId,
    currentScheduledAt,
    currentCutoffTime,
    isActive,
    isEnded,
}: SessionEditClientProps) {
    const router = useRouter();

    // Parse current values to local date/time inputs
    const scheduledDate = new Date(currentScheduledAt);
    const cutoffDate = new Date(currentCutoffTime);

    const [date, setDate] = useState(formatISODate(scheduledDate));
    const [startTime, setStartTime] = useState(formatISOTime(scheduledDate));
    const [cutoffTime, setCutoffTime] = useState(formatISOTime(cutoffDate));
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!date || !startTime || !cutoffTime) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            // Combine date + time into ISO strings (IST)
            // We need to parse these as IST and convert to UTC for storage
            const scheduledAtLocal = new Date(`${date}T${startTime}:00`);
            const cutoffTimeLocal = new Date(`${date}T${cutoffTime}:00`);

            // The dates are already in local time (IST), and JS will handle the timezone
            const result = await updateSession(sessionId, {
                scheduledAt: scheduledAtLocal,
                cutoffTime: cutoffTimeLocal,
            });

            if (result.success) {
                toast.success('Session updated successfully');
                router.push(`/dashboard/sessions/${sessionId}`);
                router.refresh();
            } else {
                toast.error(result.error || 'Failed to update session');
            }
        } catch (error) {
            toast.error('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {isActive && (
                <Alert className="border-amber-500/50 bg-amber-500/10">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    <AlertDescription className="text-amber-700 dark:text-amber-300">
                        This session is currently active. Changes will take effect immediately.
                    </AlertDescription>
                </Alert>
            )}

            {isEnded && (
                <Alert className="border-blue-500/50 bg-blue-500/10">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <AlertDescription className="text-blue-700 dark:text-blue-300">
                        This session has ended. You can still update the timing for record purposes.
                    </AlertDescription>
                </Alert>
            )}

            <Card className="glass">
                <CardHeader>
                    <CardTitle className="text-lg">Session Timing</CardTitle>
                    <CardDescription>
                        Adjust the scheduled date, start time, and late cutoff time
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input
                            id="date"
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Start Time</Label>
                            <Input
                                id="startTime"
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                When the session begins
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="cutoffTime">Late Cutoff Time</Label>
                            <Input
                                id="cutoffTime"
                                type="time"
                                value={cutoffTime}
                                onChange={(e) => setCutoffTime(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Arrivals after this are marked late
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </Button>
            </div>
        </form>
    );
}
