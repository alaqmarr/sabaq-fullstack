'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnrollmentGrid } from './enrollment-grid';
import { EnrollmentTable } from './enrollment-table';
import { ViewToggle } from '@/components/ui/view-toggle';
import { BulkEnrollmentDialog } from '@/components/enrollment/bulk-enrollment-dialog';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

interface EnrollmentRequestsAdminProps {
    enrollments: any[];
    sabaqs: any[];
}

export function EnrollmentRequestsAdmin({ enrollments, sabaqs }: EnrollmentRequestsAdminProps) {
    const [selectedSabaq, setSelectedSabaq] = useState<string>('all');
    const [view, setView] = useState<'grid' | 'table'>('grid');
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    const searchParams = useSearchParams();

    // Handle ?action=bulk param
    useEffect(() => {
        if (searchParams.get('action') === 'bulk') {
            // If we have sabaqs, select the first one and open dialog if not already selected
            if (selectedSabaq === 'all' && sabaqs.length > 0) {
                setSelectedSabaq(sabaqs[0].id);
                setShowBulkDialog(true);
            } else if (selectedSabaq !== 'all') {
                setShowBulkDialog(true);
            }
        }
    }, [searchParams, sabaqs, selectedSabaq]);

    const filteredEnrollments =
        selectedSabaq === 'all' ? enrollments : enrollments.filter((e) => e.sabaqId === selectedSabaq);

    const handleBulkClick = () => {
        if (selectedSabaq === 'all') {
            toast.error('Please select a specific sabaq to bulk enroll users');
            return;
        }
        setShowBulkDialog(true);
    };

    const currentSabaq = sabaqs.find(s => s.id === selectedSabaq);

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <Select value={selectedSabaq} onValueChange={setSelectedSabaq}>
                        <SelectTrigger className="w-full sm:w-[250px]">
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

                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleBulkClick}
                        title="Bulk Enroll"
                        className="shrink-0"
                    >
                        <UserPlus className="h-4 w-4" />
                    </Button>
                </div>
                <ViewToggle view={view} onViewChange={setView} />
            </div>

            {/* Bulk Enrollment Dialog Wrapper - We control open state here to pass it down if needed, 
                but BulkEnrollmentDialog manages its own open state. 
                We need to conditionally render it or control it. 
                Actually BulkEnrollmentDialog has its own trigger. 
                Let's modify this: We will render the dialog conditionally when we have a sabaq selected 
                and we want to force it open, OR we just render it and let it handle itself?
                
                The existing BulkEnrollmentDialog has a trigger button. 
                We want to trigger it from our button above.
                
                Let's change strategy: We render the dialog but controlled.
                Wait, the existing component is uncontrolled (internal state).
                I should probably just render it when valid sabaq is selected and pass open=true?
                
                Let's use a key to force re-render or just render it when needed.
            */}

            {selectedSabaq !== 'all' && currentSabaq && (
                <div className="hidden">
                    {/* Hidden because we trigger via state, but we need the component mounted? 
                         Actually, the existing component has a button trigger. 
                         I'll modify the existing component to accept `open` prop or just use a custom one here.
                         
                         Easier: Just render the dialog here and control it.
                         But I can't easily control the internal state of the imported component if it doesn't export control props.
                         
                         Let's check BulkEnrollmentDialog again. It has internal `open` state.
                         I should modify BulkEnrollmentDialog to accept `open` and `onOpenChange` props.
                     */}
                </div>
            )}

            {/* 
                Since I can't easily modify the imported component's internal state without changing it,
                I will modify BulkEnrollmentDialog to accept controlled props.
            */}

            {view === 'grid' ? (
                <EnrollmentGrid enrollments={filteredEnrollments} sabaqId={selectedSabaq} />
            ) : (
                <EnrollmentTable enrollments={filteredEnrollments} sabaqId={selectedSabaq} />
            )}

            {selectedSabaq !== 'all' && currentSabaq && (
                <BulkEnrollmentDialog
                    sabaqId={selectedSabaq}
                    sabaqName={currentSabaq.name}
                    open={showBulkDialog}
                    onOpenChange={setShowBulkDialog}
                />
            )}
        </div>
    );
}
