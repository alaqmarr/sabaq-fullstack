'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle, Clock, Search, Loader2, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceListProps {
    sessionId: string;
}

export function AttendanceList({ sessionId }: AttendanceListProps) {
    const [attendance, setAttendance] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const loadAttendance = async () => {
        try {
            const response = await fetch(`/api/sessions/${sessionId}/attendance`);
            const data = await response.json();
            if (data.success) {
                setAttendance(data.attendance || []);
            }
        } catch (error) {
            console.error('Failed to load attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAttendance();

        // Poll for updates every 10 seconds (reduced from 3s for better performance)
        const interval = setInterval(loadAttendance, 10000);
        return () => clearInterval(interval);
    }, [sessionId]);

    const filteredAttendance = attendance.filter(a =>
        a.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.user.itsNumber.includes(searchQuery)
    );

    const stats = {
        total: attendance.length,
        onTime: attendance.filter(a => a.status === 'ON_TIME' || !a.isLate).length,
        late: attendance.filter(a => a.status === 'LATE' || a.isLate).length,
    };

    if (loading) {
        return (
            <Card className="glass">
                <CardContent className="py-12 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="glass">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Attendance List
                        <Badge variant="secondary" className="ml-2">{stats.total}</Badge>
                    </CardTitle>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-semibold text-green-600">{stats.onTime}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-yellow-600" />
                            <span className="font-semibold text-yellow-600">{stats.late}</span>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or ITS..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {filteredAttendance.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        {attendance.length === 0 ? 'No attendance marked yet' : 'No results found'}
                    </div>
                ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                        {filteredAttendance.map((record) => {
                            const isLate = record.status === 'LATE' || record.isLate;
                            return (
                                <div
                                    key={record.id}
                                    className={cn(
                                        "flex items-center justify-between p-3 rounded-lg border transition-colors",
                                        !isLate && "bg-green-50/50 border-green-200 dark:bg-green-950/20",
                                        isLate && "bg-yellow-50/50 border-yellow-200 dark:bg-yellow-950/20"
                                    )}
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <span className="font-semibold text-sm">
                                                {record.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold truncate">{record.user.name}</div>
                                            <div className="text-xs text-muted-foreground font-mono">{record.user.itsNumber}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            variant={isLate ? 'destructive' : 'default'}
                                            className={cn(
                                                !isLate && "bg-green-600"
                                            )}
                                        >
                                            {isLate ? (
                                                <>
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    Late
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    On Time
                                                </>
                                            )}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground shrink-0">
                                            {new Date(record.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
