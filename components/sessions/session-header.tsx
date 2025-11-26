'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { SessionDialog } from './session-dialog';

interface SessionHeaderProps {
    sabaqId: string;
}

export function SessionHeader({ sabaqId }: SessionHeaderProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-xl font-bold tracking-tight">Sessions</h2>
            <div className="flex items-center space-x-2">
                <Button size="sm" onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Add Session
                </Button>
                <SessionDialog sabaqId={sabaqId} open={open} onOpenChange={setOpen} />
            </div>
        </div>
    );
}
