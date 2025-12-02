'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Edit, Users, MapPin, Calendar, BookOpen, Trash, UserCheck } from 'lucide-react';
import { useState } from 'react';
import { SabaqDialog } from './sabaq-dialog';
import { SabaqAdminDialog } from './sabaq-admin-dialog';
import { deleteSabaq } from '@/actions/sabaqs';
import { toast } from 'sonner';
import Link from 'next/link';
import { SabaqCard } from './sabaq-card';

interface SabaqGridProps {
    sabaqs: any[];
    locations: any[];
    users: any[];
}

export function SabaqGrid({ sabaqs, locations, users }: SabaqGridProps) {
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

    if (sabaqs.length === 0) {
        return (
            <div className="text-center py-12 glass rounded-xl border border-dashed">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <BookOpen className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No sabaqs found</p>
                    <p className="text-sm">Create a new sabaq to get started</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {sabaqs.map((sabaq) => {
                    const locationName = locations.find(l => l.id === sabaq.locationId)?.name || '-';
                    const janabName = users.find(u => u.id === sabaq.janabId)?.name || '-';

                    return (
                        <div key={sabaq.id}>
                            <SabaqCard
                                sabaq={sabaq}
                                locationName={locationName}
                                janabName={janabName}
                                onEdit={() => {
                                    setEditingSabaq(sabaq);
                                    setIsDialogOpen(true);
                                }}
                                onManageAdmins={() => {
                                    setManagingAdminSabaq(sabaq);
                                    setIsAdminDialogOpen(true);
                                }}
                                onDelete={() => handleDelete(sabaq.id)}
                            />
                        </div>
                    );
                })}
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
