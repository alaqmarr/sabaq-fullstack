'use client';

import { EnrollmentTable } from './enrollment-table';
import { BulkEnrollmentButton } from '../enrollment/bulk-enrollment-button';

interface EnrollmentsTabProps {
    enrollments: any[];
    sabaqId: string;
    sabaqName: string;
}

export function EnrollmentsTab({ enrollments, sabaqId, sabaqName }: EnrollmentsTabProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Enrollment Requests</h3>
                    <div className="text-sm text-muted-foreground mt-1">
                        Total: {enrollments.length}
                    </div>
                </div>
                <BulkEnrollmentButton sabaqId={sabaqId} sabaqName={sabaqName} />
            </div>
            <EnrollmentTable enrollments={enrollments} sabaqId={sabaqId} />
        </div>
    );
}
