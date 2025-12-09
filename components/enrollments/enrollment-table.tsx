'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { SearchInput } from '../ui/search-input';
import { approveEnrollment, rejectEnrollment, bulkApproveEnrollments, bulkRejectEnrollments } from '@/actions/enrollments';
import { toast } from 'sonner';
import { formatDateTimeCode } from '@/lib/date-utils';
import { Check, X } from 'lucide-react';
import { RejectionDialog } from './rejection-dialog';
import { EnrollmentStatus } from '@prisma/client';

interface EnrollmentTableProps {
    enrollments: any[];
    sabaqId: string;
}

export function EnrollmentTable({ enrollments, sabaqId }: EnrollmentTableProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [isBulkReject, setIsBulkReject] = useState(false);

    const filteredEnrollments = enrollments.filter((enrollment) => {
        // Status filter
        if (statusFilter !== 'all' && enrollment.status !== statusFilter) {
            return false;
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const name = enrollment.user.name?.toLowerCase() || '';
            const itsNumber = enrollment.user.itsNumber?.toLowerCase() || '';
            const email = enrollment.user.email?.toLowerCase() || '';

            return name.includes(query) || itsNumber.includes(query) || email.includes(query);
        }

        return true;
    });

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const pendingIds = filteredEnrollments
                .filter((e) => e.status === 'PENDING')
                .map((e) => e.id);
            setSelectedIds(pendingIds);
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
        }
    };

    const handleApprove = async (enrollmentId: string) => {
        setLoading(true);
        const result = await approveEnrollment(enrollmentId);
        if (result.success) {
            toast.success('Enrollment approved');
            window.location.reload(); // Refresh to show updated data
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
        PENDING: 'bg-yellow-500',
        APPROVED: 'bg-green-500',
        REJECTED: 'bg-red-500',
    };

    return (
        <>
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search by name, ITS, or email..."
                        className="w-full sm:max-w-sm"
                    />
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        {selectedIds.length > 0 && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={handleBulkApprove}
                                    disabled={loading}
                                    size="sm"
                                    variant="default"
                                >
                                    <Check className="mr-2 h-4 w-4" />
                                    Approve ({selectedIds.length})
                                </Button>
                                <Button
                                    onClick={handleBulkReject}
                                    disabled={loading}
                                    size="sm"
                                    variant="destructive"
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Reject ({selectedIds.length})
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={
                                        selectedIds.length > 0 &&
                                        selectedIds.length ===
                                        filteredEnrollments.filter((e) => e.status === 'PENDING').length
                                    }
                                    onCheckedChange={handleSelectAll}
                                />
                            </TableHead>
                            <TableHead>ITS Number</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Requested At</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEnrollments.map((enrollment) => (
                            <TableRow key={enrollment.id}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedIds.includes(enrollment.id)}
                                        onCheckedChange={(checked) =>
                                            handleSelectOne(enrollment.id, checked as boolean)
                                        }
                                        disabled={enrollment.status !== 'PENDING'}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">
                                    {enrollment.user.itsNumber}
                                </TableCell>
                                <TableCell>{enrollment.user.name}</TableCell>
                                <TableCell>{enrollment.user.email || 'N/A'}</TableCell>
                                <TableCell>
                                    {formatDateTimeCode(enrollment.requestedAt)}
                                </TableCell>
                                <TableCell>
                                    <Badge className={statusColors[enrollment.status as keyof typeof statusColors]}>
                                        {enrollment.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {enrollment.status === 'PENDING' && (
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleApprove(enrollment.id)}
                                                disabled={loading}
                                            >
                                                <Check className="h-4 w-4 text-green-600" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleReject(enrollment.id)}
                                                disabled={loading}
                                            >
                                                <X className="h-4 w-4 text-red-600" />
                                            </Button>
                                        </div>
                                    )}
                                    {enrollment.status === 'REJECTED' && enrollment.rejectionReason && (
                                        <span className="text-xs text-muted-foreground">
                                            {enrollment.rejectionReason}
                                        </span>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredEnrollments.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center">
                                    No enrollments found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
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
