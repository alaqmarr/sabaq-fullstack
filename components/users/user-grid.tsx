'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Edit, Mail, Calendar, Hash, User } from 'lucide-react';
import { useState } from 'react';
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {users.map((user) => (
                    <Card key={user.id} className="glass hover-lift group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 shadow-sm"
                                onClick={() => {
                                    setEditingUser(user);
                                    setIsDialogOpen(true);
                                }}
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        </div>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start gap-2">
                                <CardTitle className="text-lg font-semibold line-clamp-1" title={user.name}>
                                    {user.name}
                                </CardTitle>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="font-mono text-xs">
                                    {user.itsNumber}
                                </Badge>
                                <Badge
                                    variant={user.role === 'ADMIN' || user.role === 'SUPERADMIN' ? 'default' : 'secondary'}
                                    className="text-xs"
                                >
                                    {user.role}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate" title={user.email || 'No email'}>
                                    {user.email || 'No email'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                <span>Joined {format(new Date(user.createdAt), 'MMM d, yyyy')}</span>
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
