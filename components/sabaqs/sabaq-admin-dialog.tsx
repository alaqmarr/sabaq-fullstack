'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { UserPlus, Trash } from 'lucide-react';
import { assignSabaqAdmin, removeSabaqAdmin, getSabaqAdmins, getEligibleAdmins } from '@/actions/sabaq-admins';
import { toast } from 'sonner';

import { ITSInput } from '@/components/ui/its-input';

interface SabaqAdminDialogProps {
    sabaqId: string;
    sabaqName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SabaqAdminDialog({ sabaqId, sabaqName, open, onOpenChange }: SabaqAdminDialogProps) {
    const [loading, setLoading] = useState(false);
    const [admins, setAdmins] = useState<any[]>([]);
    const [eligibleAdmins, setEligibleAdmins] = useState<any[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedIts, setSelectedIts] = useState('');

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    const loadData = async () => {
        try {
            const [adminsData, eligibleData] = await Promise.all([
                getSabaqAdmins(sabaqId),
                getEligibleAdmins(),
            ]);
            setAdmins(adminsData);
            setEligibleAdmins(eligibleData);
        } catch (error) {
            toast.error('Failed to load data');
        }
    };

    const handleAssign = async () => {
        if (!selectedUserId) {
            toast.error('Please select a user');
            return;
        }

        setLoading(true);
        try {
            await assignSabaqAdmin(sabaqId, selectedUserId);
            toast.success('Admin assigned successfully');
            setSelectedUserId('');
            setSelectedIts('');
            await loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to assign admin');
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this admin?')) {
            return;
        }

        setLoading(true);
        try {
            await removeSabaqAdmin(sabaqId, userId);
            toast.success('Admin removed successfully');
            await loadData();
        } catch (error: any) {
            toast.error(error.message || 'Failed to remove admin');
        } finally {
            setLoading(false);
        }
    };

    // Filter out already assigned admins from the eligible list
    const availableAdmins = eligibleAdmins.filter(
        (admin) => !admins.some((assigned) => assigned.userId === admin.id)
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Manage Admins - {sabaqName}</DialogTitle>
                    <DialogDescription>
                        Assign ADMIN, MANAGER or ATTENDANCE_INCHARGE role users to manage this sabaq
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Assign New Admin */}
                    {/* Assign New Admin */}
                    <div className="space-y-4">
                        <div className="flex gap-2 items-end">
                            <div className="flex-1">
                                <ITSInput
                                    value={selectedIts}
                                    onChange={setSelectedIts}
                                    onUserFound={(user) => {
                                        if (user) {
                                            setSelectedUserId(user.id);
                                        } else {
                                            setSelectedUserId('');
                                        }
                                    }}
                                    placeholder="Enter Admin ITS Number"
                                    label="Assign New Admin"
                                />
                            </div>
                            <Button onClick={handleAssign} disabled={loading || !selectedUserId} className="mb-0.5">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Assign
                            </Button>
                        </div>
                    </div>

                    {/* Current Admins */}
                    <div>
                        <h3 className="font-semibold mb-2">Current Admins</h3>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {admins.map((admin) => (
                                <div key={admin.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
                                    <div className="flex flex-col">
                                        <span className="font-medium">{admin.user.name}</span>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="font-mono">{admin.user.itsNumber}</span>
                                            <span>•</span>
                                            <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                                {admin.user.role}
                                            </span>
                                            <span>•</span>
                                            <span>{new Date(admin.assignedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                        onClick={() => handleRemove(admin.userId)}
                                        disabled={loading}
                                        title="Remove Admin"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {admins.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                                    No admins assigned yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
