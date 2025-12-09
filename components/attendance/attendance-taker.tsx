'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, Clock, X, Save, RotateCcw, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getSessionAttendanceData, bulkMarkAttendance } from '@/actions/attendance';
import { cn } from '@/lib/utils';
import { formatPPPp } from '@/lib/date-utils';

interface Attendee {
    user: {
        id: string;
        name: string;
        itsNumber: string;
        profileImage: string | null;
    };
    status: 'PRESENT' | 'LATE' | 'ABSENT';
    markedAt: Date | null;
    attendanceId: string | null;
}

interface AttendanceTakerProps {
    sessionId: string;
}

export function AttendanceTaker({ sessionId }: AttendanceTakerProps) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [attendees, setAttendees] = useState<Attendee[]>([]);
    const [originalAttendees, setOriginalAttendees] = useState<Attendee[]>([]);
    const [sessionInfo, setSessionInfo] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [unsavedChanges, setUnsavedChanges] = useState(false);

    useEffect(() => {
        loadData();
    }, [sessionId]);

    const loadData = async () => {
        setLoading(true);
        const res = await getSessionAttendanceData(sessionId);
        if (res.success && res.attendees) {
            setAttendees(res.attendees.map((a) => ({
                ...a,
                status: a.status as 'PRESENT' | 'LATE' | 'ABSENT'
            })));
            setOriginalAttendees(JSON.parse(JSON.stringify(res.attendees))); // Deep copy
            setSessionInfo(res.session);
            setUnsavedChanges(false);
        } else {
            toast.error(res.error || 'Failed to load attendance data');
        }
        setLoading(false);
    };

    const handleStatusChange = (userId: string, status: 'PRESENT' | 'LATE' | 'ABSENT') => {
        setAttendees((prev) =>
            prev.map((a) =>
                a.user.id === userId ? { ...a, status } : a
            )
        );
        setUnsavedChanges(true);
    };

    const handleSync = async () => {
        setSaving(true);

        // Find changed records
        const updates = attendees
            .filter((a, index) => {
                const original = originalAttendees.find(oa => oa.user.id === a.user.id);
                return original && original.status !== a.status;
            })
            .map(a => ({
                userId: a.user.id,
                status: a.status
            }));

        if (updates.length === 0) {
            setSaving(false);
            setUnsavedChanges(false);
            toast.info('No changes to sync');
            return;
        }

        const res = await bulkMarkAttendance(sessionId, updates);

        if (res.success) {
            toast.success(`Synced ${res?.results?.success} records successfully`);
            const failedCount = res?.results?.failed || 0;
            if (failedCount > 0) {
                toast.error(`Failed to sync ${failedCount} records`);
            }
            // Reload data to get fresh state (including IDs and timestamps)
            await loadData();
        } else {
            toast.error(res.error || 'Failed to sync attendance');
        }
        setSaving(false);
    };

    const handleReset = () => {
        if (confirm('Discard all unsaved changes?')) {
            setAttendees(JSON.parse(JSON.stringify(originalAttendees)));
            setUnsavedChanges(false);
        }
    };

    const filteredAttendees = attendees.filter(a =>
        a.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.user.itsNumber.includes(searchQuery)
    );

    const stats = {
        total: attendees.length,
        present: attendees.filter(a => a.status === 'PRESENT').length,
        late: attendees.filter(a => a.status === 'LATE').length,
        absent: attendees.filter(a => a.status === 'ABSENT').length,
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!sessionInfo) return <div>Session not found</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
                <div>
                    <h2 className="text-2xl font-bold">{sessionInfo.sabaqName}</h2>
                    <p className="text-muted-foreground">
                        {formatPPPp(sessionInfo.scheduledAt)}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {unsavedChanges && (
                        <Button variant="outline" onClick={handleReset} disabled={saving}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Discard
                        </Button>
                    )}
                    <Button onClick={handleSync} disabled={!unsavedChanges || saving} className={cn(unsavedChanges && "animate-pulse")}>
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Sync Changes
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <div className="text-xs text-muted-foreground uppercase font-semibold">Total Enrolled</div>
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                        <div className="text-xs text-green-600 uppercase font-semibold">Present</div>
                    </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-100">
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
                        <div className="text-xs text-yellow-600 uppercase font-semibold">Late</div>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-100">
                    <CardContent className="pt-6 text-center">
                        <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                        <div className="text-xs text-red-600 uppercase font-semibold">Absent</div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or ITS..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredAttendees.map((attendee) => (
                    <Card key={attendee.user.id} className={cn(
                        "transition-all duration-200",
                        attendee.status === 'PRESENT' && "border-green-200 bg-green-50/30",
                        attendee.status === 'LATE' && "border-yellow-200 bg-yellow-50/30",
                        attendee.status === 'ABSENT' && "border-red-200 bg-red-50/10 opacity-80 hover:opacity-100"
                    )}>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={attendee.user.profileImage || ''} />
                                    <AvatarFallback>{attendee.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="overflow-hidden">
                                    <div className="font-semibold truncate" title={attendee.user.name}>{attendee.user.name}</div>
                                    <div className="text-xs text-muted-foreground font-mono">{attendee.user.itsNumber}</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    variant={attendee.status === 'PRESENT' ? 'default' : 'outline'}
                                    size="sm"
                                    className={cn(
                                        "h-8",
                                        attendee.status === 'PRESENT' ? "bg-green-600 hover:bg-green-700" : "hover:text-green-600 hover:border-green-200"
                                    )}
                                    onClick={() => handleStatusChange(attendee.user.id, 'PRESENT')}
                                >
                                    <Check className="h-4 w-4 mr-1" /> P
                                </Button>
                                <Button
                                    variant={attendee.status === 'LATE' ? 'default' : 'outline'}
                                    size="sm"
                                    className={cn(
                                        "h-8",
                                        attendee.status === 'LATE' ? "bg-yellow-500 hover:bg-yellow-600 text-white" : "hover:text-yellow-600 hover:border-yellow-200"
                                    )}
                                    onClick={() => handleStatusChange(attendee.user.id, 'LATE')}
                                >
                                    <Clock className="h-4 w-4 mr-1" /> L
                                </Button>
                                <Button
                                    variant={attendee.status === 'ABSENT' ? 'default' : 'outline'}
                                    size="sm"
                                    className={cn(
                                        "h-8",
                                        attendee.status === 'ABSENT' ? "bg-red-500 hover:bg-red-600" : "hover:text-red-600 hover:border-red-200"
                                    )}
                                    onClick={() => handleStatusChange(attendee.user.id, 'ABSENT')}
                                >
                                    <X className="h-4 w-4 mr-1" /> A
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
