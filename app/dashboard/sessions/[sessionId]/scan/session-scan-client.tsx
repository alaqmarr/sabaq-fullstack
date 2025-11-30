'use client';

import { useState } from 'react';
import { QRScanner } from '@/components/attendance/qr-scanner';
import { markAttendanceManual } from '@/actions/attendance';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface SessionScanClientProps {
    sessionId: string;
    sessionName: string;
}

export function SessionScanClient({ sessionId, sessionName }: SessionScanClientProps) {
    const [processing, setProcessing] = useState(false);
    const [scanResult, setScanResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleScan = async (decodedText: string) => {
        if (processing) return;

        // Basic validation: ITS number should be 8 digits
        if (!/^\d{8}$/.test(decodedText)) {
            setScanResult({ type: 'error', message: 'Invalid ITS: Must be 8 digits' });
            return;
        }

        setProcessing(true);

        try {
            // decodedText is the User's ITS Number
            const result = await markAttendanceManual(sessionId, decodedText);

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
        <Card className="glass-premium border-0 max-w-md mx-auto">
            <CardHeader>
                <CardTitle className="text-center text-cred-heading">Scan Attendance</CardTitle>
                <CardDescription className="text-center text-cred-label">
                    Scanning for: {sessionName}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
    );
}
