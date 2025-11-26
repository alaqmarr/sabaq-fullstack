'use client';

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Edit } from 'lucide-react';
import { useState } from 'react';
import { UserDialog } from './user-dialog';

interface UserTableProps {
    users: any[];
}

export function UserTable({ users }: UserTableProps) {
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <div className="overflow-x-auto rounded-md border glass">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="min-w-[150px]">Name</TableHead>
                            <TableHead className="min-w-[120px]">ITS Number</TableHead>
                            <TableHead className="min-w-[200px]">Email</TableHead>
                            <TableHead className="min-w-[100px]">Role</TableHead>
                            <TableHead className="min-w-[100px]">Joined</TableHead>
                            <TableHead className="text-right min-w-[80px] sticky right-0 bg-card">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                                <TableCell className="font-medium">
                                    <div className="truncate max-w-[200px]" title={user.name}>
                                        {user.name}
                                    </div>
                                </TableCell>
                                <TableCell>{user.itsNumber}</TableCell>
                                <TableCell>
                                    <div className="truncate max-w-[250px]" title={user.email || '-'}>
                                        {user.email || '-'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="whitespace-nowrap">{user.role}</Badge>
                                </TableCell>
                                <TableCell className="whitespace-nowrap">
                                    {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                                </TableCell>
                                <TableCell className="text-right sticky right-0 bg-card">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="hover:scale-110 transition-transform"
                                        onClick={() => {
                                            setEditingUser(user);
                                            setIsDialogOpen(true);
                                        }}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            {editingUser && (
                <UserDialog
                    user={editingUser}
                    open={isDialogOpen}
                    onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) setEditingUser(null);
                    }}
                />
            )}
        </>
    );
}
