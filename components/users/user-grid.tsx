'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Edit, Mail, Calendar, Hash, User } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { UserDialog } from './user-dialog';

interface UserGridProps {
    users: any[];
}

export function UserGrid({ users }: UserGridProps) {
    const [editingUser, setEditingUser] = useState<any>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    if (users.length === 0) {
        return (
            <div className="text-center py-12 glass rounded-xl border border-dashed">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <User className="h-12 w-12 mb-4 opacity-50" />
                    <p className="text-lg font-medium">No users found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {users.map((user) => (
                    <Card key={user.id} className="glass-premium hover-lift group relative overflow-hidden border-0 p-1">
                        <Link href={`/dashboard/users/${user.id}`} className="absolute inset-0 z-0" />
                        <div className="absolute top-0 right-0 p-3 z-20 pointer-events-auto">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 shadow-sm bg-white/80 hover:bg-white dark:bg-black/50 dark:hover:bg-black/70 backdrop-blur-md"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setEditingUser(user);
                                    setIsDialogOpen(true);
                                }}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        </div>
                        <CardHeader className="pb-3 pt-6 pl-6 pr-16 relative z-10 pointer-events-none">
                            <div className="flex justify-between items-start gap-3">
                                <CardTitle className="text-lg font-bold leading-tight line-clamp-1 pointer-events-auto text-balance" title={user.name}>
                                    {user.name}
                                </CardTitle>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <Badge variant="outline" className="font-mono text-xs bg-background/50 backdrop-blur-sm">
                                    {user.itsNumber}
                                </Badge>
                                <Badge
                                    variant={user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? 'default' : 'secondary'}
                                    className={`text-xs border-0 ${user.role === 'ADMIN' || user.role === 'SUPERADMIN'
                                        ? 'glass-info'
                                        : 'glass-subtle'
                                        }`}
                                >
                                    {user.role}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 px-6 pb-6 text-sm relative z-10 pointer-events-none">
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="p-1.5 rounded-full bg-primary/10 text-primary shrink-0">
                                    <Mail className="h-3.5 w-3.5" />
                                </div>
                                <span className="truncate font-medium text-foreground/80" title={user.email || 'No email'}>
                                    {user.email || 'No email'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <div className="p-1.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0">
                                    <Calendar className="h-3.5 w-3.5" />
                                </div>
                                <span className="font-medium text-foreground/80">
                                    Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
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
