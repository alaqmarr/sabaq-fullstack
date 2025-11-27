'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { QRScanner } from '@/components/attendance/qr-scanner';
import { markAttendanceManual } from '@/actions/attendance';
import { getActiveSessions } from '@/actions/sessions';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { playSuccessSound, playErrorSound } from '@/lib/sounds';
import { Loader2 } from 'lucide-react';

export default function ScanClient() {
    const [processing, setProcessing] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [loading, setLoading] = useState(true);

    const searchParams = useSearchParams();
    const initialSessionId = searchParams.get('sessionId');

    useEffect(() => {
        const loadSessions = async () => {
            const res = await getActiveSessions();
            if (res.success && res.sessions) {
                setSessions(res.sessions);
                if (initialSessionId && res.sessions.some(s => s.id === initialSessionId)) {
                    setSelectedSessionId(initialSessionId);
                } else if (res.sessions.length > 0) {
                    setSelectedSessionId(res.sessions[0].id);
                }
            }
            setLoading(false);
        };
        loadSessions();
    }, [initialSessionId]);

    const [scanResult, setScanResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleScan = async (decodedText: string) => {
        if (processing || !selectedSessionId) return;

        // Basic validation: ITS number should be 8 digits
        if (!/^\d{8}$/.test(decodedText)) {
            setScanResult({ type: 'error', message: 'Invalid ITS: Must be 8 digits' });
            return;
        }

        setProcessing(true);

        try {
            // decodedText is the User's ITS Number
            const result = await markAttendanceManual(selectedSessionId, decodedText);

            if (result.success) {
                setScanResult({ type: 'success', message: `Marked: ${decodedText}` });
            } else {
                setScanResult({ type: 'error', message: result.error || 'Failed to mark' });
            }
        } catch (error) {
            setScanResult({ type: 'error', message: 'System Error' });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="container max-w-md mx-auto py-8 space-y-6">
            <Card className="glass-premium border-0">
                <CardHeader>
                    <CardTitle className="text-center text-cred-heading">Scan Attendance</CardTitle>
                    <CardDescription className="text-center text-cred-label">
                        Select a session and scan ID cards
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm text-cred-label font-bold uppercase tracking-wider">Select Session</label>
                        <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                            <SelectTrigger className="h-12 bg-white/5 border-white/10">
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
                            scanResult={scanResult}
                            onClearResult={() => setScanResult(null)}
                            onError={(err) => console.log('Scanner error:', err)}
                        />
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}
