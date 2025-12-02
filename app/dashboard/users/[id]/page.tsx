import { Suspense } from 'react';
import { getUserProfile } from '@/actions/users';
import { notFound, redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    User, Mail, Phone, Shield, BookOpen,
    CheckCircle, Clock, XCircle, Calendar,
    Activity, Percent, MessageCircle
} from 'lucide-react';
import { auth } from '@/auth';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { CircularProgress } from '@/components/ui/circular-progress';
import { getItsImageUrl } from '@/lib/its';
import { IDCard } from '@/components/users/id-card';

import { requirePermission } from '@/lib/rbac';
import { isRedirectError } from '@/lib/utils';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getUserProfile(id);

    if (!result.success || !result.profile) {
        return {
            title: "User Not Found",
        };
    }

    return {
        title: result.profile.user.name,
    };
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    const { id } = await params;

    try {
        // If viewing own profile, allow. If viewing others, check permission.
        if (session?.user?.id !== id) {
            await requirePermission('users', 'read');
        }
    } catch (error) {
        if (isRedirectError(error)) throw error;
        redirect('/unauthorized');
    }

    const result = await getUserProfile(id);

    if (!result.success) {
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

    const getRoleBadgeVariant = (role: string) => {
        const variants: Record<string, "frosted-purple" | "frosted-blue" | "frosted-amber" | "frosted-teal" | "frosted-green" | "frosted-slate"> = {
            SUPERADMIN: "frosted-purple",
            ADMIN: "frosted-blue",
            MANAGER: "frosted-amber",
            ATTENDANCE_INCHARGE: "frosted-teal",
            JANAB: "frosted-green",
            MUMIN: "frosted-slate",
        };
        return variants[role] || "frosted-slate";
    };

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-10">
            {/* Profile Header */}
            <IDCard user={user} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sabaq Performance Cards */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-cred-heading uppercase flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        sabaq performance
                    </h2>

                    {sabaqStats.length === 0 ? (
                        <Card className="glass-premium border-dashed border-white/20">
                            <CardContent className="py-16 text-center text-muted-foreground">
                                <BookOpen className="h-16 w-16 mx-auto mb-6 opacity-20" />
                                <p className="text-lg font-medium">No active enrollments found</p>
                                <p className="text-sm opacity-60">Enroll in a sabaq to see performance stats</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6">
                            {sabaqStats.map(({ sabaq, stats }: any) => (
                                <Card key={sabaq.id} className="glass-premium hover-lift transition-all border-0 overflow-hidden group">
                                    <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <CardTitle className="text-xl font-bold text-foreground/90 group-hover:text-primary transition-colors">{sabaq.name}</CardTitle>
                                                <CardDescription className="lowercase font-medium opacity-70">{sabaq.kitaab} • {sabaq.level}</CardDescription>
                                            </div>
                                            <div className="text-right">
                                                <CircularProgress
                                                    value={stats.percentage}
                                                    size={70}
                                                    strokeWidth={6}
                                                    color={stats.percentage >= 75 ? "text-green-500" : stats.percentage >= 50 ? "text-yellow-500" : "text-red-500"}
                                                />
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-4 gap-4 mb-6">
                                            <div className="bg-blue-500/5 p-4 rounded-2xl text-center border border-blue-500/10 backdrop-blur-sm">
                                                <div className="text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold mb-1">Total</div>
                                                <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{stats.totalSessions}</div>
                                            </div>
                                            <div className="bg-green-500/5 p-4 rounded-2xl text-center border border-green-500/10 backdrop-blur-sm">
                                                <div className="text-xs uppercase tracking-wider text-green-600 dark:text-green-400 font-bold mb-1">Present</div>
                                                <div className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.present}</div>
                                            </div>
                                            <div className="bg-yellow-500/5 p-4 rounded-2xl text-center border border-yellow-500/10 backdrop-blur-sm">
                                                <div className="text-xs uppercase tracking-wider text-yellow-600 dark:text-yellow-400 font-bold mb-1">Late</div>
                                                <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{stats.late}</div>
                                            </div>
                                            <div className="bg-red-500/5 p-4 rounded-2xl text-center border border-red-500/10 backdrop-blur-sm">
                                                <div className="text-xs uppercase tracking-wider text-red-600 dark:text-red-400 font-bold mb-1">Absent</div>
                                                <div className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.absent}</div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden flex ring-1 ring-white/10">
                                            <div style={{ width: `${(stats.present / stats.totalSessions) * 100}%` }} className="bg-gradient-to-r from-green-500 to-emerald-400 h-full shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                                            <div style={{ width: `${(stats.late / stats.totalSessions) * 100}%` }} className="bg-gradient-to-r from-yellow-500 to-amber-400 h-full shadow-[0_0_10px_rgba(234,179,8,0.4)]" />
                                        </div>
                                        <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-muted-foreground mt-3 px-1 opacity-70">
                                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500" />Present</div>
                                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500" />Late</div>
                                            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-secondary" />Absent</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activity Sidebar */}
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-cred-heading uppercase flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
                            <Activity className="h-5 w-5" />
                        </div>
                        recent activity
                    </h2>

                    <Card className="glass-premium border-0 h-fit overflow-hidden">
                        <CardContent className="p-0">
                            {recentActivity.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground text-sm">
                                    <Clock className="h-8 w-8 mx-auto mb-3 opacity-20" />
                                    No recent activity recorded
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {recentActivity.map((activity: any) => (
                                        <div key={activity.id} className="p-4 hover:bg-white/5 transition-colors flex items-start gap-4 group">
                                            <div className={`mt-1 p-2 rounded-xl shrink-0 shadow-lg ${activity.isLate
                                                ? 'bg-gradient-to-br from-yellow-500/20 to-amber-600/20 text-yellow-500 ring-1 ring-yellow-500/30'
                                                : 'bg-gradient-to-br from-green-500/20 to-emerald-600/20 text-green-500 ring-1 ring-green-500/30'
                                                }`}>
                                                {activity.isLate ? <Clock className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <p className="text-sm font-bold truncate text-foreground/90 group-hover:text-primary transition-colors">{activity.session.sabaq.name}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                                    <Calendar className="h-3 w-3 opacity-70" />
                                                    {new Date(activity.markedAt).toLocaleDateString()}
                                                    <span className="opacity-30">|</span>
                                                    {new Date(activity.markedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 h-6 font-bold uppercase tracking-wider ${activity.isLate
                                                ? 'text-yellow-600 border-yellow-500/30 bg-yellow-500/5'
                                                : 'text-green-600 border-green-500/30 bg-green-500/5'
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
