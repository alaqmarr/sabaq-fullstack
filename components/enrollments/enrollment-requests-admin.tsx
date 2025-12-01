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
    initialEnrollments: any[];
    sabaqs: any[];
    initialTotal: number;
}

export function EnrollmentRequestsAdmin({ initialEnrollments, sabaqs, initialTotal }: EnrollmentRequestsAdminProps) {
    const [selectedSabaq, setSelectedSabaq] = useState<string>('all');
    const [view, setView] = useState<'grid' | 'table'>('grid');
    const [showBulkDialog, setShowBulkDialog] = useState(false);
    const searchParams = useSearchParams();

    // Pagination state
    const [enrollments, setEnrollments] = useState(initialEnrollments);
    const [total, setTotal] = useState(initialTotal);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    // Handle ?action=bulk param
    useEffect(() => {
        if (searchParams.get('action') === 'bulk') {
            if (selectedSabaq === 'all' && sabaqs.length > 0) {
                setSelectedSabaq(sabaqs[0].id);
                setShowBulkDialog(true);
            } else if (selectedSabaq !== 'all') {
                setShowBulkDialog(true);
            }
        }
    }, [searchParams, sabaqs, selectedSabaq]);

    // Fetch enrollments when sabaq changes or load more
    const fetchEnrollments = async (pageNum: number, sabaq: string, append: boolean) => {
        setLoading(true);
        try {
            // Dynamically import action to avoid server-client issues if not passed as prop?
            // No, we can import server actions in client components.
            const { getEnrollmentRequests } = await import('@/actions/enrollments');
            const res = await getEnrollmentRequests(pageNum, 20, sabaq);

            if (res.success && res.enrollments) {
                if (append) {
                    setEnrollments(prev => [...prev, ...res.enrollments]);
                } else {
                    setEnrollments(res.enrollments);
                }
                if (res.total !== undefined) setTotal(res.total);
                setPage(pageNum);
            } else {
                toast.error(res.error || 'Failed to fetch enrollments');
            }
        } catch (error) {
            toast.error('Failed to fetch enrollments');
        } finally {
            setLoading(false);
        }
    };

    // When selectedSabaq changes, reset and fetch
    useEffect(() => {
        // Skip initial load if it matches props (all)
        if (selectedSabaq === 'all' && enrollments === initialEnrollments) return;

        // If we switch to a specific sabaq, we must fetch page 1 for that sabaq
        fetchEnrollments(1, selectedSabaq, false);
    }, [selectedSabaq]);

    const handleLoadMore = () => {
        fetchEnrollments(page + 1, selectedSabaq, true);
    };

    const handleBulkClick = () => {
        if (selectedSabaq === 'all') {
            toast.error('Please select a specific sabaq to bulk enroll users');
            return;
        }
        setShowBulkDialog(true);
    };

    const currentSabaq = sabaqs.find(s => s.id === selectedSabaq);
    const hasMore = enrollments.length < total;

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

            {enrollments.length === 0 && !loading ? (
                <div className="text-center py-12 glass-card rounded-lg">
                    <p className="text-muted-foreground">No pending enrollment requests found.</p>
                </div>
            ) : (
                <>
                    {view === 'grid' ? (
                        <EnrollmentGrid enrollments={enrollments} sabaqId={selectedSabaq} />
                    ) : (
                        <EnrollmentTable enrollments={enrollments} sabaqId={selectedSabaq} />
                    )}

                    {hasMore && (
                        <div className="flex justify-center pt-4">
                            <Button
                                variant="outline"
                                onClick={handleLoadMore}
                                disabled={loading}
                                className="w-full sm:w-auto min-w-[200px]"
                            >
                                {loading ? 'Loading...' : 'Load More'}
                            </Button>
                        </div>
                    )}
                </>
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
