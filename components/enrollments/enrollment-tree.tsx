'use client';

import { CheckCircle2, Clock, XCircle, Users } from 'lucide-react';

interface EnrollmentTreeProps {
    enrollments: any[];
}

export function EnrollmentTree({ enrollments }: EnrollmentTreeProps) {
    const approved = enrollments.filter(e => e.status === 'APPROVED');
    const pending = enrollments.filter(e => e.status === 'PENDING');
    const rejected = enrollments.filter(e => e.status === 'REJECTED');
    const total = enrollments.length;

    return (
        <div className="w-full max-w-md">
            <div className="glass-card p-6 rounded-lg border space-y-6">
                {/* Header with Total */}
                <div className="flex items-center justify-between pb-4 border-b">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-lg bg-primary/10">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Enrollments</p>
                            <p className="text-3xl font-bold mt-0.5">{total}</p>
                        </div>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="space-y-3">
                    {/* Approved */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20 hover:bg-green-500/10 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-green-500/10">
                                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Approved</p>
                                <p className="text-xs text-muted-foreground">Currently enrolled</p>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {approved.length}
                        </div>
                    </div>

                    {/* Pending */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-orange-500/5 border border-orange-500/20 hover:bg-orange-500/10 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-orange-500/10">
                                <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Pending</p>
                                <p className="text-xs text-muted-foreground">Awaiting review</p>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {pending.length}
                        </div>
                    </div>

                    {/* Rejected */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-red-500/10">
                                <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Rejected</p>
                                <p className="text-xs text-muted-foreground">Declined requests</p>
                            </div>
                        </div>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {rejected.length}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
