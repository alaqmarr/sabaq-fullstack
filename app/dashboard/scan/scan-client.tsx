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
import { Loader2, Keyboard } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ScanClient() {
    const [processing, setProcessing] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [manualIts, setManualIts] = useState('');

    const searchParams = useSearchParams();
    const initialSessionId = searchParams.get('sessionId');

    useEffect(() => {
        const loadSessions = async () => {
            const res = await getActiveSessions();
            if (res.success && res.sessions) {
                setSessions(res.sessions);
                if (initialSessionId && res.sessions.some((s: any) => s.id === initialSessionId)) {
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

    const processAttendance = async (its: string) => {
        if (processing || !selectedSessionId) return;

        // Basic validation: ITS number should be 8 digits
        if (!/^\d{8}$/.test(its)) {
            setScanResult({ type: 'error', message: 'Invalid ITS: Must be 8 digits' });
            playErrorSound();
            return;
        }

        setProcessing(true);

        try {
            const result = await markAttendanceManual(selectedSessionId, its);

            if (result.success) {
                setScanResult({ type: 'success', message: `Marked: ${its}` });
                playSuccessSound();
                setManualIts(''); // Clear manual input on success
            } else {
                setScanResult({ type: 'error', message: result.error || 'Failed to mark' });
                playErrorSound();
            }
        } catch (error) {
            setScanResult({ type: 'error', message: 'System Error' });
            playErrorSound();
        } finally {
            setProcessing(false);
        }
    };

    const handleScan = async (decodedText: string) => {
        await processAttendance(decodedText);
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        processAttendance(manualIts);
    };

    return (
        <div className="container max-w-md mx-auto py-4 sm:py-8 space-y-6">
            <PageHeader
                title="Scan Attendance"
                description="Select a session and scan ID cards"
            />

            <Card className="glass-premium border-0">
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-2">
                        <label className="text-sm text-cred-label font-bold uppercase tracking-wider">Select Session</label>
                        <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                            <SelectTrigger className="h-12 bg-white/5 border-white/10">
                                <SelectValue placeholder="Select active session" />
                            </SelectTrigger>
                            <SelectContent>
                                {sessions.map((session: any) => (
                                    <SelectItem key={session.id} value={session.id}>
                                        {session.sabaq.name} ({session.sabaq.kitaab})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Manual Entry - Priority 1 (Mobile First) */}
                    <div className="space-y-2 p-4 bg-white/5 rounded-lg border border-white/10">
                        <label className="text-sm text-cred-label font-bold uppercase tracking-wider flex items-center gap-2">
                            <Keyboard className="h-4 w-4" />
                            Manual Entry
                        </label>
                        <form onSubmit={handleManualSubmit} className="flex gap-2">
                            <Input
                                placeholder="Enter ITS Number"
                                value={manualIts}
                                onChange={(e) => setManualIts(e.target.value)}
                                className="bg-background/50"
                                maxLength={8}
                                type="tel" // Better keyboard on mobile
                            />
                            <Button type="submit" disabled={processing || !selectedSessionId || manualIts.length !== 8}>
                                {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mark"}
                            </Button>
                        </form>
                    </div>

                    {/* QR Scanner - Priority 2 */}
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
