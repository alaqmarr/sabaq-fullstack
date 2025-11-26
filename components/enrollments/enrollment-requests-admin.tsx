'use client';

import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnrollmentGrid } from './enrollment-grid';
import { EnrollmentTable } from './enrollment-table';
import { ViewToggle } from '@/components/ui/view-toggle';

interface EnrollmentRequestsAdminProps {
    enrollments: any[];
    sabaqs: any[];
}

export function EnrollmentRequestsAdmin({ enrollments, sabaqs }: EnrollmentRequestsAdminProps) {
    const [selectedSabaq, setSelectedSabaq] = useState<string>('all');

    const [view, setView] = useState<'grid' | 'table'>('grid');

    const filteredEnrollments =
        selectedSabaq === 'all' ? enrollments : enrollments.filter((e) => e.sabaqId === selectedSabaq);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Select value={selectedSabaq} onValueChange={setSelectedSabaq}>
                        <SelectTrigger className="w-[250px]">
                            <SelectValue placeholder="Filter by sabaq" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sabaqs</SelectItem>
                            {sabaqs.map((sabaq) => (
                                <SelectItem key={sabaq.id} value={sabaq.id}>
                                    {sabaq.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <ViewToggle view={view} onViewChange={setView} />
            </div>

            {view === 'grid' ? (
                <EnrollmentGrid enrollments={filteredEnrollments} sabaqId={selectedSabaq} />
            ) : (
                <EnrollmentTable enrollments={filteredEnrollments} sabaqId={selectedSabaq} />
            )}
        </div>
    );
}
