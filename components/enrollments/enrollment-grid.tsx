'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Check, X, Mail, Calendar, User, CheckSquare, Square, BookOpen } from 'lucide-react';
import { approveEnrollment, rejectEnrollment, bulkApproveEnrollments, bulkRejectEnrollments } from '@/actions/enrollments';
import { toast } from 'sonner';
import { RejectionDialog } from './rejection-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EnrollmentGridProps {
    enrollments: any[];
    sabaqId: string;
}

export function EnrollmentGrid({ enrollments, sabaqId }: EnrollmentGridProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [loading, setLoading] = useState(false);
    const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [isBulkReject, setIsBulkReject] = useState(false);

    const filteredEnrollments = enrollments.filter((enrollment) => {
        if (statusFilter === 'all') return true;
        return enrollment.status === statusFilter;
    });

    const handleSelectAll = () => {
        const pendingIds = filteredEnrollments
            .filter((e) => e.status === 'PENDING')
            .map((e) => e.id);

        if (selectedIds.length === pendingIds.length && pendingIds.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(pendingIds);
        }
    };

    const handleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleApprove = async (enrollmentId: string) => {
        setLoading(true);
        const result = await approveEnrollment(enrollmentId);
        if (result.success) {
            toast.success('Enrollment approved');
            window.location.reload();
        } else {
            toast.error(result.error || 'Failed to approve enrollment');
        }
        setLoading(false);
    };

    const handleReject = (enrollmentId: string) => {
        setRejectingId(enrollmentId);
        setIsBulkReject(false);
        setRejectionDialogOpen(true);
    };

    const handleConfirmReject = async (reason: string) => {
        if (!rejectingId) return;

        setLoading(true);
        const result = await rejectEnrollment(rejectingId, reason);
        if (result.success) {
            toast.success('Enrollment rejected');
            window.location.reload();
        } else {
            toast.error(result.error || 'Failed to reject enrollment');
        }
        setLoading(false);
        setRejectionDialogOpen(false);
        setRejectingId(null);
    };

    const handleBulkApprove = async () => {
        if (selectedIds.length === 0) return;

        setLoading(true);
        const result = await bulkApproveEnrollments(selectedIds);
        if (result.success) {
            toast.success(`${result.count} enrollments approved`);
            setSelectedIds([]);
            window.location.reload();
        } else {
            toast.error(result.error || 'Failed to approve enrollments');
        }
        setLoading(false);
    };

    const handleBulkReject = () => {
        if (selectedIds.length === 0) return;
        setIsBulkReject(true);
        setRejectionDialogOpen(true);
    };

    const handleConfirmBulkReject = async (reason: string) => {
        setLoading(true);
        const result = await bulkRejectEnrollments(selectedIds, reason);
        if (result.success) {
            toast.success(`${result.count} enrollments rejected`);
            setSelectedIds([]);
            window.location.reload();
        } else {
            toast.error(result.error || 'Failed to reject enrollments');
        }
        setLoading(false);
        setRejectionDialogOpen(false);
        setIsBulkReject(false);
    };

    const statusColors = {
        PENDING: 'bg-yellow-500/15 text-yellow-700 border-yellow-200',
        APPROVED: 'bg-green-500/15 text-green-700 border-green-200',
        REJECTED: 'bg-red-500/15 text-red-700 border-red-200',
    };

    const pendingCount = filteredEnrollments.filter(e => e.status === 'PENDING').length;
    const isAllSelected = selectedIds.length > 0 && selectedIds.length === pendingCount;

    return (
        <>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>

                        {statusFilter === 'PENDING' && pendingCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAll}
                                className="whitespace-nowrap"
                            >
                                {isAllSelected ? (
                                    <><CheckSquare className="mr-2 h-4 w-4" /> Deselect All</>
                                ) : (
                                    <><Square className="mr-2 h-4 w-4" /> Select All Pending</>
                                )}
                            </Button>
                        )}
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                                onClick={handleBulkApprove}
                                disabled={loading}
                                size="sm"
                                variant="default"
                                className="flex-1 sm:flex-none"
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Approve ({selectedIds.length})
                            </Button>
                            <Button
                                onClick={handleBulkReject}
                                disabled={loading}
                                size="sm"
                                variant="destructive"
                                className="flex-1 sm:flex-none"
                            >
                                <X className="mr-2 h-4 w-4" />
                                Reject ({selectedIds.length})
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEnrollments.map((enrollment) => {
                        const isSelected = selectedIds.includes(enrollment.id);
                        return (
                            <Card
                                key={enrollment.id}
                                className={`glass hover-lift relative overflow-hidden transition-all ${isSelected ? 'ring-2 ring-primary border-primary' : ''}`}
                                onClick={() => enrollment.status === 'PENDING' && handleSelectOne(enrollment.id)}
                            >
                                {enrollment.status === 'PENDING' && (
                                    <div className="absolute top-2 right-2 z-10">
                                        {isSelected ? (
                                            <CheckSquare className="h-5 w-5 text-primary" />
                                        ) : (
                                            <Square className="h-5 w-5 text-muted-foreground opacity-50" />
                                        )}
                                    </div>
                                )}

                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start gap-2 pr-6">
                                        <CardTitle className="text-lg font-semibold line-clamp-1">
                                            {enrollment.user.name}
                                        </CardTitle>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {enrollment.user.itsNumber}
                                        </Badge>
                                        <Badge className={`text-xs ${statusColors[enrollment.status as keyof typeof statusColors]}`}>
                                            {enrollment.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    {/* Sabaq Information */}
                                    {enrollment.sabaq && (
                                        <div className="bg-primary/5 border border-primary/20 rounded-md p-2.5 space-y-1">
                                            <div className="flex items-center gap-2 text-primary font-semibold">
                                                <BookOpen className="h-4 w-4 shrink-0" />
                                                <span className="line-clamp-1 lowercase">{enrollment.sabaq.name}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground pl-6 lowercase">
                                                {enrollment.sabaq.kitaab} • nisaab {enrollment.sabaq.level}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-3.5 w-3.5 shrink-0" />
                                        <span className="truncate" title={enrollment.user.email || 'No email'}>
                                            {enrollment.user.email || 'No email'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                                        <span>Requested {format(new Date(enrollment.requestedAt), 'dd/MM/yy HH:mm')}</span>
                                    </div>

                                    {enrollment.status === 'REJECTED' && enrollment.rejectionReason && (
                                        <div className="bg-red-500/5 p-2 rounded text-xs text-red-600 border border-red-100 mt-2">
                                            Reason: {enrollment.rejectionReason}
                                        </div>
                                    )}

                                    {enrollment.status === 'PENDING' && (
                                        <div className="flex gap-2 mt-4 pt-2 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 hover:bg-green-500/10 hover:text-green-600 hover:border-green-200"
                                                onClick={() => handleApprove(enrollment.id)}
                                                disabled={loading}
                                            >
                                                <Check className="h-4 w-4 mr-1" /> Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1 hover:bg-red-500/10 hover:text-red-600 hover:border-red-200"
                                                onClick={() => handleReject(enrollment.id)}
                                                disabled={loading}
                                            >
                                                <X className="h-4 w-4 mr-1" /> Reject
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {filteredEnrollments.length === 0 && (
                    <div className="text-center py-12 glass rounded-xl border border-dashed">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                            <User className="h-12 w-12 mb-4 opacity-50" />
                            <p className="text-lg font-medium">No enrollments found</p>
                            <p className="text-sm">Try adjusting your filters</p>
                        </div>
                    </div>
                )}
            </div>

            <RejectionDialog
                open={rejectionDialogOpen}
                onOpenChange={setRejectionDialogOpen}
                onConfirm={isBulkReject ? handleConfirmBulkReject : handleConfirmReject}
                loading={loading}
                isBulk={isBulkReject}
            />
        </>
    );
}
