'use client';

import { useState, useEffect } from 'react';
import { QRScanner } from '@/components/attendance/qr-scanner';
import { markAttendanceManual } from '@/actions/attendance';
import { lookupUserByITS } from '@/actions/users';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserCheck, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SessionScanClientProps {
    sessionId: string;
    sessionName: string;
}

export function SessionScanClient({ sessionId, sessionName }: SessionScanClientProps) {
    const [processing, setProcessing] = useState(false);
    const [scanResult, setScanResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Manual Entry State
    const [manualIts, setManualIts] = useState('');
    const [lookedUpUser, setLookedUpUser] = useState<{ id: string; name: string; itsNumber: string } | null>(null);
    const [isLookingUp, setIsLookingUp] = useState(false);

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
                toast.success(`Attendance marked for ${decodedText}`);
            } else {
                setScanResult({ type: 'error', message: result.error || 'Failed to mark' });
                toast.error(result.error || 'Failed to mark');
            }
        } catch (error) {
            setScanResult({ type: 'error', message: 'System Error' });
        } finally {
            setProcessing(false);
        }
    };

    // Auto-lookup when ITS is 8 digits
    useEffect(() => {
        const lookup = async () => {
            if (manualIts.length === 8) {
                setIsLookingUp(true);
                setLookedUpUser(null);
                try {
                    const result = await lookupUserByITS(manualIts);
                    if (result.success && result.user) {
                        setLookedUpUser(result.user);
                    } else {
                        // Don't show error immediately, maybe they are still typing? 
                        // But it's exactly 8 digits.
                        // Let's just not set the user.
                    }
                } catch (error) {
                    console.error("Lookup failed", error);
                } finally {
                    setIsLookingUp(false);
                }
            } else {
                setLookedUpUser(null);
            }
        };

        const debounce = setTimeout(lookup, 300);
        return () => clearTimeout(debounce);
    }, [manualIts]);

    const handleManualMark = async () => {
        if (!manualIts || manualIts.length !== 8) return;

        setProcessing(true);
        try {
            const result = await markAttendanceManual(sessionId, manualIts);
            if (result.success) {
                toast.success(`Attendance marked for ${lookedUpUser?.name || manualIts}`);
                setManualIts('');
                setLookedUpUser(null);
                setScanResult({ type: 'success', message: `Marked: ${lookedUpUser?.name || manualIts}` });
            } else {
                toast.error(result.error || 'Failed to mark');
                setScanResult({ type: 'error', message: result.error || 'Failed to mark' });
            }
        } catch (error) {
            toast.error('System error');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {/* QR Scanner Section */}
            <Card className="glass-premium border-0 h-fit">
                <CardHeader>
                    <CardTitle className="text-center text-cred-heading">Scan QR Code</CardTitle>
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

            {/* Manual Entry Section */}
            <Card className="glass-premium border-0 h-fit">
                <CardHeader>
                    <CardTitle className="text-center text-cred-heading">Manual Entry</CardTitle>
                    <CardDescription className="text-center text-cred-label">
                        Enter ITS number manually
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Enter 8-digit ITS..."
                                value={manualIts}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                    setManualIts(val);
                                }}
                                className="pl-9 text-lg tracking-widest font-mono"
                                inputMode="numeric"
                            />
                            {isLookingUp && (
                                <div className="absolute right-3 top-3">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                            )}
                        </div>

                        {lookedUpUser ? (
                            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                                    <UserCheck className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm truncate">{lookedUpUser.name}</p>
                                    <p className="text-xs text-muted-foreground font-mono">{lookedUpUser.itsNumber}</p>
                                </div>
                            </div>
                        ) : manualIts.length === 8 && !isLookingUp ? (
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center animate-in fade-in slide-in-from-top-2">
                                <p className="text-sm text-destructive font-medium">User not found</p>
                            </div>
                        ) : null}

                        <Button
                            className="w-full"
                            size="lg"
                            disabled={!lookedUpUser || processing}
                            onClick={handleManualMark}
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Marking...
                                </>
                            ) : (
                                'Mark Attendance'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
