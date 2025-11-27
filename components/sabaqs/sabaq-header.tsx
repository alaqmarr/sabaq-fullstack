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
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl text-cred-heading tracking-tight">Sabaqs</h2>
            <div className="flex items-center space-x-2">
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Create Sabaq
                </Button>
                <SabaqDialog locations={locations} users={users} open={open} onOpenChange={setOpen} />
            </div>
        </div>
    );
}
