import { Suspense } from 'react';
import { getUserProfile } from '@/actions/users';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    User, Mail, Phone, Shield, BookOpen,
    CheckCircle, Clock, XCircle, Calendar,
    Activity, Percent
} from 'lucide-react';
import { auth } from '@/auth';

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;

    const result = await getUserProfile(id);

    if (!result.success) {
        if (result.error === "Unauthorized" || result.error === "You are not authorized to view this profile") {
            redirect('/dashboard');
        }
        return (
            <div className="p-6 text-center">
                <h2 className="text-xl font-semibold text-destructive">Error</h2>
                <p className="text-muted-foreground">{result.error}</p>
            </div>
        );
    }

    const { user, sabaqStats, recentActivity } = result.profile!;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRoleBadge = (role: string) => {
        const styles: Record<string, string> = {
            SUPERADMIN: "bg-purple-100 text-purple-700 border-purple-200",
            ADMIN: "bg-blue-100 text-blue-700 border-blue-200",
            MANAGER: "bg-indigo-100 text-indigo-700 border-indigo-200",
            ATTENDANCE_INCHARGE: "bg-orange-100 text-orange-700 border-orange-200",
            JANAB: "bg-emerald-100 text-emerald-700 border-emerald-200",
            MUMIN: "bg-slate-100 text-slate-700 border-slate-200",
        };
        return styles[role] || styles.MUMIN;
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-10">
            {/* Profile Header */}
            <Card className="glass overflow-hidden border-t-4 border-t-primary">
                <CardContent className="p-6 sm:p-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-xl">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`} />
                            <AvatarFallback className="text-2xl">{getInitials(user.name)}</AvatarFallback>
                        </Avatar>

                        <div className="space-y-2 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl sm:text-3xl font-bold">{user.name}</h1>
                                <Badge variant="outline" className={`font-mono ${getRoleBadge(user.role)}`}>
                                    {user.role}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-muted-foreground mt-4">
                                <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                                    <Shield className="h-4 w-4 text-primary" />
                                    <span className="font-mono">ITS: {user.itsNumber}</span>
                                </div>
                                {user.email && (
                                    <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                                        <Mail className="h-4 w-4 text-primary" />
                                        <span>{user.email}</span>
                                    </div>
                                )}
                                {user.phone && (
                                    <div className="flex items-center gap-2 bg-muted/30 p-2 rounded-md">
                                        <Phone className="h-4 w-4 text-primary" />
                                        <span>{user.phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sabaq Performance Cards */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Sabaq Performance
                    </h2>

                    {sabaqStats.length === 0 ? (
                        <Card className="glass border-dashed">
                            <CardContent className="py-12 text-center text-muted-foreground">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>No active enrollments found.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {sabaqStats.map(({ sabaq, stats }: any) => (
                                <Card key={sabaq.id} className="glass hover-lift transition-all">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <CardTitle className="text-lg text-primary">{sabaq.name}</CardTitle>
                                                <CardDescription>{sabaq.kitaab} • {sabaq.level}</CardDescription>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-bold flex items-center justify-end gap-1">
                                                    {stats.percentage}%
                                                    <Percent className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                                <p className="text-xs text-muted-foreground">Attendance Rate</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-4 gap-2 mt-4">
                                            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg text-center border border-blue-100 dark:border-blue-900">
                                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Total</div>
                                                <div className="text-xl font-bold text-blue-700 dark:text-blue-300">{stats.totalSessions}</div>
                                            </div>
                                            <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-lg text-center border border-green-100 dark:border-green-900">
                                                <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Present</div>
                                                <div className="text-xl font-bold text-green-700 dark:text-green-300">{stats.present}</div>
                                            </div>
                                            <div className="bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-lg text-center border border-yellow-100 dark:border-yellow-900">
                                                <div className="text-xs text-yellow-600 dark:text-yellow-400 font-medium mb-1">Late</div>
                                                <div className="text-xl font-bold text-yellow-700 dark:text-yellow-300">{stats.late}</div>
                                            </div>
                                            <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg text-center border border-red-100 dark:border-red-900">
                                                <div className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Absent</div>
                                                <div className="text-xl font-bold text-red-700 dark:text-red-300">{stats.absent}</div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden flex">
                                            <div style={{ width: `${(stats.present / stats.totalSessions) * 100}%` }} className="bg-green-500 h-full" />
                                            <div style={{ width: `${(stats.late / stats.totalSessions) * 100}%` }} className="bg-yellow-500 h-full" />
                                        </div>
                                        <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
                                            <span>Present</span>
                                            <span>Late</span>
                                            <span>Absent (Remaining)</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activity Sidebar */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Recent Activity
                    </h2>

                    <Card className="glass h-fit">
                        <CardContent className="p-0">
                            {recentActivity.length === 0 ? (
                                <div className="p-6 text-center text-muted-foreground text-sm">
                                    No recent activity recorded.
                                </div>
                            ) : (
                                <div className="divide-y divide-border">
                                    {recentActivity.map((activity: any) => (
                                        <div key={activity.id} className="p-4 hover:bg-muted/50 transition-colors flex items-start gap-3">
                                            <div className={`mt-1 p-1.5 rounded-full shrink-0 ${activity.isLate
                                                ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30'
                                                : 'bg-green-100 text-green-600 dark:bg-green-900/30'
                                                }`}>
                                                {activity.isLate ? <Clock className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{activity.session.sabaq.name}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(activity.markedAt).toLocaleDateString()}
                                                    <span className="text-muted-foreground/50">•</span>
                                                    {new Date(activity.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${activity.isLate ? 'text-yellow-600 border-yellow-200' : 'text-green-600 border-green-200'
                                                }`}>
                                                {activity.isLate ? 'Late' : 'On Time'}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
