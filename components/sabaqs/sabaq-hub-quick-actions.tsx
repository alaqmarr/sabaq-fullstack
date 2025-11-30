'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, FileDown, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SabaqHubQuickActionsProps {
    sabaqId: string;
    isAdmin: boolean;
    pendingEnrollmentsCount?: number;
}

export function SabaqHubQuickActions({ sabaqId, isAdmin, pendingEnrollmentsCount = 0 }: SabaqHubQuickActionsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Link href={`/dashboard/sabaqs/${sabaqId}/sessions`}>
                <Card className="hover:bg-accent/5 transition-colors cursor-pointer h-full">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sessions</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Manage Sessions</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            View, schedule, and manage attendance
                        </p>
                    </CardContent>
                </Card>
            </Link>

            {isAdmin && (
                <Link href={`/dashboard/sabaqs/${sabaqId}/enrollments`}>
                    <Card className="hover:bg-accent/5 transition-colors cursor-pointer h-full relative overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <div className="text-2xl font-bold">Manage Enrollments</div>
                                {pendingEnrollmentsCount > 0 && (
                                    <Badge variant="destructive" className="animate-pulse">
                                        {pendingEnrollmentsCount} Pending
                                    </Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Approve or reject enrollment requests
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            )}

            {isAdmin && (
                <Link href={`/dashboard/sabaqs/${sabaqId}/export`}>
                    <Card className="hover:bg-accent/5 transition-colors cursor-pointer h-full">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Export</CardTitle>
                            <FileDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Export Data</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Download full sabaq report as Excel
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            )}
        </div>
    );
}
