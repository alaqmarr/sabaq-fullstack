'use client';

import { useState, useEffect } from 'react';
import { QRScanner } from '@/components/attendance/qr-scanner';
import { markAttendanceManual, getSessionAttendance } from '@/actions/attendance';
import { getSessionUsers, startSession } from '@/actions/sessions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, UserCheck, Loader2, Keyboard, CheckCircle, XCircle, AlertTriangle, User, Play, RefreshCw, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { lookupUserForAttendance } from '@/actions/users';
import { createEnrollmentRequest, directEnrollUser } from '@/actions/enrollments';
import { database } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { formatTime } from '@/lib/date-utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { playSuccessSound, playErrorSound } from '@/lib/sounds';
import { useRouter } from 'next/navigation';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SessionScanClientProps {
    sessionId: string;
    sessionName: string;
    isActive: boolean;
    isAdmin: boolean;
    sabaqId: string;
}

interface AttendanceRecord {
    id: string;
    userName: string;
    itsNumber: string;
    markedAt: number;
    isLate: boolean;
    markerName?: string;
    error?: string;
    pending?: boolean;
}

export function SessionScanClient({ sessionId, sessionName, isActive, isAdmin, sabaqId }: SessionScanClientProps) {
    const [processing, setProcessing] = useState(false);
    const [scanResult, setScanResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const [manualIts, setManualIts] = useState('');
    const [liveAttendance, setLiveAttendance] = useState<AttendanceRecord[]>([]);
    const [sessionUsers, setSessionUsers] = useState<Map<string, string>>(new Map());
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    const [matchedUserName, setMatchedUserName] = useState<string | null>(null);
    const [startingSession, setStartingSession] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Load Session Users and Initial Attendance
    useEffect(() => {
        if (!isActive) {
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            setIsLoading(true);
            try {
                // 1. Load Users
                const usersRes = await getSessionUsers(sessionId);
                if (usersRes.success && usersRes.users) {
                    const userMap = new Map<string, string>();
                    usersRes.users.forEach((u: any) => userMap.set(u.itsNumber, u.name));
                    setSessionUsers(userMap);
                }

                // 2. Load Initial Attendance
                const attendanceRes = await getSessionAttendance(sessionId);
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
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [sessionId, isActive]);

    // Firebase Listener
    useEffect(() => {
        if (!isActive) return;

        const attendanceRef = ref(database, `sessions/${sessionId}/attendance`);

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
    }, [sessionId, isActive]);

    // Clear highlight after 2 seconds
    useEffect(() => {
        if (highlightedId) {
            const timer = setTimeout(() => setHighlightedId(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [highlightedId]);

    const [enrollmentCandidate, setEnrollmentCandidate] = useState<{ id: string; name: string; its: string; role: string; enrollmentStatus: string | null; enrollmentId: string | null } | null>(null);
    const [enrolling, setEnrolling] = useState(false);

    const processAttendance = async (its: string) => {
        if (processing) return;
        setEnrollmentCandidate(null); // Reset previous candidate

        // Basic validation
        if (!/^\d{8}$/.test(its)) {
            setScanResult({ type: 'error', message: 'Invalid ITS: Must be 8 digits' });
            playErrorSound();
            setManualIts('');
            setMatchedUserName(null);
            return;
        }

        // Check enrollment (Client-side validation first)
        // If not in sessionUsers map, check DB via server action for details
        let userName = sessionUsers.get(its);

        if (!userName) {
            setProcessing(true);
            try {
                // Check via Server Action only if not found in local map
                const result = await lookupUserForAttendance(its, sabaqId);

                if (result.success && result.user) {
                    // Found in DB but not enrolled (or pending)
                    setEnrollmentCandidate({
                        id: result.user.id,
                        name: result.user.name,
                        its: result.user.itsNumber,
                        role: result.user.role,
                        enrollmentStatus: result.user.enrollmentStatus,
                        enrollmentId: result.user.enrollmentId
                    });
                    playErrorSound(); // Sound alert that "not marked"
                    setManualIts(''); // Clear input
                } else {
                    setScanResult({ type: 'error', message: 'User not found in database' });
                    playErrorSound();
                }
            } catch (e) {
                setScanResult({ type: 'error', message: 'Lookup failed' });
                playErrorSound();
            } finally {
                setProcessing(false);
            }
            return; // Stop here, wait for manual enrollment action
        }

        // If user is in map (enrolled), proceed

        // Smart Duplicate Check
        const existingRecord = liveAttendance.find(r => r.itsNumber === its && !r.error && !r.pending);
        if (existingRecord) {
            setScanResult({ type: 'error', message: 'Already marked!' });
            playErrorSound();
            toast.info(`${existingRecord.userName} is already marked.`);
            setHighlightedId(existingRecord.id);
            setManualIts('');
            setMatchedUserName(null);

            const element = document.getElementById(`record-${existingRecord.id}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setProcessing(true);
        setManualIts(''); // Clear immediately
        setMatchedUserName(null);

        // Optimistic Update
        const tempId = `temp-${Date.now()}`;

        const optimisticRecord: AttendanceRecord = {
            id: tempId,
            userName: userName,
            itsNumber: its,
            markedAt: Date.now(),
            isLate: false, // Calculate late locally? Not needed for optimistic visual
            pending: true,
            markerName: "You"
        };

        setLiveAttendance(prev => [optimisticRecord, ...prev]);

        try {
            const result = await markAttendanceManual(sessionId, its);

            if (result.success) {
                setScanResult({ type: 'success', message: `Marked: ${userName} (${its})` });
                playSuccessSound();
            } else {
                setScanResult({ type: 'error', message: result.error || 'Failed to mark' });
                playErrorSound();
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
        if (enrollmentCandidate || startingSession) return;
        if (data) await processAttendance(data);
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualIts) processAttendance(manualIts);
    };

    const handleStartSession = async () => {
        setStartingSession(true);
        try {
            const result = await startSession(sessionId);
            if (result.success) {
                toast.success("Session started successfully");
                router.refresh();
            } else {
                toast.error(result.error || "Failed to start session");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setStartingSession(false);
        }
    };

    const handleEnroll = async () => {
        if (!enrollmentCandidate) return;
        setEnrolling(true);
        try {
            if (isAdmin) {
                // Direct Enroll
                const result = await directEnrollUser(sabaqId, enrollmentCandidate.id);
                if (result.success) {
                    toast.success("User enrolled successfully!");

                    const newName = enrollmentCandidate.name;
                    const newIts = enrollmentCandidate.its;

                    // 1. Update local users map immediately
                    setSessionUsers(prev => new Map(prev).set(newIts, newName));

                    // 2. Optimistically mark attendance
                    const tempId = `temp-enroll-${Date.now()}`;
                    const optimisticRecord: AttendanceRecord = {
                        id: tempId,
                        userName: newName,
                        itsNumber: newIts,
                        markedAt: Date.now(),
                        isLate: false,
                        pending: true,
                        markerName: "You"
                    };
                    setLiveAttendance(prev => [optimisticRecord, ...prev]);

                    // Close dialog immediately
                    setEnrollmentCandidate(null);

                    // 3. Perform server marking
                    const markResult = await markAttendanceManual(sessionId, newIts);

                    if (markResult.success) {
                        setScanResult({ type: 'success', message: `Enrolled & Marked: ${newName}` });
                        playSuccessSound();
                    } else {
                        setScanResult({ type: 'error', message: markResult.error || 'Enrolled, but failed to mark.' });
                        playErrorSound();
                        setLiveAttendance(prev => prev.map(r =>
                            r.id === tempId ? { ...r, error: markResult.error || 'Failed', pending: false } : r
                        ));
                    }

                } else {
                    toast.error(result.error);
                }
            } else {
                // Create Request
                const result = await createEnrollmentRequest(sabaqId, enrollmentCandidate.its);
                if (result.success) {
                    toast.success("Enrollment request sent!");
                    setEnrollmentCandidate(null);
                } else {
                    toast.error(result.error);
                }
            }
        } catch (e) {
            toast.error("Enrollment action failed");
        } finally {
            setEnrolling(false);
        }
    };

    if (!isActive) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <Alert variant="destructive" className="border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5" />
                    <AlertTitle className="text-lg font-semibold ml-6">Session Not Active</AlertTitle>
                    <AlertDescription className="mt-2">
                        <p>This session has not started yet. Attendance cannot be marked until the session is active.</p>
                        <div className="mt-4 flex flex-col items-start gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.refresh()}
                                className="border-red-200 hover:bg-red-100 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-900/50"
                            >
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Check Status
                            </Button>

                            {isAdmin && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white border-0">
                                            <Play className="mr-2 h-4 w-4 fill-current" />
                                            Start Session
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Start Session?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will make the session active immediately.
                                                <ul className="list-disc list-inside mt-2 space-y-1">
                                                    <li>Attendance marking will be enabled</li>
                                                    <li>"Session Started" emails will be sent to all enrolled participants</li>
                                                    <li>Realtime module sync will begin</li>
                                                </ul>
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleStartSession} disabled={startingSession}>
                                                {startingSession ? (
                                                    <>
                                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                        powering up...
                                                    </>
                                                ) : (
                                                    "Yes, Start Session"
                                                )}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </AlertDescription>
                </Alert>

                <div className="opacity-50 pointer-events-none filter blur-[2px] select-none">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="lg:col-span-1 h-fit glass-premium border-0">
                            <CardHeader><CardTitle>Manual Entry</CardTitle></CardHeader>
                            <CardContent><Input placeholder="Disabled..." /></CardContent>
                        </Card>
                        <Card className="lg:col-span-1 h-fit glass-premium border-0">
                            <CardHeader><CardTitle>Scan QR Code</CardTitle></CardHeader>
                            <CardContent className="h-48 flex items-center justify-center bg-muted/20 rounded-md">
                                <AlertTriangle className="h-8 w-8 text-muted-foreground" />
                            </CardContent>
                        </Card>
                        <Card className="lg:col-span-1 h-[400px] glass-premium border-0">
                            <CardHeader><CardTitle>Live</CardTitle></CardHeader>
                            <CardContent><div className="text-center text-muted-foreground mt-10">Waiting for session start...</div></CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 max-w-7xl mx-auto w-full overflow-hidden px-1 sm:px-0 relative">
            {/* Enrollment Modal - Mobile First Design */}
            {enrollmentCandidate && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-[2px] p-0 sm:p-4 animate-in fade-in duration-200">
                    <div
                        className="w-full sm:max-w-md bg-zinc-900 border-t sm:border border-white/10 p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 rounded-t-[20px] sm:rounded-xl ring-1 ring-white/10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="h-16 w-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2 ring-1 ring-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                <UserPlus className="h-8 w-8" />
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                                    {enrollmentCandidate.name}
                                </h3>
                                <p className="text-lg font-mono text-indigo-300">{enrollmentCandidate.its}</p>
                            </div>

                            <div className="w-full bg-white/5 rounded-lg p-3 text-sm text-gray-400 border border-white/5">
                                <p>This user is not enrolled in the current Sabaq.</p>
                                {enrollmentCandidate.enrollmentStatus === 'PENDING' && (
                                    <div className="mt-2 flex items-center justify-center gap-2 text-yellow-500 font-medium">
                                        <AlertTriangle className="h-4 w-4" />
                                        <span>Request Pending Approval</span>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full pt-2">
                                <Button
                                    variant="outline"
                                    className="h-12 border-white/10 hover:bg-white/5 hover:text-white"
                                    onClick={() => setEnrollmentCandidate(null)}
                                    disabled={enrolling}
                                >
                                    Cancel
                                </Button>
                                {enrollmentCandidate.enrollmentStatus !== 'PENDING' && (
                                    <Button
                                        className="h-12 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20"
                                        onClick={handleEnroll}
                                        disabled={enrolling}
                                    >
                                        {enrolling ? (
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        ) : (
                                            <UserPlus className="mr-2 h-5 w-5" />
                                        )}
                                        {isAdmin ? "Enroll & Mark" : "Request"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Entry Section */}
            <Card className="lg:col-span-1 h-fit glass-premium border-0 order-1 lg:order-none">
                <CardHeader>
                    <CardTitle className="text-center text-cred-heading">Manual Entry</CardTitle>
                    <CardDescription className="text-center text-cred-label">
                        Enter ITS number
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                    <form onSubmit={handleManualSubmit} className="space-y-4">
                        <div className="relative">
                            {processing ? (
                                <Loader2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground animate-spin" />
                            ) : (
                                <Keyboard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            )}
                            <Input
                                placeholder={processing ? "Marking..." : "Enter 8-digit ITS..."}
                                value={manualIts}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 8);
                                    setManualIts(val);

                                    if (val.length === 8) {
                                        processAttendance(val);
                                    }
                                }}
                                className="pl-9 text-lg tracking-widest font-mono bg-white/5 border-white/10"
                                inputMode="numeric"
                                maxLength={8}
                                autoFocus
                            />
                        </div>
                    </form>

                    {processing && (
                        <div className="p-2 sm:p-3 rounded-md text-xs sm:text-sm flex items-center gap-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Marking attendance...</span>
                        </div>
                    )}

                    {scanResult && (
                        <div className={`p-2 sm:p-3 rounded-md text-xs sm:text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${scanResult.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'
                            }`}>
                            {scanResult.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                            <span>{scanResult.message}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* QR Scanner Section */}
            <Card className="lg:col-span-1 h-fit glass-premium border-0 order-3 lg:order-none">
                <CardHeader>
                    <CardTitle className="text-center text-cred-heading">Scan QR Code</CardTitle>
                    <CardDescription className="text-center text-cred-label">
                        Scanning for: {sessionName}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                    <QRScanner
                        onScan={handleScan}
                    />
                </CardContent>
            </Card>

            {/* Live Feed Section */}
            <Card className="lg:col-span-1 h-[300px] sm:h-[400px] lg:h-[600px] flex flex-col glass-premium border-0 order-2 lg:order-none overflow-hidden">
                <CardHeader className="pb-2 px-3 sm:px-6 shrink-0">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-cred-heading text-sm sm:text-base">Live Feed</CardTitle>
                        <Badge variant="secondary" className="font-mono text-xs">
                            {liveAttendance.filter(r => !r.error).length} Present
                        </Badge>
                    </div>
                </CardHeader>
                <div className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-4 pb-4">
                    <div className="space-y-2 sm:space-y-3">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-8 gap-2">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">Loading attendance...</span>
                            </div>
                        ) : liveAttendance.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8 text-sm">
                                No attendance marked yet
                            </div>
                        ) : (
                            liveAttendance.map((record) => (
                                <div
                                    key={record.id}
                                    id={`record-${record.id}`}
                                    className={`flex items-center gap-2 p-2 sm:p-3 rounded-lg border transition-all duration-500 overflow-hidden ${highlightedId === record.id
                                        ? 'bg-blue-500/20 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                                        : record.error
                                            ? 'bg-destructive/10 border-destructive/30'
                                            : record.pending
                                                ? 'bg-yellow-500/10 border-yellow-500/20'
                                                : 'bg-white/5 border-white/10'
                                        }`}
                                >
                                    {/* Avatar - hidden on very small screens */}
                                    <div className={`hidden xs:flex h-8 w-8 rounded-full items-center justify-center shrink-0 ${record.error ? 'bg-destructive/20 text-destructive' : 'bg-blue-500/20 text-blue-400'
                                        }`}>
                                        {record.error ? <AlertTriangle className="h-4 w-4" /> : <User className="h-4 w-4" />}
                                    </div>
                                    {/* Content - flex-1 with overflow hidden */}
                                    <div className="flex-1 min-w-0 overflow-hidden">
                                        <p className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[120px] xs:max-w-[150px] sm:max-w-none">
                                            {record.userName}
                                            {record.pending && <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">(Sync)</span>}
                                        </p>
                                        <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
                                            <span className="font-mono shrink-0">{record.itsNumber}</span>
                                            {record.isLate && (
                                                <Badge variant="destructive" className="text-[8px] sm:text-[10px] h-4 px-1">Late</Badge>
                                            )}
                                        </div>
                                        {record.error && (
                                            <p className="text-[10px] sm:text-xs text-destructive mt-0.5 truncate">{record.error}</p>
                                        )}
                                    </div>
                                    {/* Time - compact on mobile */}
                                    <div className="shrink-0 text-right">
                                        <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                                            {formatTime(record.markedAt)}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );
}
