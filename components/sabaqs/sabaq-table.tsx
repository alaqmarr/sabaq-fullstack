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
import { Edit, Users } from 'lucide-react';
import { SabaqDialog } from './sabaq-dialog';
import { SabaqAdminDialog } from './sabaq-admin-dialog';
import { deleteSabaq } from '@/actions/sabaqs';
import { toast } from 'sonner';
import { formatDateTimeCode } from '@/lib/date-utils';
import Link from 'next/link';

interface SabaqTableProps {
    sabaqs: any[];
    locations: any[];
    users: any[];
}

export function SabaqTable({ sabaqs, locations, users }: SabaqTableProps) {
    const [editingSabaq, setEditingSabaq] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [managingAdminSabaq, setManagingAdminSabaq] = useState<any>(null);
    const [isAdminDialogOpen, setIsAdminDialogOpen] = useState(false);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this sabaq?')) {
            try {
                await deleteSabaq(id);
                toast.success('Sabaq deleted');
            } catch (error) {
                toast.error('Failed to delete sabaq');
            }
        }
    };

    return (
        <>
            <div className="overflow-x-auto rounded-md border glass">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[180px]">Name</TableHead>
                            <TableHead className="min-w-[150px]">Kitaab</TableHead>
                            <TableHead className="min-w-[100px]">Nisaab</TableHead>
                            <TableHead className="min-w-[220px]">Enrollment Window</TableHead>
                            <TableHead className="min-w-[150px]">Location</TableHead>
                            <TableHead className="text-right min-w-[120px] sticky right-0 bg-card">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sabaqs.map((sabaq) => (
                            <TableRow key={sabaq.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell className="font-medium">
                                    <Link
                                        href={`/dashboard/sabaqs/${sabaq.id}`}
                                        className="hover:underline hover:text-primary transition-colors truncate block max-w-[200px]"
                                        title={sabaq.name}
                                    >
                                        {sabaq.name}
                                    </Link>
                                </TableCell>
                                <TableCell>
                                    <div className="truncate max-w-[180px]" title={sabaq.kitaab}>
                                        {sabaq.kitaab}
                                    </div>
                                </TableCell>
                                <TableCell>{sabaq.level}</TableCell>
                                <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                                    {formatDateTimeCode(sabaq.enrollmentStartsAt)} - {formatDateTimeCode(sabaq.enrollmentEndsAt)}
                                </TableCell>
                                <TableCell>
                                    <div className="truncate max-w-[180px]">
                                        {sabaq.allowLocationAttendance
                                            ? sabaq.location?.name || 'Unknown'
                                            : 'N/A'}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right sticky right-0 bg-card">
                                    <div className="flex gap-1 justify-end">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hover:scale-110 transition-transform h-8 w-8"
                                            onClick={() => {
                                                setManagingAdminSabaq(sabaq);
                                                setIsAdminDialogOpen(true);
                                            }}
                                            title="Manage Admins"
                                        >
                                            <Users className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="hover:scale-110 transition-transform h-8 w-8"
                                            onClick={() => {
                                                setEditingSabaq(sabaq);
                                                setIsDialogOpen(true);
                                            }}
                                            title="Edit Sabaq"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {sabaqs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No sabaqs found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {editingSabaq && (
                <SabaqDialog
                    sabaq={editingSabaq}
                    locations={locations}
                    users={users}
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setEditingSabaq(null);
                    }}
                />
            )}
            {managingAdminSabaq && (
                <SabaqAdminDialog
                    sabaqId={managingAdminSabaq.id}
                    sabaqName={managingAdminSabaq.name}
                    open={isAdminDialogOpen}
                    onOpenChange={(open) => {
                        setIsAdminDialogOpen(open);
                        if (!open) setManagingAdminSabaq(null);
                    }}
                />
            )}
        </>
    );
}
