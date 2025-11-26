'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Edit, Users, MapPin, Calendar, BookOpen, Trash } from 'lucide-react';
import { useState } from 'react';
import { SabaqDialog } from './sabaq-dialog';
import { SabaqAdminDialog } from './sabaq-admin-dialog';
import { deleteSabaq } from '@/actions/sabaqs';
import { toast } from 'sonner';
import Link from 'next/link';

interface SabaqGridProps {
    sabaqs: any[];
    locations: any[];
}

export function SabaqGrid({ sabaqs, locations }: SabaqGridProps) {
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sabaqs.map((sabaq) => (
                    <Card key={sabaq.id} className="glass hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex gap-1">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 shadow-sm"
                                onClick={() => {
                                    setManagingAdminSabaq(sabaq);
                                    setIsAdminDialogOpen(true);
                                }}
                                title="Manage Admins"
                            >
                                <Users className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 shadow-sm"
                                onClick={() => {
                                    setEditingSabaq(sabaq);
                                    setIsDialogOpen(true);
                                }}
                                title="Edit Sabaq"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        </div>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start gap-2">
                                <CardTitle className="text-lg font-semibold line-clamp-1">
                                    <Link
                                        href={`/dashboard/sabaqs/${sabaq.id}`}
                                        className="hover:underline hover:text-primary transition-colors"
                                        title={sabaq.name}
                                    >
                                        {sabaq.name}
                                    </Link>
                                </CardTitle>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="font-mono text-xs">
                                    {sabaq.level}
                                </Badge>
                                {sabaq.isActive ? (
                                    <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200">Active</Badge>
                                ) : (
                                    <Badge variant="secondary">Inactive</Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <BookOpen className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate" title={sabaq.kitaab}>
                                    {sabaq.kitaab}
                                </span>
                            </div>
                            {sabaq.janab && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Users className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate" title={`Conducted by ${sabaq.janab.name}`}>
                                        {sabaq.janab.name}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                <span className="text-xs">
                                    {format(new Date(sabaq.enrollmentStartsAt), 'dd/MM/yy')} - {format(new Date(sabaq.enrollmentEndsAt), 'dd/MM/yy')}
                                </span>
                            </div>
                            {sabaq.allowLocationAttendance && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">
                                        {sabaq.location?.name || 'Unknown Location'}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {editingSabaq && (
                <SabaqDialog
                    sabaq={editingSabaq}
                    locations={locations}
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
