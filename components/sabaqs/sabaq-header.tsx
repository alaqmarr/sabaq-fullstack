'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { SabaqDialog } from './sabaq-dialog';

interface SabaqHeaderProps {
    locations: any[];
    users: any[];
    defaultOpen?: boolean;
}

export function SabaqHeader({ locations, users, defaultOpen = false }: SabaqHeaderProps) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <>
            <Button onClick={() => setOpen(true)} size="sm" className="sm:h-10">
                <Plus className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Create Sabaq</span>
                <span className="inline sm:hidden">Create</span>
            </Button>
            <SabaqDialog locations={locations} users={users} open={open} onOpenChange={setOpen} />
        </>
    );
}
