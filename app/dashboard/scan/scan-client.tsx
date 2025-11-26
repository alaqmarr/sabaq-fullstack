'use client';

import { useState, useEffect } from 'react';
import { QRScanner } from '@/components/attendance/qr-scanner';
import { markAttendanceManual } from '@/actions/attendance';
import { getActiveSessions } from '@/actions/sessions';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function ScanClient() {
    const [processing, setProcessing] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSessions = async () => {
            const res = await getActiveSessions();
            if (res.success && res.sessions) {
                setSessions(res.sessions);
                if (res.sessions.length > 0) {
                    setSelectedSessionId(res.sessions[0].id);
                }
            }
            setLoading(false);
        };
        loadSessions();
    }, []);

    const handleScan = async (decodedText: string) => {
        if (processing || !selectedSessionId) return;

        // Basic validation: ITS number should be 8 digits
        if (!/^\d{8}$/.test(decodedText)) {
            toast.error('Invalid QR Code: Not a valid ITS number');
            return;
        }

        setProcessing(true);

        try {
            // decodedText is the User's ITS Number
            const result = await markAttendanceManual(selectedSessionId, decodedText);

            if (result.success) {
                toast.success(`✅ Attendance marked successfully for ITS ${decodedText}`, {
                    duration: 3000,
                });
                // Add a small delay before next scan to prevent double scanning
                setTimeout(() => setProcessing(false), 2000);
            } else {
                toast.error(`❌ ${result.error || 'Failed to mark attendance'}`, {
                    duration: 4000,
                });
                setTimeout(() => setProcessing(false), 2000);
            }
        } catch (error) {
            toast.error('❌ Something went wrong. Please try again.', {
                duration: 4000,
            });
            setTimeout(() => setProcessing(false), 2000);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="container max-w-md mx-auto py-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center">No Active Sessions</CardTitle>
                        <CardDescription className="text-center">
                            There are no active sessions to scan attendance for.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-md mx-auto py-8 space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-center">Scan User QR</CardTitle>
                    <CardDescription className="text-center">
                        Select a session and scan user ID cards
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Session</label>
                        <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select active session" />
                            </SelectTrigger>
                            <SelectContent>
                                {sessions.map((session) => (
                                    <SelectItem key={session.id} value={session.id}>
                                        {session.sabaq.name} ({session.sabaq.kitaab})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <QRScanner
                            onScan={handleScan}
                            onError={(err) => console.log('Scanner error:', err)}
                        />
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
