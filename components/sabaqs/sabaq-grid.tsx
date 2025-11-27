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
import { MotionList, MotionItem } from '@/components/ui/motion-list';

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
            <MotionList className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sabaqs.map((sabaq) => (
                    <MotionItem key={sabaq.id}>
                        <Card className="glass-premium hover-lift group relative overflow-hidden border-0 p-1 h-full">
                            <Link href={`/dashboard/sabaqs/${sabaq.id}`} className="absolute inset-0 z-10" />
                            <CardHeader className="pb-3 pt-6 pl-6 pr-6 relative z-10 pointer-events-none">
                                <div className="flex justify-between items-start gap-3">
                                    <CardTitle className="text-xl font-bold leading-tight line-clamp-2 pointer-events-auto text-balance">
                                        {sabaq.name}
                                    </CardTitle>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                    <Badge variant="outline" className="font-mono text-xs bg-background/50 backdrop-blur-sm">
                                        {sabaq.level}
                                    </Badge>
                                    {sabaq.isActive ? (
                                        <Badge variant="frosted-green">active</Badge>
                                    ) : (
                                        <Badge variant="frosted-slate">inactive</Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 px-6 pb-6 text-sm relative z-10 pointer-events-none">
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
                                        <BookOpen className="h-4 w-4" />
                                    </div>
                                    <span className="truncate font-medium text-foreground/80 lowercase" title={sabaq.kitaab}>
                                        {sabaq.kitaab}
                                    </span>
                                </div>
                                {sabaq.janab && (
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <div className="p-2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                                            <Users className="h-4 w-4" />
                                        </div>
                                        <span className="truncate font-medium text-foreground/80 lowercase" title={`conducted by ${sabaq.janab.name}`}>
                                            {sabaq.janab.name}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-muted-foreground">
                                    <div className="p-2 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
                                        <Calendar className="h-4 w-4" />
                                    </div>
                                    <span className="text-xs font-medium text-foreground/80 lowercase">
                                        {format(new Date(sabaq.enrollmentStartsAt), 'MMM d')} - {format(new Date(sabaq.enrollmentEndsAt), 'MMM d, yyyy')}
                                    </span>
                                </div>
                                {sabaq.allowLocationAttendance && (
                                    <div className="flex items-center gap-3 text-muted-foreground">
                                        <div className="p-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                                            <MapPin className="h-4 w-4" />
                                        </div>
                                        <span className="truncate font-medium text-foreground/80 lowercase">
                                            {sabaq.location?.name || 'unknown location'}
                                        </span>
                                    </div>
                                )}
                            </CardContent>
                            <div className="px-6 pb-6 pt-0 flex flex-wrap items-center justify-center gap-2 pointer-events-auto relative z-20">
                                <Button
                                    variant="frosted-teal"
                                    size="sm"
                                    className="h-8 px-3 gap-1.5 flex-1 min-w-[90px]"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setManagingAdminSabaq(sabaq);
                                        setIsAdminDialogOpen(true);
                                    }}
                                    title="Manage Admins"
                                >
                                    <Users className="h-3.5 w-3.5" />
                                    <span>admins</span>
                                </Button>
                                <Button
                                    variant="frosted-blue"
                                    size="sm"
                                    className="h-8 px-3 gap-1.5 flex-1 min-w-[80px]"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        setEditingSabaq(sabaq);
                                        setIsDialogOpen(true);
                                    }}
                                    title="Edit Sabaq"
                                >
                                    <Edit className="h-3.5 w-3.5" />
                                    <span>edit</span>
                                </Button>
                                <Button
                                    variant="frosted-red"
                                    size="sm"
                                    className="h-8 px-3 gap-1.5 flex-1 min-w-[80px]"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleDelete(sabaq.id);
                                    }}
                                    title="Delete Sabaq"
                                >
                                    <Trash className="h-3.5 w-3.5" />
                                    <span>delete</span>
                                </Button>
                            </div>
                        </Card>
                    </MotionItem>
                ))}
            </MotionList>

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
