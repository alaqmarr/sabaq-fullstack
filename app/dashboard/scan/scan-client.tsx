'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { QRScanner } from '@/components/attendance/qr-scanner';
import { markAttendanceManual, getSessionAttendance } from '@/actions/attendance';
import { getActiveSessions, getSessionUsers } from '@/actions/sessions';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { playSuccessSound, playErrorSound } from '@/lib/sounds';
import { Loader2, Keyboard } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { database } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { format } from 'date-fns';
import { CheckCircle, XCircle, Clock, User, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AttendanceRecord {
    id: string;
    userName: string;
    itsNumber: string;
    markedAt: number;
    isLate: boolean;
    markerName?: string;
    error?: string; // For optimistic UI errors
    pending?: boolean; // For optimistic UI
}

export default function ScanClient() {
    const [processing, setProcessing] = useState(false);
    const [sessions, setSessions] = useState<any[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [manualIts, setManualIts] = useState('');
    const [liveAttendance, setLiveAttendance] = useState<AttendanceRecord[]>([]);
    const [sessionUsers, setSessionUsers] = useState<Map<string, string>>(new Map()); // ITS -> Name

    const searchParams = useSearchParams();
    const initialSessionId = searchParams.get('sessionId');

    // Load Sessions
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

    // Load Session Users and Initial Attendance
    useEffect(() => {
        if (!selectedSessionId) return;

        const loadData = async () => {
            // 1. Load Users
            const usersRes = await getSessionUsers(selectedSessionId);
            if (usersRes.success && usersRes.users) {
                const userMap = new Map<string, string>();
                usersRes.users.forEach((u: any) => userMap.set(u.itsNumber, u.name));
                setSessionUsers(userMap);
            }

            // 2. Load Initial Attendance
            const attendanceRes = await getSessionAttendance(selectedSessionId);
            if (attendanceRes.success && attendanceRes.attendances) {
                const mapped: AttendanceRecord[] = attendanceRes.attendances.map((a: any) => ({
                    id: a.id,
                    userName: a.user.name,
                    itsNumber: a.user.itsNumber,
                    markedAt: new Date(a.markedAt).getTime(),
                    isLate: a.isLate,
                    markerName: a.marker?.name,
                }));
                setLiveAttendance(mapped);
            }
        };
        loadData();
    }, [selectedSessionId]);

    // Firebase Listener
    useEffect(() => {
        if (!selectedSessionId) {
            setLiveAttendance([]);
            return;
        }

        const attendanceRef = ref(database, `sessions/${selectedSessionId}/attendance`);

        const unsubscribe = onValue(attendanceRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const firebaseRecords: AttendanceRecord[] = Object.values(data);

                setLiveAttendance(prev => {
                    const currentMap = new Map(prev.map(r => [r.id, r]));

                    firebaseRecords.forEach(r => {
                        currentMap.set(r.id, { ...r, pending: false });
                    });

                    const merged = Array.from(currentMap.values());
                    merged.sort((a, b) => b.markedAt - a.markedAt);
                    return merged;
                });
            }
        });

        return () => off(attendanceRef);
    }, [selectedSessionId]);

    const [scanResult, setScanResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [highlightedId, setHighlightedId] = useState<string | null>(null);

    // Clear highlight after 2 seconds
    useEffect(() => {
        if (highlightedId) {
            const timer = setTimeout(() => setHighlightedId(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [highlightedId]);

    const processAttendance = async (its: string) => {
        if (processing || !selectedSessionId) return;

        // Basic validation
        if (!/^\d{8}$/.test(its)) {
            return;
        }

        setProcessing(true);
        setManualIts(''); // Clear immediately for rapid entry

        // Optimistic Update
        const tempId = `temp-${Date.now()}`;
        const userName = sessionUsers.get(its) || "Unknown User"; // Instant name lookup

        const optimisticRecord: AttendanceRecord = {
            id: tempId,
            userName: userName,
            itsNumber: its,
            markedAt: Date.now(),
            isLate: false,
            pending: true,
            markerName: "You"
        };

        setLiveAttendance(prev => [optimisticRecord, ...prev]);

        try {
            const result = await markAttendanceManual(selectedSessionId, its);

            if (result.success) {
                setScanResult({ type: 'success', message: `Marked: ${userName} (${its})` });
                playSuccessSound();
                // No need to clear manualIts here, already done
            } else {
                setScanResult({ type: 'error', message: result.error || 'Failed to mark' });
                playErrorSound();
                // Update the optimistic record to show error
                setLiveAttendance(prev => prev.map(r =>
                    r.id === tempId ? { ...r, error: result.error || 'Failed', pending: false } : r
                ));
            }
        } catch (error) {
            setScanResult({ type: 'error', message: 'System Error' });
            playErrorSound();
            setLiveAttendance(prev => prev.map(r =>
                r.id === tempId ? { ...r, error: 'System Error', pending: false } : r
            ));
        } finally {
            setProcessing(false);
        }
    };

    const handleScan = async (data: string) => {
        if (data) {
            await processAttendance(data);
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualIts) {
            processAttendance(manualIts);
        }
    };

    const selectedSession = sessions.find(s => s.id === selectedSessionId);

    return (
        <div className="container mx-auto py-8 px-4 max-w-7xl">
            <PageHeader
                title="Scan Attendance"
                description="Scan QR codes or manually enter ITS numbers to mark attendance for active sessions."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Session Selector and Manual Entry */}
                <Card className="lg:col-span-1 order-1 lg:order-none">
                    <CardHeader>
                        <CardTitle>Session Control</CardTitle>
                        <CardDescription>Select an active session and mark attendance.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label htmlFor="session-select" className="block text-sm font-medium text-muted-foreground mb-1">
                                Select Session
                            </label>
                            {loading ? (
                                <div className="flex items-center space-x-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm text-muted-foreground">Loading sessions...</span>
                                </div>
                            ) : (
                                <Select
                                    onValueChange={setSelectedSessionId}
                                    value={selectedSessionId}
                                    disabled={processing || sessions.length === 0}
                                >
                                    <SelectTrigger id="session-select">
                                        <SelectValue placeholder="Select a session" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sessions.length === 0 && (
                                            <SelectItem value="no-sessions" disabled>No active sessions</SelectItem>
                                        )}
                                        {sessions.map((session) => (
                                            <SelectItem key={session.id} value={session.id}>
                                                {session.name} ({format(new Date(session.date), 'MMM d, yyyy')})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {selectedSessionId && selectedSession && (
                            <div className="text-sm text-muted-foreground">
                                <p><strong>Session:</strong> {selectedSession.name}</p>
                                <p><strong>Date:</strong> {format(new Date(selectedSession.date), 'PPP')}</p>
                                <p><strong>Start Time:</strong> {format(new Date(selectedSession.startTime), 'p')}</p>
                                <p><strong>End Time:</strong> {format(new Date(selectedSession.endTime), 'p')}</p>
                            </div>
                        )}

                        <form onSubmit={handleManualSubmit} className="space-y-3">
                            <label htmlFor="manual-its" className="block text-sm font-medium text-muted-foreground mb-1">
                                Manual ITS Entry
                            </label>
                            <div className="relative">
                                <Input
                                    id="manual-its"
                                    type="text"
                                    placeholder="Enter ITS number (e.g., 12345678)"
                                    value={manualIts}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                        setManualIts(val);
                                        if (val.length === 8) {
                                            processAttendance(val);
                                        }
                                    }}
                                    disabled={processing || !selectedSessionId}
                                    maxLength={8}
                                    pattern="\d{8}"
                                    inputMode="numeric"
                                    autoFocus
                                />
                                {processing && (
                                    <div className="absolute right-3 top-2.5">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                )}
                            </div>
                        </form>

                        {scanResult && (
                            <div className={`p-3 rounded-md text-sm flex items-center gap-2 ${scanResult.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                {scanResult.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                <span>{scanResult.message}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* QR Scanner */}
                <Card className="lg:col-span-1 order-3 lg:order-none">
                    <CardHeader>
                        <CardTitle>QR Scanner</CardTitle>
                        <CardDescription>Scan student QR codes to mark attendance.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center items-center h-64">
                        {selectedSessionId ? (
                            <QRScanner onScan={handleScan} />
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <AlertTriangle className="mx-auto h-8 w-8 mb-2" />
                                <p>Please select a session to activate the scanner.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Live Attendance Feed */}
                <Card className="lg:col-span-1 order-2 lg:order-none">
                    <CardHeader>
                        <CardTitle>Live Attendance Feed</CardTitle>
                        <CardDescription>Recently marked attendance records.</CardDescription>
                    </CardHeader>
                    <ScrollArea className="h-[300px] lg:h-[400px] px-4 pb-4">
                        <div className="space-y-3">
                            {liveAttendance.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No attendance marked yet for this session.</p>
                            ) : (
                                liveAttendance.map((record) => (
                                    <div
                                        key={record.id}
                                        id={`record-${record.id}`}
                                        className={`flex items-center justify-between p-3 rounded-md border ${record.pending ? 'bg-blue-50 border-blue-200' :
                                            record.error ? 'bg-red-50 border-red-200' :
                                                highlightedId === record.id ? 'bg-yellow-50 border-yellow-300' :
                                                    'bg-card'
                                            }`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-foreground truncate">
                                                {record.userName}
                                                {record.pending && <span className="text-xs text-muted-foreground ml-2">(Syncing...)</span>}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <span className="font-mono">{record.itsNumber}</span>
                                                <span>•</span>
                                                <span>{record.markerName ? `By ${record.markerName}` : 'System'}</span>
                                            </div>
                                            {record.error && (
                                                <p className="text-xs text-destructive mt-0.5">{record.error}</p>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-end gap-1 ml-4">
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {format(record.markedAt, 'h:mm:ss a')}
                                            </span>
                                            {record.isLate && (
                                                <Badge variant="destructive" className="text-[10px] h-5 px-1.5">Late</Badge>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </Card>
            </div>
        </div>
    );
}
