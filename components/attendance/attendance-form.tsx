'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { markAttendanceManual } from '@/actions/attendance';
import { toast } from 'sonner';
import { ScanLine, User } from 'lucide-react';
import { ITSInput } from '@/components/ui/its-input';
import { QRScanner } from '@/components/attendance/qr-scanner';

interface AttendanceFormProps {
    sessionId: string;
    onSuccess?: () => void;
}

export function AttendanceForm({ sessionId, onSuccess }: AttendanceFormProps) {
    const [itsNumber, setItsNumber] = useState('');
    const [loading, setLoading] = useState(false);

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!itsNumber.trim()) {
            toast.error('Please enter an ITS number');
            return;
        }

        setLoading(true);
        const result = await markAttendanceManual(sessionId, itsNumber.trim());

        if (result.success) {
            toast.success(`Attendance marked for ${result.attendance?.user.name}`);
            setItsNumber('');
            onSuccess?.();
        } else {
            toast.error(result.error || 'Failed to mark attendance');
        }
        setLoading(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Mark Attendance</CardTitle>
                <CardDescription>Scan QR code or enter ITS number manually</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="manual" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="qr">
                            <ScanLine className="h-4 w-4 mr-2" />
                            QR Scan
                        </TabsTrigger>
                        <TabsTrigger value="manual">
                            <User className="h-4 w-4 mr-2" />
                            Manual Entry
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="qr" className="space-y-4">
                        <QRScanner
                            onScan={async (decodedText) => {
                                if (!/^\d{8}$/.test(decodedText)) {
                                    toast.error('Invalid ITS: Must be 8 digits');
                                    return;
                                }
                                setLoading(true);
                                const result = await markAttendanceManual(sessionId, decodedText);
                                if (result.success) {
                                    toast.success(`Marked: ${decodedText}`);
                                    onSuccess?.();
                                } else {
                                    toast.error(result.error || 'Failed to mark');
                                }
                                setLoading(false);
                            }}
                            scanResult={null}
                            onClearResult={() => { }}
                            onError={(err) => console.log('Scanner error:', err)}
                        />
                    </TabsContent>

                    <TabsContent value="manual" className="space-y-4">
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <ITSInput
                                    value={itsNumber}
                                    onChange={setItsNumber}
                                    onUserFound={(user) => {
                                        // Optional: Auto-submit or show additional info
                                        // For now, just validation is enough
                                    }}
                                    placeholder="Enter 8-digit ITS number"
                                    label="ITS Number"
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading || !itsNumber} variant="frosted-blue">
                                {loading ? 'marking...' : 'mark attendance'}
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
