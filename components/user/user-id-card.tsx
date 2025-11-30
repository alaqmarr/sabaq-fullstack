'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UserIDCardProps {
    user: {
        name?: string | null;
        itsNumber?: string;
        role?: string;
        email?: string | null;
    };
    className?: string;
}

export function UserIDCard({ user, className }: UserIDCardProps) {
    return (
        <Card className={cn("overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950", className)}>
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
            <CardHeader className="text-center pb-2 pt-8">
                <CardTitle className="text-2xl font-bold tracking-tight lowercase">
                    {user.name || 'Unknown User'}
                </CardTitle>
                <Badge variant="outline" className="w-fit mx-auto mt-2 font-mono tracking-widest text-base px-4 py-1">
                    {user.itsNumber || 'N/A'}
                </Badge>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6 pb-8">
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-border/50">
                    <QRCodeSVG
                        value={user.itsNumber || ''}
                        size={180}
                        level="H"
                        includeMargin={true}
                    />
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                    <User className="h-4 w-4" />
                    <span className="font-medium uppercase tracking-wider text-xs">{user.role || 'GUEST'}</span>
                </div>
            </CardContent>
        </Card>
    );
}
