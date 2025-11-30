'use client';

import { EnrollmentTable } from './enrollment-table';
import { BulkEnrollmentButton } from '../enrollment/bulk-enrollment-button';
import { EnrollmentTree } from './enrollment-tree';

interface EnrollmentsTabProps {
    enrollments: any[];
    sabaqId: string;
    sabaqName: string;
}

export function EnrollmentsTab({ enrollments, sabaqId, sabaqName }: EnrollmentsTabProps) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <EnrollmentTree enrollments={enrollments} />
                <div className="w-full sm:w-auto">
                    <BulkEnrollmentButton sabaqId={sabaqId} sabaqName={sabaqName} />
                </div>
            </div>
            <EnrollmentTable enrollments={enrollments} sabaqId={sabaqId} />
        </div>
    );
}
